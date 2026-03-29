from __future__ import annotations

from agents.base_agent import BaseAgent
from models.schemas import AgentName, TaskRecord
from services.slack_service import slack_service


class EscalationAgent(BaseAgent):
    name = AgentName.ESCALATION
    listens_to = "ESCALATION_NEEDED"

    async def process(self, event: str, payload: dict[str, object]) -> None:
        meeting_id = str(payload["meeting_id"])
        task = TaskRecord.model_validate(payload["task"])
        days_late = int(payload["days_late"])
        prompt = self.load_prompt("escalation_report.txt")
        risk = min(0.35 + (days_late * 0.15), 0.95)

        await self.log(
            meeting_id=meeting_id,
            message=f"Evaluated escalation risk for {task.jira_key or task.title}.",
            metadata={"risk": round(risk, 2), "days_late": days_late},
            reasoning=prompt.splitlines()[0],
        )

        if risk < 0.7:
            return

        manager_handle = "@team.lead"
        await slack_service.send_dm(
            manager_handle,
            f"Escalation: {task.title} is at risk ({risk:.2f}) and owned by {task.owner}.",
        )
        await self.emit(
            "ESCALATION_FIRED",
            {
                "meeting_id": meeting_id,
                "task": task.model_dump(mode="json"),
                "risk": round(risk, 2),
                "manager": manager_handle,
            },
        )
