from __future__ import annotations

import asyncio

from fastapi.testclient import TestClient

from main import app
from models.database import db


def reset_store() -> None:
    asyncio.run(db.reset())


def test_demo_meeting_runs_end_to_end() -> None:
    reset_store()

    with TestClient(app) as client:
        response = client.post("/api/meetings/demo")

    assert response.status_code == 201
    payload = response.json()
    assert payload["status"] == "complete"
    assert len(payload["transcript_segments"]) >= 4
    assert len(payload["tasks"]) >= 2
    assert len(payload["audit"]) >= 3


def test_stalker_sweep_flags_overdue_tasks() -> None:
    reset_store()

    with TestClient(app) as client:
        created = client.post("/api/meetings/demo")
        meeting_id = created.json()["id"]
        sweep = client.post("/api/sweeps/run")
        meeting = client.get(f"/api/meetings/{meeting_id}")

    assert created.status_code == 201
    assert sweep.status_code == 200
    task_statuses = {task["status"] for task in meeting.json()["tasks"]}
    assert "overdue" in task_statuses
