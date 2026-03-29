from __future__ import annotations

import asyncio
import os
from collections.abc import Awaitable, Callable


SweepCallback = Callable[[], Awaitable[None]]


class SchedulerService:
    def __init__(self) -> None:
        self._callbacks: list[SweepCallback] = []
        self._task: asyncio.Task[None] | None = None
        self._interval_seconds = int(os.getenv("SWEEP_INTERVAL_SECONDS", "1800"))

    def register(self, callback: SweepCallback) -> None:
        self._callbacks.append(callback)

    async def start(self) -> None:
        if self._task is not None:
            return
        self._task = asyncio.create_task(self._run(), name="meetingmind-scheduler")

    async def stop(self) -> None:
        if self._task is None:
            return
        self._task.cancel()
        try:
            await self._task
        except asyncio.CancelledError:
            pass
        self._task = None

    async def run_once(self) -> None:
        for callback in self._callbacks:
            await callback()

    async def _run(self) -> None:
        while True:
            await asyncio.sleep(self._interval_seconds)
            await self.run_once()


scheduler_service = SchedulerService()


def register_sweep(callback: SweepCallback) -> None:
    scheduler_service.register(callback)


async def start_scheduler() -> None:
    await scheduler_service.start()


async def stop_scheduler() -> None:
    await scheduler_service.stop()
