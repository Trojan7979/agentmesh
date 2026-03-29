"""
ChatService -- handles agent-chat interactions.

Routes user messages to the appropriate agent persona and
generates contextual responses based on system state.
"""

from __future__ import annotations

import logging
from datetime import datetime

from models.database import db
from models.schemas import AgentName, ChatMessage

logger = logging.getLogger(__name__)

# Agent persona definitions for chat responses
AGENT_PERSONAS: dict[str, dict[str, str]] = {
    "nexus_orchestrator": {
        "name": "Nexus Orchestrator",
        "role": "Workflow Manager",
        "greeting": "I manage all workflow orchestration. How can I help?",
    },
    "data_fetcher": {
        "name": "Data Fetcher v4",
        "role": "Context Retrieval",
        "greeting": "I specialize in data retrieval and validation. What do you need?",
    },
    "action_executor": {
        "name": "Action Exec Alpha",
        "role": "Execution Engine",
        "greeting": "I handle action execution -- tickets, emails, provisioning. What should I do?",
    },
    "shield_verifier": {
        "name": "Shield Verifier",
        "role": "Quality Assurance",
        "greeting": "I verify compliance and quality. What needs checking?",
    },
    "sla_monitor": {
        "name": "SLA Monitor",
        "role": "SLA Tracking",
        "greeting": "I track SLA compliance and predict breaches. What's your concern?",
    },
}


class ChatService:
    """Simple intent-based chat router for agent interactions."""

    async def handle_message(
        self,
        content: str,
        agent: str | None = None,
    ) -> ChatMessage:
        """
        Process a user message and return an agent response.

        If no agent is specified, auto-routes based on keywords.
        """
        # Store user message
        user_msg = ChatMessage(role="user", content=content)
        await db.add_chat_message(user_msg)

        # Determine target agent
        target_agent = agent or self._route_message(content)
        persona = AGENT_PERSONAS.get(target_agent, AGENT_PERSONAS["nexus_orchestrator"])

        # Generate response based on system state
        response_text = await self._generate_response(content, target_agent, persona)

        agent_msg = ChatMessage(
            role="agent",
            agent_name=persona["name"],
            content=response_text,
        )
        await db.add_chat_message(agent_msg)
        return agent_msg

    def _route_message(self, content: str) -> str:
        """Simple keyword-based routing to the right agent."""
        lowered = content.lower()

        if any(kw in lowered for kw in ["workflow", "process", "orchestrat", "route", "approve"]):
            return "nexus_orchestrator"
        if any(kw in lowered for kw in ["data", "fetch", "lookup", "search", "vendor", "budget"]):
            return "data_fetcher"
        if any(kw in lowered for kw in ["execute", "create", "send", "provision", "ticket", "jira"]):
            return "action_executor"
        if any(kw in lowered for kw in ["verify", "compliance", "audit", "check", "risk", "soc2"]):
            return "shield_verifier"
        if any(kw in lowered for kw in ["sla", "breach", "deadline", "overdue", "monitor"]):
            return "sla_monitor"

        return "nexus_orchestrator"

    async def _generate_response(
        self, content: str, agent_key: str, persona: dict[str, str]
    ) -> str:
        """Generate a contextual response based on system state."""
        lowered = content.lower()
        name = persona["name"]

        # Pull live system data for context
        metrics = await db.get_system_metrics()
        workflows = await db.list_workflows()
        active_wfs = [w for w in workflows if w.status == "running"]

        # Context-aware responses
        if any(kw in lowered for kw in ["status", "how are", "what's going on", "overview"]):
            return (
                f"[{name}] System status: {metrics.active_workflows} active workflows, "
                f"{metrics.tasks_automated} tasks automated, "
                f"{metrics.self_corrections} self-corrections performed. "
                f"Autonomy rate: {metrics.autonomy_rate}. All systems operational."
            )

        if any(kw in lowered for kw in ["active", "running", "current"]):
            if active_wfs:
                wf_list = ", ".join(f"{w.name} ({w.progress}%)" for w in active_wfs[:3])
                return f"[{name}] Currently running: {wf_list}."
            return f"[{name}] No workflows are currently running."

        if any(kw in lowered for kw in ["sla", "breach", "risk"]):
            sla_statuses = await db.get_sla_statuses()
            at_risk = [s for s in sla_statuses if s.severity in {"high", "critical"}]
            if at_risk:
                details = ", ".join(
                    f"{s.workflow_name} (risk: {s.breach_risk:.0%})" for s in at_risk
                )
                return f"[{name}] SLA alerts: {details}. Recommend immediate attention."
            return f"[{name}] No SLA breaches detected. All workflows within acceptable thresholds."

        if any(kw in lowered for kw in ["help", "what can you"]):
            return (
                f"[{name}] I'm the {persona['role']}. I can help with: "
                f"workflow status, agent coordination, system metrics, "
                f"SLA monitoring, and process optimization. Just ask!"
            )

        # Default intelligent response
        return (
            f"[{name}] Understood. I've noted your request regarding: "
            f'"{content[:80]}". '
            f"Currently monitoring {metrics.active_workflows} active workflows. "
            f"Is there anything specific you'd like me to act on?"
        )

    async def get_history(self, limit: int = 50) -> list[ChatMessage]:
        """Return recent chat history."""
        return await db.list_chat_messages(limit)


chat_service = ChatService()
