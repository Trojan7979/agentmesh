from __future__ import annotations

from agents.audit_logger import AuditLogger
from agents.dispatcher_agent import DispatcherAgent
from agents.escalation_agent import EscalationAgent
from agents.extractor_agent import ExtractorAgent
from agents.scribe_agent import ScribeAgent
from agents.stalker_agent import StalkerAgent
from models.database import db
from models.schemas import MeetingDetail
from services.redis_service import RedisService
from services.scheduler_service import register_sweep


class Orchestrator:
    def __init__(self) -> None:
        self.scribe = ScribeAgent()
        self.extractor = ExtractorAgent()
        self.dispatcher = DispatcherAgent()
        self.stalker = StalkerAgent()
        self.escalation = EscalationAgent()
        self.audit = AuditLogger()
        self._started = False

    async def start(self) -> None:
        if self._started:
            return

        agents = [
            self.extractor,
            self.dispatcher,
            self.escalation,
            self.audit,
        ]
        for agent in agents:
            if agent.listens_to is None:
                continue
            await RedisService.subscribe(agent.listens_to, agent.process)

        register_sweep(self.stalker.run_sweep)
        self._started = True

    async def ingest_meeting(
        self,
        *,
        title: str,
        transcript: str,
        participants: list[str],
    ) -> MeetingDetail:
        meeting = await db.create_meeting(
            title=title,
            transcript=transcript,
            participants=participants,
        )
        await self.scribe.process(
            "INGEST_MEETING",
            {
                "meeting_id": meeting.id,
                "transcript": transcript,
                "participants": participants,
            },
        )
        current = await db.get_meeting(meeting.id)
        if current is None:
            raise RuntimeError("Meeting disappeared during orchestration.")
        return current

    async def run_sweep_once(self) -> None:
        await self.stalker.run_sweep()


orchestrator = Orchestrator()
