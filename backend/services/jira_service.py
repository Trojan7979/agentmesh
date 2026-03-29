"""
JiraService — Production-grade Jira REST API v3 wrapper.

Provides async methods for creating issues, adding comments,
updating priority, transitioning status, and bulk operations
against the Jira Cloud REST API.

Environment variables:
    JIRA_BASE_URL    — e.g. https://yourorg.atlassian.net
    JIRA_EMAIL       — service account email
    JIRA_API_TOKEN   — API token for basic auth
    JIRA_PROJECT_KEY — (optional) defaults to "MM"

When env vars are missing the service runs in **stub mode**,
returning fake ticket data so local development works without
a real Jira instance.
"""

from __future__ import annotations

import asyncio
import logging
import os
from collections.abc import Iterable
from datetime import datetime
from typing import Any, Optional

import httpx

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------


class JiraError(Exception):
    """Base exception for all Jira service errors."""

    def __init__(
        self,
        message: str,
        status_code: int | None = None,
        response_body: Any = None,
    ):
        super().__init__(message)
        self.status_code = status_code
        self.response_body = response_body


class JiraConfigError(JiraError):
    """Raised when required Jira configuration is missing."""


class JiraAPIError(JiraError):
    """Raised when the Jira API returns an unexpected response."""


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------


