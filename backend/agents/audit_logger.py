from __future__ import annotations

from typing import Any

from agents.base_agent import BaseAgent
from api.websocket import ws_manager
from models.database import db
from models.schemas import AgentEvent, AgentName, AuditRecord


class AuditLogger(BaseAgent):
    name = AgentName.AUDIT
    listens_to = "*"

    async def process(self, event: str, payload: dict[str, Any]) -> None:
        meeting_id = payload.get("meeting_id")
        agent = AgentName(payload.get("agent", AgentName.SYSTEM))
        reasoning = str(payload.get("reasoning", ""))

        record = AuditRecord(
            event=event,
            agent=agent,
            meeting_id=meeting_id,
            payload=payload,
            reasoning=reasoning,
        )
        await db.add_audit(meeting_id, record)

        message = self._summarize(event, payload)
        if not message:
            return

        agent_event = AgentEvent(
            meeting_id=meeting_id,
            agent=agent,
            type=event.lower(),
            message=message,
            metadata=payload.get("metadata", {}),
        )
        if meeting_id:
            await db.add_event(meeting_id, agent_event)
        await ws_manager.broadcast(agent_event)

    def _summarize(self, event: str, payload: dict[str, Any]) -> str:
        if event == "AGENT_ACTIVITY":
            return str(payload.get("message", "")).strip()
        if event == "TRANSCRIPT_READY":
            return f"Transcript ready with {len(payload.get('segments', []))} speaker segments."
        if event == "DECISIONS_EXTRACTED":
            return (
                f"Extractor found {len(payload.get('decisions', []))} decisions, "
                f"{len(payload.get('actions', []))} actions, and "
                f"{len(payload.get('blockers', []))} blockers."
            )
        if event == "TASKS_CREATED":
            return f"Dispatcher created {len(payload.get('tasks', []))} tracked tasks."
        if event == "ESCALATION_NEEDED":
            return f"Stalker flagged overdue work after {payload.get('days_late', 0)} late day(s)."
        if event == "ESCALATION_FIRED":
            return f"Escalation sent to {payload.get('manager', '@manager')}."
        return ""
