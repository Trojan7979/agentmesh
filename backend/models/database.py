from __future__ import annotations

import asyncio
from datetime import date, datetime
from typing import Any

from models.schemas import (
    AgentEvent,
    AgentStatusRecord,
    AuditRecord,
    ChatMessage,
    CollabEdge,
    DecisionRecord,
    MeetingDetail,
    MeetingStatus,
    MeetingSummary,
    OverviewResponse,
    OverdueTask,
    SLARule,
    SLAStatus,
    SLASeverity,
    SystemMetrics,
    TaskRecord,
    TaskStatus,
    TranscriptSegment,
    UserRecord,
    UserRole,
    WorkflowRecord,
    WorkflowStatus,
)


class InMemoryDatabase:
    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._meetings: dict[str, MeetingDetail] = {}
        self._workflows: dict[str, WorkflowRecord] = {}
        self._collab_edges: list[CollabEdge] = []
        self._chat_messages: list[ChatMessage] = []
        self._global_audit: list[AuditRecord] = []
        self._users: dict[str, UserRecord] = {}
        self._metrics = SystemMetrics()
        self._sla_rules: dict[str, SLARule] = {}

        self._init_seed_data()

    def _init_seed_data(self) -> None:
        """Pre-populate demo users and SLA rules."""
        seed_users = [
            UserRecord(
                name="Admin User",
                email="admin@nexuscore.ai",
                role=UserRole.SUPER_ADMIN,
            ),
            UserRecord(
                name="Sarah Chen",
                email="sarah@nexuscore.ai",
                role=UserRole.VP_ENGINEERING,
            ),
            UserRecord(
                name="James Rodriguez",
                email="james@nexuscore.ai",
                role=UserRole.PRODUCT_MANAGER,
            ),
        ]
        for u in seed_users:
            self._users[u.id] = u

        seed_sla_rules = [
            SLARule(workflow_type="Procure-to-Pay", max_duration_hours=4.0, warning_threshold_pct=0.75),
            SLARule(workflow_type="Employee Onboarding", max_duration_hours=2.0, warning_threshold_pct=0.80),
            SLARule(workflow_type="Contract Lifecycle", max_duration_hours=6.0, warning_threshold_pct=0.70),
        ]
        for rule in seed_sla_rules:
            self._sla_rules[rule.id] = rule

    async def init(self) -> None:
        return None

    async def reset(self) -> None:
        async with self._lock:
            self._meetings.clear()
            self._workflows.clear()
            self._collab_edges.clear()
            self._chat_messages.clear()
            self._global_audit.clear()
            self._metrics = SystemMetrics()
            self._init_seed_data()

    # ------------------------------------------------------------------
    # Meetings (existing)
    # ------------------------------------------------------------------

    async def create_meeting(
        self,
        *,
        title: str,
        transcript: str,
        participants: list[str],
    ) -> MeetingDetail:
        meeting = MeetingDetail(
            title=title,
            transcript=transcript,
            participants=participants,
        )
        async with self._lock:
            self._meetings[meeting.id] = meeting
            return meeting.model_copy(deep=True)

    async def list_meetings(self) -> list[MeetingSummary]:
        async with self._lock:
            meetings = sorted(
                self._meetings.values(),
                key=lambda item: item.created_at,
                reverse=True,
            )
            return [
                MeetingSummary(
                    id=meeting.id,
                    title=meeting.title,
                    status=meeting.status,
                    participants_count=len(meeting.participants),
                    task_count=len(meeting.tasks),
                    decision_count=len(meeting.decisions),
                    created_at=meeting.created_at,
                )
                for meeting in meetings
            ]

    async def get_meeting(self, meeting_id: str) -> MeetingDetail | None:
        async with self._lock:
            meeting = self._meetings.get(meeting_id)
            return meeting.model_copy(deep=True) if meeting else None

    async def set_status(self, meeting_id: str, status: MeetingStatus) -> None:
        async with self._lock:
            meeting = self._meetings[meeting_id]
            meeting.status = status
            meeting.updated_at = datetime.utcnow()

    async def set_duration(self, meeting_id: str, duration_seconds: int) -> None:
        async with self._lock:
            meeting = self._meetings[meeting_id]
            meeting.duration_seconds = duration_seconds
            meeting.updated_at = datetime.utcnow()

    async def store_segments(
        self,
        meeting_id: str,
        segments: list[TranscriptSegment],
    ) -> None:
        async with self._lock:
            meeting = self._meetings[meeting_id]
            meeting.transcript_segments = [segment.model_copy(deep=True) for segment in segments]
            meeting.updated_at = datetime.utcnow()

    async def store_extraction(
        self,
        meeting_id: str,
        *,
        decisions: list[DecisionRecord],
        blockers: list[DecisionRecord],
    ) -> None:
        async with self._lock:
            meeting = self._meetings[meeting_id]
            meeting.decisions = [
                decision.model_copy(deep=True) for decision in [*decisions, *blockers]
            ]
            meeting.updated_at = datetime.utcnow()

    async def add_tasks(self, meeting_id: str, tasks: list[TaskRecord]) -> None:
        async with self._lock:
            meeting = self._meetings[meeting_id]
            meeting.tasks.extend(task.model_copy(deep=True) for task in tasks)
            meeting.updated_at = datetime.utcnow()

    async def update_task_status(
        self,
        meeting_id: str,
        task_id: str,
        status: TaskStatus,
    ) -> None:
        async with self._lock:
            meeting = self._meetings[meeting_id]
            for task in meeting.tasks:
                if task.id == task_id:
                    task.status = status
                    task.updated_at = datetime.utcnow()
                    task.last_activity_at = datetime.utcnow()
                    break

    async def add_event(self, meeting_id: str, event: AgentEvent) -> None:
        async with self._lock:
            meeting = self._meetings.get(meeting_id)
            if not meeting:
                return
            meeting.events.append(event.model_copy(deep=True))
            meeting.updated_at = datetime.utcnow()

    async def add_audit(self, meeting_id: str | None, record: AuditRecord) -> None:
        async with self._lock:
            self._global_audit.append(record.model_copy(deep=True))
            if not meeting_id:
                return
            meeting = self._meetings.get(meeting_id)
            if not meeting:
                return
            meeting.audit.append(record.model_copy(deep=True))
            meeting.updated_at = datetime.utcnow()

    async def list_audit(self, meeting_id: str) -> list[AuditRecord]:
        async with self._lock:
            meeting = self._meetings.get(meeting_id)
            if not meeting:
                return []
            return [record.model_copy(deep=True) for record in meeting.audit]

    async def list_events(self, meeting_id: str) -> list[AgentEvent]:
        async with self._lock:
            meeting = self._meetings.get(meeting_id)
            if not meeting:
                return []
            return [event.model_copy(deep=True) for event in meeting.events]

    async def list_overdue_tasks(self, today: date | None = None) -> list[OverdueTask]:
        today = today or date.today()
        overdue: list[OverdueTask] = []
        async with self._lock:
            for meeting in self._meetings.values():
                for task in meeting.tasks:
                    if not task.due_date:
                        continue
                    if task.status == TaskStatus.DONE:
                        continue
                    if task.due_date >= today:
                        continue
                    overdue.append(
                        OverdueTask(
                            meeting_id=meeting.id,
                            meeting_title=meeting.title,
                            task=task.model_copy(deep=True),
                            days_late=(today - task.due_date).days,
                        )
                    )
        return overdue

    async def build_overview(self) -> OverviewResponse:
        meetings = await self.list_meetings()
        overdue = await self.list_overdue_tasks()
        detailed_meetings = [await self.get_meeting(item.id) for item in meetings]
        active_meetings = sum(
            1 for meeting in detailed_meetings if meeting and meeting.status == MeetingStatus.PROCESSING
        )
        open_tasks = sum(
            1
            for meeting in detailed_meetings
            if meeting
            for task in meeting.tasks
            if task.status in {TaskStatus.OPEN, TaskStatus.IN_PROGRESS, TaskStatus.OVERDUE}
        )
        audit_records = sum(len(meeting.audit) for meeting in detailed_meetings if meeting)
        return OverviewResponse(
            meetings=meetings,
            active_meetings=active_meetings,
            open_tasks=open_tasks,
            overdue_tasks=len(overdue),
            audit_records=audit_records,
        )

    # ------------------------------------------------------------------
    # Workflows (new)
    # ------------------------------------------------------------------

    async def create_workflow(self, workflow: WorkflowRecord) -> WorkflowRecord:
        async with self._lock:
            self._workflows[workflow.id] = workflow
            self._metrics.active_workflows = sum(
                1 for w in self._workflows.values()
                if w.status in {WorkflowStatus.RUNNING, WorkflowStatus.PENDING}
            )
            return workflow.model_copy(deep=True)

    async def get_workflow(self, workflow_id: str) -> WorkflowRecord | None:
        async with self._lock:
            wf = self._workflows.get(workflow_id)
            return wf.model_copy(deep=True) if wf else None

    async def list_workflows(self) -> list[WorkflowRecord]:
        async with self._lock:
            workflows = sorted(
                self._workflows.values(),
                key=lambda w: w.created_at,
                reverse=True,
            )
            return [w.model_copy(deep=True) for w in workflows]

    async def update_workflow(self, workflow: WorkflowRecord) -> None:
        async with self._lock:
            self._workflows[workflow.id] = workflow.model_copy(deep=True)
            self._metrics.active_workflows = sum(
                1 for w in self._workflows.values()
                if w.status in {WorkflowStatus.RUNNING, WorkflowStatus.PENDING}
            )
            self._metrics.completed_workflows = sum(
                1 for w in self._workflows.values()
                if w.status == WorkflowStatus.COMPLETED
            )
            self._metrics.self_corrections = sum(
                w.self_corrections for w in self._workflows.values()
            )
            self._metrics.human_escalations = sum(
                w.human_escalations for w in self._workflows.values()
            )

    # ------------------------------------------------------------------
    # System metrics
    # ------------------------------------------------------------------

    async def get_system_metrics(self) -> SystemMetrics:
        async with self._lock:
            total_steps = 0
            completed_steps = 0
            for wf in self._workflows.values():
                total_steps += len(wf.steps)
                completed_steps += sum(
                    1 for s in wf.steps
                    if s.status in {"completed", "self-corrected"}
                )
            self._metrics.tasks_automated = completed_steps
            if total_steps > 0:
                rate = ((completed_steps - self._metrics.human_escalations) / max(total_steps, 1)) * 100
                self._metrics.autonomy_rate = f"{min(rate, 99.99):.2f}%"
            return self._metrics.model_copy(deep=True)

    async def increment_tasks_automated(self, count: int = 1) -> None:
        async with self._lock:
            self._metrics.tasks_automated += count

    # ------------------------------------------------------------------
    # Agent statuses
    # ------------------------------------------------------------------

    async def get_agent_statuses(self) -> list[AgentStatusRecord]:
        """Return the canonical list of swarm agents with live statuses."""
        agents = [
            AgentStatusRecord(
                id="ag-orchestrator",
                name="Nexus Orchestrator",
                role="Workflow Manager",
                avatar="Cpu",
            ),
            AgentStatusRecord(
                id="ag-intel",
                name="MeetIntel Core",
                role="Meeting Intelligence",
                avatar="BrainCircuit",
            ),
            AgentStatusRecord(
                id="ag-retrieval",
                name="Data Fetcher v4",
                role="Context Retrieval",
                avatar="Database",
            ),
            AgentStatusRecord(
                id="ag-executor",
                name="Action Exec Alpha",
                role="Execution Engine",
                avatar="Zap",
            ),
            AgentStatusRecord(
                id="ag-verifier",
                name="Shield Verifier",
                role="Quality Assurance",
                avatar="ShieldCheck",
            ),
        ]

        async with self._lock:
            # Derive statuses from active workflows
            active_tasks: dict[str, str] = {}
            for wf in self._workflows.values():
                if wf.status != WorkflowStatus.RUNNING:
                    continue
                for step in wf.steps:
                    if step.status == "in-progress":
                        active_tasks[step.agent] = step.name

            for agent in agents:
                agent_key = agent.name
                if agent_key in active_tasks:
                    agent.status = "active"
                    agent.current_task = active_tasks[agent_key]
                else:
                    agent.status = "idle"
                    agent.current_task = "Awaiting next query"

            # Compute success rates from completed workflows
            total_steps_by_agent: dict[str, int] = {}
            success_steps_by_agent: dict[str, int] = {}
            for wf in self._workflows.values():
                for step in wf.steps:
                    total_steps_by_agent[step.agent] = total_steps_by_agent.get(step.agent, 0) + 1
                    if step.status in {"completed", "self-corrected"}:
                        success_steps_by_agent[step.agent] = success_steps_by_agent.get(step.agent, 0) + 1

            for agent in agents:
                total = total_steps_by_agent.get(agent.name, 0)
                success = success_steps_by_agent.get(agent.name, 0)
                if total > 0:
                    agent.success_rate = round((success / total) * 100, 1)

        return agents

    # ------------------------------------------------------------------
    # Collaboration graph
    # ------------------------------------------------------------------

    async def add_collab_edge(self, edge: CollabEdge) -> None:
        async with self._lock:
            self._collab_edges.append(edge.model_copy(deep=True))

    async def get_collab_graph(
        self, workflow_id: str | None = None
    ) -> list[CollabEdge]:
        async with self._lock:
            if workflow_id:
                return [
                    e.model_copy(deep=True)
                    for e in self._collab_edges
                    if e.workflow_id == workflow_id
                ]
            return [e.model_copy(deep=True) for e in self._collab_edges]

    # ------------------------------------------------------------------
    # SLA
    # ------------------------------------------------------------------

    async def get_sla_statuses(self) -> list[SLAStatus]:
        results: list[SLAStatus] = []
        async with self._lock:
            for wf in self._workflows.values():
                if wf.status in {WorkflowStatus.COMPLETED, WorkflowStatus.FAILED}:
                    continue
                # Find matching SLA rule
                rule = next(
                    (r for r in self._sla_rules.values() if r.workflow_type == wf.type),
                    None,
                )
                if not rule:
                    continue

                elapsed = (datetime.utcnow() - wf.created_at).total_seconds()
                max_seconds = rule.max_duration_hours * 3600
                ratio = elapsed / max_seconds if max_seconds > 0 else 0

                if ratio >= 1.0:
                    severity = SLASeverity.CRITICAL
                    status = "breached"
                elif ratio >= rule.warning_threshold_pct:
                    severity = SLASeverity.HIGH
                    status = "at-risk"
                elif ratio >= 0.5:
                    severity = SLASeverity.MEDIUM
                    status = "warning"
                else:
                    severity = SLASeverity.LOW
                    status = "healthy"

                predicted = (
                    elapsed / max(wf.progress / 100, 0.01)
                    if wf.progress > 0
                    else max_seconds
                )

                results.append(
                    SLAStatus(
                        workflow_id=wf.id,
                        workflow_name=wf.name,
                        workflow_type=wf.type,
                        rule=rule,
                        elapsed_seconds=round(elapsed, 1),
                        predicted_completion_seconds=round(predicted, 1),
                        breach_risk=round(min(ratio, 1.0), 3),
                        severity=severity,
                        status=status,
                    )
                )
        return results

    # ------------------------------------------------------------------
    # Chat
    # ------------------------------------------------------------------

    async def add_chat_message(self, message: ChatMessage) -> None:
        async with self._lock:
            self._chat_messages.append(message.model_copy(deep=True))

    async def list_chat_messages(self, limit: int = 50) -> list[ChatMessage]:
        async with self._lock:
            return [
                m.model_copy(deep=True)
                for m in self._chat_messages[-limit:]
            ]

    # ------------------------------------------------------------------
    # Users / RBAC
    # ------------------------------------------------------------------

    async def list_users(self) -> list[UserRecord]:
        async with self._lock:
            return [u.model_copy(deep=True) for u in self._users.values()]

    async def get_user(self, user_id: str) -> UserRecord | None:
        async with self._lock:
            u = self._users.get(user_id)
            return u.model_copy(deep=True) if u else None

    async def get_user_by_email(self, email: str) -> UserRecord | None:
        async with self._lock:
            for u in self._users.values():
                if u.email == email:
                    return u.model_copy(deep=True)
            return None

    async def update_user_role(self, user_id: str, role: UserRole) -> UserRecord | None:
        async with self._lock:
            u = self._users.get(user_id)
            if not u:
                return None
            u.role = role
            return u.model_copy(deep=True)

    # ------------------------------------------------------------------
    # Global audit
    # ------------------------------------------------------------------

    async def list_global_audit(self, limit: int = 100) -> list[AuditRecord]:
        async with self._lock:
            return [
                r.model_copy(deep=True)
                for r in sorted(self._global_audit, key=lambda r: r.timestamp, reverse=True)[:limit]
            ]


db = InMemoryDatabase()


async def init_db() -> None:
    await db.init()