class JiraService:
    """
    Async Jira REST API v3 client.

    Supports constructor injection *or* env-var configuration for
    ``base_url``, ``email``, ``api_token``, and ``project_key``.
    When required config is absent the service degrades gracefully
    into stub mode so that callers never crash.
    """

    _RETRYABLE_STATUS = frozenset({429, 500, 502, 503, 504})

    def __init__(
        self,
        base_url: str | None = None,
        email: str | None = None,
        api_token: str | None = None,
        project_key: str | None = None,
        timeout: float = 15.0,
        max_retries: int = 2,
    ) -> None:
        self.base_url = (base_url or os.environ.get("JIRA_BASE_URL", "")).rstrip("/")
        self.email = email or os.environ.get("JIRA_EMAIL", "")
        self.api_token = api_token or os.environ.get("JIRA_API_TOKEN", "")
        self.project_key = project_key or os.environ.get("JIRA_PROJECT_KEY", "MM")
        self.timeout = timeout
        self.max_retries = max_retries

        self._configured = bool(self.base_url and self.email and self.api_token)
        self._counter = 0  # stub-mode ticket counter

        if not self._configured:
            logger.warning(
                "JiraService running in stub mode — set JIRA_BASE_URL, "
                "JIRA_EMAIL, and JIRA_API_TOKEN for real integration."
            )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @property
    def _auth(self) -> tuple[str, str]:
        return (self.email, self.api_token)

    @staticmethod
    def _build_adf(text: str) -> dict[str, Any]:
        """Build an Atlassian Document Format body from plain text."""
        return {
            "type": "doc",
            "version": 1,
            "content": [
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": text}],
                }
            ],
        }

    async def _request(
        self,
        method: str,
        path: str,
        *,
        json: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
        raise_for_status: bool = True,
    ) -> httpx.Response:
        """
        Fire an HTTP request with automatic retries.

        Retries on 429 (rate-limit) and 5xx server errors using
        exponential back-off capped at 30 s.
        """
        if not self._configured:
            raise JiraConfigError(
                "Jira is not configured. Set JIRA_BASE_URL, JIRA_EMAIL, "
                "and JIRA_API_TOKEN environment variables."
            )

        url = f"{self.base_url}{path}"
        attempts = self.max_retries + 1
        last_exc: Exception | None = None

        for attempt in range(1, attempts + 1):
            try:
                async with httpx.AsyncClient(auth=self._auth) as client:
                    resp = await client.request(
                        method,
                        url,
                        json=json,
                        params=params,
                        headers={
                            "Accept": "application/json",
                            "Content-Type": "application/json",
                        },
                        timeout=self.timeout,
                    )

                # --- retryable responses ---
                if resp.status_code in self._RETRYABLE_STATUS:
                    wait = (
                        int(resp.headers.get("Retry-After", "0"))
                        or min(2**attempt, 30)
                    )
                    logger.warning(
                        "jira.retryable status=%d method=%s path=%s "
                        "attempt=%d/%d retry_in=%ds",
                        resp.status_code,
                        method,
                        path,
                        attempt,
                        attempts,
                        wait,
                    )
                    await asyncio.sleep(wait)
                    continue

                # --- hard failure ---
                if raise_for_status and resp.status_code >= 400:
                    body = resp.text
                    logger.error(
                        "jira.api_error status=%d method=%s path=%s body=%s",
                        resp.status_code,
                        method,
                        path,
                        body[:500],
                    )
                    raise JiraAPIError(
                        f"Jira {method} {path} returned {resp.status_code}",
                        status_code=resp.status_code,
                        response_body=body,
                    )

                return resp

            except httpx.TimeoutException as exc:
                last_exc = exc
                wait = min(2**attempt, 30)
                logger.warning(
                    "jira.timeout method=%s path=%s attempt=%d/%d retry_in=%ds",
                    method,
                    path,
                    attempt,
                    attempts,
                    wait,
                )
                await asyncio.sleep(wait)

            except httpx.HTTPError as exc:
                raise JiraAPIError(f"HTTP transport error: {exc}") from exc

        raise JiraAPIError(
            f"Jira {method} {path} failed after {attempts} attempts: {last_exc}"
        )

    async def _resolve_account_id(self, email_or_name: str) -> Optional[str]:
        """Resolve a user email / display name to a Jira ``accountId``."""
        try:
            resp = await self._request(
                "GET",
                "/rest/api/3/user/search",
                params={"query": email_or_name},
                raise_for_status=False,
            )
            if resp.status_code != 200:
                return None
            users = resp.json()
            return users[0]["accountId"] if users else None
        except JiraError:
            logger.warning("jira.resolve_account_id failed for '%s'", email_or_name)
            return None

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def create_issue(
        self,
        *,
        title: str,
        description: str,
        assignee: str,
        due_date: str | None = None,
        labels: list[str] | None = None,
        priority: str = "Medium",
        issue_type: str = "Task",
    ) -> dict[str, str]:
        """
        Create a Jira issue and return a summary dict.

        In stub mode a fake ticket dict is returned so callers
        (e.g. ``dispatcher_agent``) never break.

        Returns:
            dict with at least ``key``, ``id``, ``url``, ``title``,
            ``description``, ``assignee``, ``due_date``.
        """
        # ---- stub path ------------------------------------------------
        if not self._configured:
            self._counter += 1
            key = f"{self.project_key}-{self._counter:03d}"
            logger.info("jira.stub ticket_created key=%s title=%s", key, title)
            return {
                "key": key,
                "id": str(self._counter),
                "url": f"https://stub.atlassian.net/browse/{key}",
                "title": title,
                "description": description,
                "assignee": assignee,
                "due_date": due_date or "TBD",
            }

        # ---- real path -------------------------------------------------
        payload: dict[str, Any] = {
            "fields": {
                "project": {"key": self.project_key},
                "summary": title,
                "description": self._build_adf(description),
                "issuetype": {"name": issue_type},
                "priority": {"name": priority},
                "labels": labels or ["meetingmind"],
            }
        }

        if due_date:
            try:
                dt = datetime.fromisoformat(due_date)
                payload["fields"]["duedate"] = dt.strftime("%Y-%m-%d")
            except ValueError:
                logger.warning("jira.invalid_due_date value=%s — skipped", due_date)

        if assignee:
            account_id = await self._resolve_account_id(assignee)
            if account_id:
                payload["fields"]["assignee"] = {"accountId": account_id}
            else:
                logger.warning(
                    "jira.assignee_not_resolved assignee=%s — issue created unassigned",
                    assignee,
                )

        resp = await self._request("POST", "/rest/api/3/issue", json=payload)
        data = resp.json()
        key = data["key"]

        logger.info("jira.ticket_created key=%s", key)
        return {
            "key": key,
            "id": data["id"],
            "url": f"{self.base_url}/browse/{key}",
            "title": title,
            "description": description,
            "assignee": assignee,
            "due_date": due_date or "TBD",
        }

    async def bulk_create(
        self, tasks: Iterable[dict[str, str]]
    ) -> list[dict[str, str]]:
        """Create multiple Jira issues sequentially from an iterable of task dicts."""
        created: list[dict[str, str]] = []
        for task in tasks:
            ticket = await self.create_issue(
                title=task["title"],
                description=task.get("description", ""),
                assignee=task.get("assignee", ""),
                due_date=task.get("due_date"),
                labels=task.get("labels"),  # type: ignore[arg-type]
                priority=task.get("priority", "Medium"),
            )
            created.append(ticket)
        return created

    async def get_issue(self, jira_key: str) -> dict[str, Any] | None:
        """
        Fetch full issue details.

        Returns ``None`` for a 404 or stub mode.
        """
        if not self._configured:
            return None

        resp = await self._request(
            "GET",
            f"/rest/api/3/issue/{jira_key}",
            raise_for_status=False,
        )
        if resp.status_code == 404:
            return None
        if resp.status_code >= 400:
            raise JiraAPIError(
                f"Failed to get issue {jira_key}",
                status_code=resp.status_code,
                response_body=resp.text,
            )
        return resp.json()

    async def get_last_activity(self, jira_key: str) -> Optional[datetime]:
        """Return the ``datetime`` of the last update on a ticket."""
        if not self._configured:
            return None

        resp = await self._request(
            "GET",
            f"/rest/api/3/issue/{jira_key}",
            params={"fields": "updated,status"},
            raise_for_status=False,
        )
        if resp.status_code == 404:
            return None
        if resp.status_code >= 400:
            raise JiraAPIError(
                f"Failed to fetch activity for {jira_key}",
                status_code=resp.status_code,
            )

        updated_str: str = resp.json()["fields"]["updated"]
        return datetime.fromisoformat(updated_str.replace("Z", "+00:00"))

    async def add_comment(self, jira_key: str, comment: str) -> None:
        """Add a comment to an existing Jira issue."""
        if not self._configured:
            logger.info("jira.stub comment key=%s text=%s", jira_key, comment[:80])
            return

        await self._request(
            "POST",
            f"/rest/api/3/issue/{jira_key}/comment",
            json={"body": self._build_adf(comment)},
        )
        logger.info("jira.comment_added key=%s", jira_key)

    async def set_priority(self, jira_key: str, priority: str) -> None:
        """Update the priority of an existing Jira issue."""
        if not self._configured:
            logger.info("jira.stub set_priority key=%s priority=%s", jira_key, priority)
            return

        await self._request(
            "PUT",
            f"/rest/api/3/issue/{jira_key}",
            json={"fields": {"priority": {"name": priority}}},
        )
        logger.info("jira.priority_updated key=%s priority=%s", jira_key, priority)

    async def transition_issue(self, jira_key: str, transition_name: str) -> None:
        """
        Move a Jira issue through its workflow (e.g. *In Progress*, *Done*).

        Fetches available transitions first, then applies the matching one.
        """
        if not self._configured:
            logger.info(
                "jira.stub transition key=%s to=%s", jira_key, transition_name
            )
            return

        resp = await self._request(
            "GET", f"/rest/api/3/issue/{jira_key}/transitions"
        )
        transitions = resp.json().get("transitions", [])
        target = next(
            (t for t in transitions if t["name"].lower() == transition_name.lower()),
            None,
        )
        if target is None:
            available = [t["name"] for t in transitions]
            raise JiraAPIError(
                f"Transition '{transition_name}' not available for {jira_key}. "
                f"Available: {available}"
            )

        await self._request(
            "POST",
            f"/rest/api/3/issue/{jira_key}/transitions",
            json={"transition": {"id": target["id"]}},
        )
        logger.info(
            "jira.transitioned key=%s to=%s", jira_key, transition_name
        )


# ---------------------------------------------------------------------------
# Module-level singleton — keeps existing imports working:
#   from services.jira_service import jira_service
# ---------------------------------------------------------------------------
jira_service = JiraService()
