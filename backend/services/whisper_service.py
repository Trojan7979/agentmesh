from __future__ import annotations

import itertools
import re

from models.schemas import TranscriptSegment


class WhisperService:
    def transcribe(self, transcript: str, participants: list[str]) -> tuple[list[TranscriptSegment], int]:
        speakers = participants or ["Alex", "Priya", "Sam", "Jordan"]
        speaker_cycle = itertools.cycle(speakers)

        segments: list[TranscriptSegment] = []
        cursor = 0

        lines = [line.strip() for line in transcript.splitlines() if line.strip()]
        for raw_line in lines:
            speaker, text = self._parse_line(raw_line, next(speaker_cycle))
            word_count = max(len(text.split()), 4)
            duration = max(5, min(18, word_count + 1))
            segments.append(
                TranscriptSegment(
                    speaker=speaker,
                    text=text,
                    start_seconds=cursor,
                    end_seconds=cursor + duration,
                )
            )
            cursor += duration

        return segments, cursor

    def _parse_line(self, raw_line: str, fallback_speaker: str) -> tuple[str, str]:
        match = re.match(r"^(?P<speaker>[A-Za-z][A-Za-z .'-]{1,30}):\s*(?P<text>.+)$", raw_line)
        if match:
            return match.group("speaker").strip(), match.group("text").strip()
        return fallback_speaker, raw_line


whisper_service = WhisperService()
