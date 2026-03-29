from __future__ import annotations

from fastapi import APIRouter, HTTPException

from agents.orchestrator import orchestrator
from models.database import db
from models.schemas import (
    ChatRequest,
    MeetingCreateRequest,
    MeetingDetail,
    OverviewResponse,
    UserRoleUpdateRequest,
    WorkflowSimulateRequest,
)
from services.chat_service import chat_service
from services.scheduler_service import scheduler_service
from services.workflow_engine import workflow_engine
from workflows.scenarios import list_scenarios


router = APIRouter()


SAMPLE_TRANSCRIPT = """Alex: We agreed to ship the meeting dashboard first.
Priya: I will draft the launch brief by 2026-03-25.
Sam: I am blocked on final Jira permissions from IT.
Jordan: We should prepare an audit log walkthrough by 2026-04-03.
Alex: Decision-wise, we will use Redis events instead of direct agent calls.
"""


# -----------------------------------------------------------------------
# Health
# -----------------------------------------------------------------------

@router.get("/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok", "service": "nexuscore-backend"}


# -----------------------------------------------------------------------
# Meeting intelligence (existing)
# -----------------------------------------------------------------------

@router.get("/overview", response_model=OverviewResponse)
async def get_overview() -> OverviewResponse:
    return await db.build_overview()


@router.get("/meetings")
async def list_meetings():
    return await db.list_meetings()


@router.get("/meetings/{meeting_id}", response_model=MeetingDetail)
async def get_meeting(meeting_id: str) -> MeetingDetail:
    meeting = await db.get_meeting(meeting_id)
    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


@router.get("/meetings/{meeting_id}/audit")
async def get_audit(meeting_id: str):
    meeting = await db.get_meeting(meeting_id)
    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return await db.list_audit(meeting_id)


@router.post("/meetings", response_model=MeetingDetail, status_code=201)
async def create_meeting(request: MeetingCreateRequest) -> MeetingDetail:
    return await orchestrator.ingest_meeting(
        title=request.title,
        transcript=request.transcript,
        participants=request.participants,
    )


@router.post("/meetings/demo", response_model=MeetingDetail, status_code=201)
async def create_demo_meeting() -> MeetingDetail:
    return await orchestrator.ingest_meeting(
        title="MeetingMind Demo Session",
        transcript=SAMPLE_TRANSCRIPT,
        participants=["Alex", "Priya", "Sam", "Jordan"],
    )


@router.post("/sweeps/run")
async def run_stalker_sweep() -> dict[str, str]:
    await scheduler_service.run_once()
    return {"status": "sweep-complete"}


# -----------------------------------------------------------------------
# Dashboard / System Metrics
# -----------------------------------------------------------------------

@router.get("/dashboard/metrics")
async def get_dashboard_metrics():
    return await db.get_system_metrics()


@router.get("/dashboard/agents")
async def get_agent_statuses():
    return await db.get_agent_statuses()


# -----------------------------------------------------------------------
# Workflows
# -----------------------------------------------------------------------

@router.get("/workflows/scenarios")
async def get_workflow_scenarios():
    """List all available workflow scenarios."""
    return list_scenarios()


@router.get("/workflows")
async def get_workflows():
    """List all workflow instances."""
    return await db.list_workflows()


@router.get("/workflows/{workflow_id}")
async def get_workflow(workflow_id: str):
    wf = await db.get_workflow(workflow_id)
    if wf is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return wf


@router.post("/workflows/simulate", status_code=201)
async def simulate_workflow(request: WorkflowSimulateRequest):
    """
    Start a workflow simulation.

    The simulation runs asynchronously; step completions stream over
    the ``/ws`` WebSocket channel in real-time.
    """
    try:
        wf = await workflow_engine.start_simulation(
            scenario_id=request.scenario_id,
            chaos_mode=request.chaos_mode,
            step_duration_ms=request.step_duration_ms,
        )
        return wf
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/workflows/{workflow_id}/pause")
async def pause_workflow(workflow_id: str):
    wf = await workflow_engine.pause_workflow(workflow_id)
    if wf is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return wf


@router.post("/workflows/{workflow_id}/resume")
async def resume_workflow(workflow_id: str):
    wf = await workflow_engine.resume_workflow(workflow_id)
    if wf is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return wf


# -----------------------------------------------------------------------
# SLA Monitoring
# -----------------------------------------------------------------------

@router.get("/sla/statuses")
async def get_sla_statuses():
    return await db.get_sla_statuses()


# -----------------------------------------------------------------------
# Agent Collaboration Graph
# -----------------------------------------------------------------------

@router.get("/agents/collab-graph")
async def get_collab_graph(workflow_id: str | None = None):
    edges = await db.get_collab_graph(workflow_id)
    return {"edges": edges}


# -----------------------------------------------------------------------
# Chat
# -----------------------------------------------------------------------

@router.post("/chat")
async def send_chat(request: ChatRequest):
    response = await chat_service.handle_message(
        content=request.message,
        agent=request.agent,
    )
    return response


@router.get("/chat/history")
async def get_chat_history(limit: int = 50):
    return await chat_service.get_history(limit)


# -----------------------------------------------------------------------
# Audit Trail (global)
# -----------------------------------------------------------------------

@router.get("/audit")
async def get_global_audit(limit: int = 100):
    return await db.list_global_audit(limit)


# -----------------------------------------------------------------------
# Users / RBAC
# -----------------------------------------------------------------------

@router.get("/users")
async def list_users():
    return await db.list_users()


@router.put("/users/{user_id}/role")
async def update_user_role(user_id: str, request: UserRoleUpdateRequest):
    user = await db.update_user_role(user_id, request.role)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user
