from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any

from models.schemas import AgentName
from services.redis_service import RedisService


PROMPTS_DIR = Path(__file__).resolve().parents[1] / "prompts"


class BaseAgent(ABC):
    name: AgentName = AgentName.SYSTEM
    listens_to: str | None = None

    async def emit(self, event: str, payload: dict[str, Any]) -> None:
        enriched = {
            "agent": self.name,
            **payload,
        }
        await RedisService.emit(event, enriched)

    async def log(
        self,
        *,
        meeting_id: str | None,
        message: str,
        metadata: dict[str, Any] | None = None,
        reasoning: str = "",
    ) -> None:
        await self.emit(
            "AGENT_ACTIVITY",
            {
                "meeting_id": meeting_id,
                "message": message,
                "metadata": metadata or {},
                "reasoning": reasoning,
            },
        )

    def load_prompt(self, file_name: str) -> str:
        return (PROMPTS_DIR / file_name).read_text(encoding="utf-8").strip()

    @abstractmethod
    async def process(self, event: str, payload: dict[str, Any]) -> None:
        raise NotImplementedError
