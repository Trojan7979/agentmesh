"""
WorkflowEngine -- drives workflow simulations server-side.

Runs each workflow step sequentially with configurable timing,
broadcasts events via WebSocket, tracks collaboration edges,
handles chaos mode (failure injection + self-correction), and
maintains an auditable trail of every decision.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from typing import Any

from models.database import db
from models.schemas import (
    AgentEvent,
    AgentName,
    AuditRecord,
    CollabEdge,
    FailureScenario,
    RecoveryStep,
    WorkflowRecord,
    WorkflowStatus,
    WorkflowStep,
    WorkflowStepStatus,
)
from workflows.scenarios import get_scenario

logger = logging.getLogger(__name__)


class WorkflowEngine:
    """Stateful, async workflow execution engine."""

    def __init__(self) -> None:
        self._running_tasks: dict[str, asyncio.Task[None]] = {}
        self._ws_broadcast: Any = None  # set by main.py on startup

    def set_broadcaster(self, broadcast_fn: Any) -> None:
        """Register the WebSocket broadcast function."""
        self._ws_broadcast = broadcast_fn

    async def _broadcast(self, event: AgentEvent) -> None:
        """Push an event to WebSocket clients."""
        if self._ws_broadcast:
            await self._ws_broadcast(event)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def start_simulation(
        self,
        scenario_id: str,
        chaos_mode: bool = False,
        step_duration_ms: int = 2500,
    ) -> WorkflowRecord:
        """
        Create a WorkflowRecord from a scenario and run it asynchronously.
        Returns the initial workflow state immediately; step completions
        stream over WebSocket.
        """
        scenario = get_scenario(scenario_id)
        if scenario is None:
            raise ValueError(f"Unknown scenario: {scenario_id}")

        steps: list[WorkflowStep] = []
        for step_def in scenario["steps"]:
            failure = None
            if step_def.get("can_fail") and step_def.get("failure_scenario"):
                fs = step_def["failure_scenario"]
                failure = FailureScenario(
                    name=fs["name"],
                    detection=fs["detection"],
                    recovery=[
                        RecoveryStep(action=r["action"], agent=r["agent"])
                        for r in fs.get("recovery", [])
                    ],
                )
            steps.append(
                WorkflowStep(
                    id=step_def["id"],
                    name=step_def["name"],
                    agent=step_def["agent"],
                    reasoning=step_def.get("reasoning", ""),
                    confidence=step_def.get("confidence", 0),
                    alternatives=step_def.get("alternatives", []),
                    duration_ms=step_duration_ms,
                    can_fail=step_def.get("can_fail", False),
                    failure_scenario=failure,
                )
            )

        workflow = WorkflowRecord(
            scenario_id=scenario_id,
            name=scenario["name"],
            type=scenario["type"],
            description=scenario.get("description", ""),
            status=WorkflowStatus.RUNNING,
            steps=steps,
            chaos_mode=chaos_mode,
            step_duration_ms=step_duration_ms,
            current_step_idx=0,
        )
        await db.create_workflow(workflow)

        # Emit initial event
        await self._emit_event(
            workflow_id=workflow.id,
            agent=AgentName.NEXUS_ORCHESTRATOR,
            event_type="WORKFLOW_STARTED",
            message=f"Started workflow: {workflow.name} ({workflow.type})",
            metadata={
                "scenario_id": scenario_id,
                "chaos_mode": chaos_mode,
                "total_steps": len(steps),
            },
        )

        # Fire off the background runner
        task = asyncio.create_task(
            self._run_workflow(workflow.id),
            name=f"workflow-{workflow.id}",
        )
        self._running_tasks[workflow.id] = task
        return workflow

    async def pause_workflow(self, workflow_id: str) -> WorkflowRecord | None:
        wf = await db.get_workflow(workflow_id)
        if not wf or wf.status != WorkflowStatus.RUNNING:
            return wf
        wf.status = WorkflowStatus.PAUSED
        await db.update_workflow(wf)
        # Cancel the running task
        task = self._running_tasks.pop(workflow_id, None)
        if task:
            task.cancel()
        await self._emit_event(
            workflow_id=workflow_id,
            agent=AgentName.NEXUS_ORCHESTRATOR,
            event_type="WORKFLOW_PAUSED",
            message=f"Workflow paused: {wf.name}",
        )
        return await db.get_workflow(workflow_id)

    async def resume_workflow(self, workflow_id: str) -> WorkflowRecord | None:
        wf = await db.get_workflow(workflow_id)
        if not wf or wf.status != WorkflowStatus.PAUSED:
            return wf
        wf.status = WorkflowStatus.RUNNING
        await db.update_workflow(wf)
        task = asyncio.create_task(
            self._run_workflow(workflow_id),
            name=f"workflow-{workflow_id}",
        )
        self._running_tasks[workflow_id] = task
        await self._emit_event(
            workflow_id=workflow_id,
            agent=AgentName.NEXUS_ORCHESTRATOR,
            event_type="WORKFLOW_RESUMED",
            message=f"Workflow resumed: {wf.name}",
        )
        return await db.get_workflow(workflow_id)

    # ------------------------------------------------------------------
    # Internal execution loop
    # ------------------------------------------------------------------

    async def _run_workflow(self, workflow_id: str) -> None:
        """Process steps sequentially until done, paused, or failed."""
        try:
            while True:
                wf = await db.get_workflow(workflow_id)
                if not wf:
                    return

                if wf.status != WorkflowStatus.RUNNING:
                    return

                idx = wf.current_step_idx
                if idx >= len(wf.steps):
                    # All steps done
                    wf.status = WorkflowStatus.COMPLETED
                    wf.progress = 100
                    wf.health = 100
                    wf.updated_at = datetime.utcnow()
                    await db.update_workflow(wf)
                    await self._emit_event(
                        workflow_id=workflow_id,
                        agent=AgentName.NEXUS_ORCHESTRATOR,
                        event_type="WORKFLOW_COMPLETED",
                        message=(
                            f"Workflow completed: {wf.name}. "
                            f"{len(wf.steps)} steps, "
                            f"{wf.self_corrections} self-corrections, "
                            f"{wf.human_escalations} escalations."
                        ),
                        metadata={
                            "total_steps": len(wf.steps),
                            "self_corrections": wf.self_corrections,
                            "human_escalations": wf.human_escalations,
                        },
                    )
                    return

                step = wf.steps[idx]

                # Mark step as in-progress
                step.status = WorkflowStepStatus.IN_PROGRESS
                step.started_at = datetime.utcnow()
                now = datetime.utcnow()
                step.time = now.strftime("%I:%M %p")
                wf.updated_at = now
                await db.update_workflow(wf)

                await self._emit_event(
                    workflow_id=workflow_id,
                    agent=self._resolve_agent_name(step.agent),
                    event_type="WORKFLOW_STEP_STARTED",
                    message=f"Step {step.id}: {step.name} -- Agent: {step.agent}",
                    metadata={
                        "step_id": step.id,
                        "step_name": step.name,
                        "agent": step.agent,
                        "confidence": step.confidence,
                        "reasoning": step.reasoning,
                        "alternatives": step.alternatives,
                    },
                )

                # Simulate processing time
                await asyncio.sleep(step.duration_ms / 1000.0)

                # Check for chaos mode failure
                if wf.chaos_mode and step.can_fail and step.failure_scenario:
                    await self._handle_failure(wf, step, idx)
                else:
                    # Normal completion
                    step.status = WorkflowStepStatus.COMPLETED
                    step.completed_at = datetime.utcnow()

                # Update progress
                completed = sum(
                    1 for s in wf.steps
                    if s.status in {WorkflowStepStatus.COMPLETED, WorkflowStepStatus.SELF_CORRECTED}
                )
                wf.progress = int((completed / len(wf.steps)) * 100)
                wf.current_step_idx = idx + 1
                wf.updated_at = datetime.utcnow()
                await db.update_workflow(wf)

                # Record collaboration edge
                if step.agent != "System":
                    await db.add_collab_edge(
                        CollabEdge(
                            from_agent=step.agent,
                            to_agent="Nexus Orchestrator",
                            event=f"STEP_{step.id}_COMPLETED",
                            workflow_id=workflow_id,
                        )
                    )

                await self._emit_event(
                    workflow_id=workflow_id,
                    agent=self._resolve_agent_name(step.agent),
                    event_type="WORKFLOW_STEP_COMPLETED",
                    message=f"Step {step.id} completed: {step.name}",
                    metadata={
                        "step_id": step.id,
                        "step_status": step.status,
                        "progress": wf.progress,
                        "reasoning": step.reasoning,
                        "confidence": step.confidence,
                    },
                )

        except asyncio.CancelledError:
            logger.info("Workflow %s cancelled (paused).", workflow_id)
        except Exception:
            logger.exception("Workflow %s failed with error.", workflow_id)
            wf = await db.get_workflow(workflow_id)
            if wf:
                wf.status = WorkflowStatus.FAILED
                await db.update_workflow(wf)
        finally:
            self._running_tasks.pop(workflow_id, None)

    async def _handle_failure(
        self, wf: WorkflowRecord, step: WorkflowStep, idx: int
    ) -> None:
        """Inject a failure, run recovery steps, then mark as self-corrected."""
        fs = step.failure_scenario
        if not fs:
            step.status = WorkflowStepStatus.COMPLETED
            return

        # Emit failure detected
        await self._emit_event(
            workflow_id=wf.id,
            agent=self._resolve_agent_name(step.agent),
            event_type="WORKFLOW_FAILURE_DETECTED",
            message=f"FAILURE at step {step.id}: {fs.name} -- {fs.detection}",
            metadata={
                "step_id": step.id,
                "failure_name": fs.name,
                "detection": fs.detection,
            },
        )

        # Health dips during failure
        wf.health = max(wf.health - 25, 30)
        await db.update_workflow(wf)

        # Run recovery steps
        for ri, recovery in enumerate(fs.recovery):
            recovery.status = WorkflowStepStatus.IN_PROGRESS
            await db.update_workflow(wf)

            await self._emit_event(
                workflow_id=wf.id,
                agent=self._resolve_agent_name(recovery.agent),
                event_type="WORKFLOW_RECOVERY_STEP",
                message=f"Recovery {ri + 1}/{len(fs.recovery)}: {recovery.action}",
                metadata={
                    "recovery_index": ri,
                    "recovery_agent": recovery.agent,
                    "recovery_action": recovery.action,
                },
            )

            # Record collab edge for every recovery handoff
            if ri > 0:
                prev_agent = fs.recovery[ri - 1].agent
                if prev_agent != recovery.agent:
                    await db.add_collab_edge(
                        CollabEdge(
                            from_agent=prev_agent,
                            to_agent=recovery.agent,
                            event=f"RECOVERY_{ri}",
                            workflow_id=wf.id,
                        )
                    )

            await asyncio.sleep(1.5)  # recovery step timing

            recovery.status = WorkflowStepStatus.COMPLETED
            recovery.completed_at = datetime.utcnow()
            await db.update_workflow(wf)

        # Mark step as self-corrected
        step.status = WorkflowStepStatus.SELF_CORRECTED
        step.detail = f"Self-corrected: {fs.name}"
        step.completed_at = datetime.utcnow()
        wf.self_corrections += 1
        wf.health = min(wf.health + 20, 100)

        await self._emit_event(
            workflow_id=wf.id,
            agent=AgentName.NEXUS_ORCHESTRATOR,
            event_type="WORKFLOW_SELF_CORRECTED",
            message=f"Step {step.id} self-corrected after: {fs.name}",
            metadata={
                "step_id": step.id,
                "failure_name": fs.name,
                "recovery_steps_count": len(fs.recovery),
            },
        )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    async def _emit_event(
        self,
        *,
        workflow_id: str,
        agent: AgentName,
        event_type: str,
        message: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """Create an AgentEvent, store audit, and broadcast via WebSocket."""
        event = AgentEvent(
            workflow_id=workflow_id,
            agent=agent,
            type=event_type,
            message=message,
            metadata=metadata or {},
        )
        await self._broadcast(event)

        # Store audit record
        audit = AuditRecord(
            event=event_type,
            agent=agent,
            workflow_id=workflow_id,
            payload={"message": message, **(metadata or {})},
            reasoning=metadata.get("reasoning", "") if metadata else "",
        )
        await db.add_audit(None, audit)

    @staticmethod
    def _resolve_agent_name(agent_str: str) -> AgentName:
        """Map display agent names to AgentName enum values."""
        mapping = {
            "system": AgentName.SYSTEM,
            "nexus orchestrator": AgentName.NEXUS_ORCHESTRATOR,
            "data fetcher v4": AgentName.DATA_FETCHER,
            "action exec alpha": AgentName.ACTION_EXECUTOR,
            "shield verifier": AgentName.SHIELD_VERIFIER,
        }
        return mapping.get(agent_str.lower(), AgentName.SYSTEM)


# Module-level singleton
workflow_engine = WorkflowEngine()
