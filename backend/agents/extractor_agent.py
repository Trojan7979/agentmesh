from __future__ import annotations

import re
from datetime import date

from agents.base_agent import BaseAgent
from models.database import db
from models.schemas import AgentName, DecisionRecord, ExtractionResult, TaskDraft, TranscriptSegment


ACTION_PATTERN = re.compile(
    r"^(?:(?P<owner>[A-Z][A-Za-z .'-]+)\s+)?(?:(?:will|should|needs to|owns)\s+)?(?P<title>.+)$"
)
DATE_PATTERN = re.compile(r"\b(20\d{2}-\d{2}-\d{2})\b")


class ExtractorAgent(BaseAgent):
    name = AgentName.EXTRACTOR
    listens_to = "TRANSCRIPT_READY"

    async def process(self, event: str, payload: dict[str, object]) -> None:
        meeting_id = str(payload["meeting_id"])
        prompt = self.load_prompt("extract_decisions.txt")
        segments = [
            TranscriptSegment.model_validate(segment)
            for segment in payload.get("segments", [])
        ]

        await self.log(
            meeting_id=meeting_id,
            message="Classifying transcript segments into decisions, actions, and blockers.",
            metadata={"prompt_preview": prompt.splitlines()[0]},
        )

        result = self._extract(segments)
        await db.store_extraction(
            meeting_id,
            decisions=result.decisions,
            blockers=result.blockers,
        )

        await self.emit(
            "DECISIONS_EXTRACTED",
            {
                "meeting_id": meeting_id,
                "decisions": [item.model_dump(mode="json") for item in result.decisions],
                "actions": [item.model_dump(mode="json") for item in result.actions],
                "blockers": [item.model_dump(mode="json") for item in result.blockers],
            },
        )

    def _extract(self, segments: list[TranscriptSegment]) -> ExtractionResult:
        result = ExtractionResult()

        for segment in segments:
            text = segment.text.strip()
            lowered = text.lower()

            if self._is_blocker(lowered):
                result.blockers.append(
                    DecisionRecord(
                        kind="blocker",
                        summary=text,
                        owner=segment.speaker,
                        confidence=0.82,
                        source_segment=text,
                    )
                )
                continue

            if self._is_action(lowered):
                owner, title = self._extract_action_owner_and_title(segment)
                result.actions.append(
                    TaskDraft(
                        title=title,
                        owner=owner,
                        deadline=self._extract_deadline(text),
                        context=text,
                        confidence=0.87,
                        source_segment=text,
                    )
                )
                continue

            if self._is_decision(lowered):
                result.decisions.append(
                    DecisionRecord(
                        kind="decision",
                        summary=text,
                        owner=segment.speaker,
                        deadline=self._extract_deadline(text),
                        confidence=0.78,
                        source_segment=text,
                    )
                )

        return result

    def _is_action(self, lowered: str) -> bool:
        hints = (" will ", " needs to ", " should ", " follow up", " ship ", " send ", " prepare ")
        return any(hint in f" {lowered} " for hint in hints)

    def _is_decision(self, lowered: str) -> bool:
        hints = ("decided", "agreed", "let's go with", "decision", "ship this", "we'll use")
        return any(hint in lowered for hint in hints)

    def _is_blocker(self, lowered: str) -> bool:
        hints = ("blocked", "waiting on", "can't", "cannot", "stuck", "risk")
        return any(hint in lowered for hint in hints)

    def _extract_deadline(self, text: str) -> date | None:
        match = DATE_PATTERN.search(text)
        if not match:
            return None
        try:
            return date.fromisoformat(match.group(1))
        except ValueError:
            return None

    def _extract_action_owner_and_title(self, segment: TranscriptSegment) -> tuple[str, str]:
        cleaned = segment.text.strip().rstrip(".")
        match = ACTION_PATTERN.match(cleaned)
        if not match:
            return segment.speaker, cleaned

        owner = (match.group("owner") or segment.speaker).strip()
        title = match.group("title").strip()
        title = re.sub(r"\bby\s+20\d{2}-\d{2}-\d{2}\b", "", title, flags=re.IGNORECASE).strip()
        title = title[:1].upper() + title[1:] if title else cleaned
        return owner, title
