from __future__ import annotations

import asyncio
from collections import defaultdict
from collections.abc import Awaitable, Callable
from copy import deepcopy
from datetime import datetime
from typing import Any


EventHandler = Callable[[str, dict[str, Any]], Awaitable[None]]


class RedisService:
    _connected = False
    _subscribers: dict[str, list[EventHandler]] = defaultdict(list)
    _lock = asyncio.Lock()

    @classmethod
    async def connect(cls) -> None:
        cls._connected = True

    @classmethod
    async def disconnect(cls) -> None:
        async with cls._lock:
            cls._subscribers.clear()
            cls._connected = False

    @classmethod
    async def subscribe(cls, stream: str, handler: EventHandler) -> None:
        async with cls._lock:
            cls._subscribers[stream].append(handler)

    @classmethod
    async def emit(cls, stream: str, data: dict[str, Any]) -> None:
        if not cls._connected:
            raise RuntimeError("RedisService.emit() called before connect().")

        payload = deepcopy(data)
        payload.setdefault("event", stream)
        payload.setdefault("timestamp", datetime.utcnow().isoformat())

        async with cls._lock:
            handlers = [
                *cls._subscribers.get(stream, []),
                *cls._subscribers.get("*", []),
            ]

        for handler in handlers:
            await handler(stream, deepcopy(payload))
