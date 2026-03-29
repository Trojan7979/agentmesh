from __future__ import annotations

from datetime import date, datetime
from enum import StrEnum
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:10]}"


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class MeetingStatus(StrEnum):
    PROCESSING = "processing"
    COMPLETE = "complete"
    FAILED = "failed"


class TaskStatus(StrEnum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    OVERDUE = "overdue"


class WorkflowStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    WARNING = "warning"


class WorkflowStepStatus(StrEnum):
    PENDING = "pending"
    IN_PROGRESS = "in-progress"
    COMPLETED = "completed"
    SELF_CORRECTED = "self-corrected"
    ESCALATED = "escalated"
    FAILED = "failed"


class SLASeverity(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AgentName(StrEnum):
    SCRIBE = "scribe"
    EXTRACTOR = "extractor"
    DISPATCHER = "dispatcher"
    STALKER = "stalker"
    ESCALATION = "escalation"
    AUDIT = "audit"
    SYSTEM = "system"
    # New multi-agent collaboration agents
    NEXUS_ORCHESTRATOR = "nexus_orchestrator"
    DATA_FETCHER = "data_fetcher"
    ACTION_EXECUTOR = "action_executor"
    SHIELD_VERIFIER = "shield_verifier"
    SLA_MONITOR = "sla_monitor"


class UserRole(StrEnum):
    SUPER_ADMIN = "Super Admin"
    VP_ENGINEERING = "VP Engineering"
    PRODUCT_MANAGER = "Product Manager"
    VIEWER = "Viewer"


# ---------------------------------------------------------------------------
# Meeting intelligence models (existing)
# ---------------------------------------------------------------------------

class TranscriptSegment(BaseModel):
    id: str = Field(default_factory=lambda: new_id("seg"))
    speaker: str
    text: str
    start_seconds: int
    end_seconds: int


class DecisionRecord(BaseModel):
    id: str = Field(default_factory=lambda: new_id("decision"))
    kind: str
    summary: str
    owner: str | None = None
    deadline: date | None = None
    confidence: float = 0.0
    source_segment: str


class TaskDraft(BaseModel):
    title: str
    owner: str
    deadline: date | None = None
    context: str
    confidence: float = 0.0
    source_segment: str


class TaskRecord(BaseModel):
    id: str = Field(default_factory=lambda: new_id("task"))
    title: str
    owner: str
    owner_slack: str
    due_date: date | None = None
    status: TaskStatus = TaskStatus.OPEN
    jira_key: str | None = None
    source_segment: str
    context: str
    confidence: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_activity_at: datetime = Field(default_factory=datetime.utcnow)


class AgentEvent(BaseModel):
    id: str = Field(default_factory=lambda: new_id("evt"))
    meeting_id: str | None = None
    workflow_id: str | None = None
    agent: AgentName = AgentName.SYSTEM
    type: str
    message: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class AuditRecord(BaseModel):
    id: str = Field(default_factory=lambda: new_id("audit"))
    event: str
    agent: AgentName = AgentName.SYSTEM
    meeting_id: str | None = None
    workflow_id: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)
    reasoning: str = ""
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class MeetingDetail(BaseModel):
    id: str = Field(default_factory=lambda: new_id("meeting"))
    title: str
    participants: list[str] = Field(default_factory=list)
    transcript: str = ""
    duration_seconds: int = 0
    status: MeetingStatus = MeetingStatus.PROCESSING
    transcript_segments: list[TranscriptSegment] = Field(default_factory=list)
    decisions: list[DecisionRecord] = Field(default_factory=list)
    tasks: list[TaskRecord] = Field(default_factory=list)
    events: list[AgentEvent] = Field(default_factory=list)
    audit: list[AuditRecord] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class MeetingSummary(BaseModel):
    id: str
    title: str
    status: MeetingStatus
    participants_count: int
    task_count: int
    decision_count: int
    created_at: datetime


class OverviewResponse(BaseModel):
    meetings: list[MeetingSummary]
    active_meetings: int
    open_tasks: int
    overdue_tasks: int
    audit_records: int


class ExtractionResult(BaseModel):
    decisions: list[DecisionRecord] = Field(default_factory=list)
    actions: list[TaskDraft] = Field(default_factory=list)
    blockers: list[DecisionRecord] = Field(default_factory=list)


class OverdueTask(BaseModel):
    meeting_id: str
    meeting_title: str
    task: TaskRecord
    days_late: int


class MeetingCreateRequest(BaseModel):
    title: str = "Weekly Product Sync"
    transcript: str
    participants: list[str] = Field(default_factory=list)


class ZoomWebhookPayload(BaseModel):
    title: str = "Zoom Meeting Import"
    transcript: str
    participants: list[str] = Field(default_factory=list)
    external_meeting_id: str | None = None


# ---------------------------------------------------------------------------
# Workflow orchestration models (new)
# ---------------------------------------------------------------------------

class RecoveryStep(BaseModel):
    action: str
    agent: str
    status: WorkflowStepStatus = WorkflowStepStatus.PENDING
    completed_at: datetime | None = None


class FailureScenario(BaseModel):
    name: str
    detection: str
    recovery: list[RecoveryStep] = Field(default_factory=list)


class WorkflowStep(BaseModel):
    id: int
    name: str
    agent: str
    status: WorkflowStepStatus = WorkflowStepStatus.PENDING
    reasoning: str = ""
    confidence: float = 0.0
    alternatives: list[str] = Field(default_factory=list)
    detail: str | None = None
    duration_ms: int = 2000
    can_fail: bool = False
    failure_scenario: FailureScenario | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    time: str = ""


class WorkflowRecord(BaseModel):
    id: str = Field(default_factory=lambda: new_id("wf"))
    scenario_id: str = ""
    name: str
    type: str
    description: str = ""
    status: WorkflowStatus = WorkflowStatus.PENDING
    health: int = 100
    progress: int = 0
    steps: list[WorkflowStep] = Field(default_factory=list)
    chaos_mode: bool = False
    step_duration_ms: int = 2500
    current_step_idx: int = -1
    self_corrections: int = 0
    human_escalations: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# SLA models
# ---------------------------------------------------------------------------

class SLARule(BaseModel):
    id: str = Field(default_factory=lambda: new_id("sla"))
    workflow_type: str
    max_duration_hours: float = 24.0
    warning_threshold_pct: float = 0.75


class SLAStatus(BaseModel):
    workflow_id: str
    workflow_name: str
    workflow_type: str
    rule: SLARule
    elapsed_seconds: float = 0.0
    predicted_completion_seconds: float = 0.0
    breach_risk: float = 0.0
    severity: SLASeverity = SLASeverity.LOW
    status: str = "healthy"


# ---------------------------------------------------------------------------
# Agent status / collaboration models
# ---------------------------------------------------------------------------

class AgentStatusRecord(BaseModel):
    id: str
    name: str
    role: str
    status: str = "idle"
    success_rate: float = 99.0
    current_task: str = "Awaiting next query"
    avatar: str = "Cpu"


class CollabEdge(BaseModel):
    id: str = Field(default_factory=lambda: new_id("collab"))
    from_agent: str
    to_agent: str
    event: str
    workflow_id: str | None = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# System metrics
# ---------------------------------------------------------------------------

class SystemMetrics(BaseModel):
    active_workflows: int = 0
    completed_workflows: int = 0
    tasks_automated: int = 0
    human_escalations: int = 0
    self_corrections: int = 0
    uptime: str = "99.99%"
    autonomy_rate: str = "99.92%"


# ---------------------------------------------------------------------------
# Chat models
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: new_id("msg"))
    role: str = "user"  # "user" or "agent"
    agent_name: str | None = None
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ChatRequest(BaseModel):
    message: str
    agent: str | None = None


# ---------------------------------------------------------------------------
# User / RBAC models
# ---------------------------------------------------------------------------

class UserRecord(BaseModel):
    id: str = Field(default_factory=lambda: new_id("user"))
    name: str
    email: str
    role: UserRole = UserRole.VIEWER
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserRoleUpdateRequest(BaseModel):
    role: UserRole


# ---------------------------------------------------------------------------
# Workflow API request models
# ---------------------------------------------------------------------------

class WorkflowSimulateRequest(BaseModel):
    scenario_id: str
    chaos_mode: bool = False
    step_duration_ms: int = 2500
