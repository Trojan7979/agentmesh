from __future__ import annotations

from datetime import datetime

from agents.base_agent import BaseAgent
from models.database import db
from models.schemas import AgentName, MeetingStatus, TaskDraft, TaskRecord
from services.jira_service import jira_service
from services.slack_service import slack_service


class DispatcherAgent(BaseAgent):
    name = AgentName.DISPATCHER
    listens_to = "DECISIONS_EXTRACTED"

    async def process(self, event: str, payload: dict[str, object]) -> None:
        meeting_id = str(payload["meeting_id"])
        drafts = [TaskDraft.model_validate(task) for task in payload.get("actions", [])]

        await self.log(
            meeting_id=meeting_id,
            message="Creating task records, Jira issues, and Slack notifications.",
            metadata={"task_count": len(drafts)},
        )

        task_records: list[TaskRecord] = []
        for draft in drafts:
            slack_id = await slack_service.resolve_user(draft.owner)
            ticket = await jira_service.create_issue(
                title=draft.title,
                description=draft.context,
                assignee=draft.owner,
                due_date=draft.deadline.isoformat() if draft.deadline else None,
            )
            await slack_service.send_dm(
                slack_id,
                f"You own '{draft.title}'. Jira ticket {ticket['key']} has been created.",
            )
            task_records.append(
                TaskRecord(
                    title=draft.title,
                    owner=draft.owner,
                    owner_slack=slack_id,
                    due_date=draft.deadline,
                    jira_key=ticket["key"],
                    source_segment=draft.source_segment,
                    context=draft.context,
                    confidence=draft.confidence,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
            )

        await db.add_tasks(meeting_id, task_records)
        await db.set_status(meeting_id, MeetingStatus.COMPLETE)

        await self.emit(
            "TASKS_CREATED",
            {
                "meeting_id": meeting_id,
                "tasks": [task.model_dump(mode="json") for task in task_records],
            },
        )
