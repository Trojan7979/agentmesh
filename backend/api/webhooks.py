from __future__ import annotations

from fastapi import APIRouter

from agents.orchestrator import orchestrator
from models.schemas import MeetingDetail, ZoomWebhookPayload


webhooks_router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@webhooks_router.post("/zoom", response_model=MeetingDetail, status_code=202)
async def zoom_webhook(payload: ZoomWebhookPayload) -> MeetingDetail:
    return await orchestrator.ingest_meeting(
        title=payload.title,
        transcript=payload.transcript,
        participants=payload.participants,
    )
