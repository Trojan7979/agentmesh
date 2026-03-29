from __future__ import annotations

from agents.base_agent import BaseAgent
from models.database import db
from models.schemas import AgentName, OverdueTask, TaskStatus
from services.slack_service import slack_service


class StalkerAgent(BaseAgent):
    name = AgentName.STALKER

    async def process(self, event: str, payload: dict[str, object]) -> None:
        return None

    async def run_sweep(self) -> None:
        overdue = await db.list_overdue_tasks()
        for item in overdue:
            await self._nudge(item)

    async def _nudge(self, item: OverdueTask) -> None:
        prompt = self.load_prompt("stalker_nudge.txt")
        await slack_service.send_dm(
            item.task.owner_slack,
            (
                f"{item.task.title} is {item.days_late} day(s) overdue. "
                f"{prompt.splitlines()[0]}"
            ),
        )
        await db.update_task_status(item.meeting_id, item.task.id, TaskStatus.OVERDUE)
        await self.emit(
            "ESCALATION_NEEDED",
            {
                "meeting_id": item.meeting_id,
                "task": item.task.model_dump(mode="json"),
                "days_late": item.days_late,
                "meeting_title": item.meeting_title,
            },
        )
