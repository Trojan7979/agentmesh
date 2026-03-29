from __future__ import annotations

from agents.base_agent import BaseAgent
from models.database import db
from models.schemas import AgentName, MeetingStatus
from services.whisper_service import whisper_service


class ScribeAgent(BaseAgent):
    name = AgentName.SCRIBE

    async def process(self, event: str, payload: dict[str, object]) -> None:
        meeting_id = str(payload["meeting_id"])
        transcript = str(payload["transcript"])
        participants = [str(item) for item in payload.get("participants", [])]

        await db.set_status(meeting_id, MeetingStatus.PROCESSING)
        await self.log(
            meeting_id=meeting_id,
            message="Transcribing meeting transcript into speaker segments.",
            metadata={"phase": "ingest"},
        )

        segments, duration = whisper_service.transcribe(transcript, participants)
        await db.store_segments(meeting_id, segments)
        await db.set_duration(meeting_id, duration)

        await self.emit(
            "TRANSCRIPT_READY",
            {
                "meeting_id": meeting_id,
                "duration_seconds": duration,
                "segments": [segment.model_dump(mode="json") for segment in segments],
            },
        )
