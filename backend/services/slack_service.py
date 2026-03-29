from __future__ import annotations


class SlackService:
    async def resolve_user(self, owner: str) -> str:
        handle = owner.strip().lower().replace(" ", ".")
        return f"@{handle}"

    async def send_dm(self, slack_id: str, message: str) -> dict[str, str]:
        return {
            "recipient": slack_id,
            "message": message,
            "status": "sent",
        }


slack_service = SlackService()
