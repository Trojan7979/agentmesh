from __future__ import annotations

from collections import defaultdict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from models.schemas import AgentEvent


ws_router = APIRouter(tags=["websocket"])


class WebSocketManager:
    def __init__(self) -> None:
        self._global_connections: set[WebSocket] = set()
        self._meeting_connections: dict[str, set[WebSocket]] = defaultdict(set)
        self._workflow_connections: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(
        self,
        websocket: WebSocket,
        meeting_id: str | None = None,
        workflow_id: str | None = None,
    ) -> None:
        await websocket.accept()
        if meeting_id:
            self._meeting_connections[meeting_id].add(websocket)
            return
        if workflow_id:
            self._workflow_connections[workflow_id].add(websocket)
            return
        self._global_connections.add(websocket)

    def disconnect(
        self,
        websocket: WebSocket,
        meeting_id: str | None = None,
        workflow_id: str | None = None,
    ) -> None:
        if meeting_id:
            self._meeting_connections[meeting_id].discard(websocket)
            if not self._meeting_connections[meeting_id]:
                self._meeting_connections.pop(meeting_id, None)
            return
        if workflow_id:
            self._workflow_connections[workflow_id].discard(websocket)
            if not self._workflow_connections[workflow_id]:
                self._workflow_connections.pop(workflow_id, None)
            return
        self._global_connections.discard(websocket)

    async def broadcast(self, event: AgentEvent) -> None:
        payload = event.model_dump(mode="json")

        # Always send to global subscribers
        targets = set(self._global_connections)

        # Also send to meeting-specific subscribers
        if event.meeting_id:
            targets.update(self._meeting_connections.get(event.meeting_id, set()))

        # Also send to workflow-specific subscribers
        if event.workflow_id:
            targets.update(self._workflow_connections.get(event.workflow_id, set()))

        stale: list[tuple[WebSocket, str | None, str | None]] = []
        for websocket in targets:
            try:
                await websocket.send_json(payload)
            except RuntimeError:
                stale.append((websocket, event.meeting_id, event.workflow_id))

        for websocket, mid, wid in stale:
            self.disconnect(websocket, meeting_id=mid, workflow_id=wid)


ws_manager = WebSocketManager()


@ws_router.websocket("/ws")
async def websocket_global(websocket: WebSocket) -> None:
    await ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)


@ws_router.websocket("/ws/meeting/{meeting_id}")
async def websocket_meeting(websocket: WebSocket, meeting_id: str) -> None:
    await ws_manager.connect(websocket, meeting_id=meeting_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, meeting_id=meeting_id)


@ws_router.websocket("/ws/workflow/{workflow_id}")
async def websocket_workflow(websocket: WebSocket, workflow_id: str) -> None:
    await ws_manager.connect(websocket, workflow_id=workflow_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, workflow_id=workflow_id)
