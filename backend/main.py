from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from agents.orchestrator import orchestrator
from api.middleware import register_middleware
from api.router import router
from api.webhooks import webhooks_router
from api.websocket import ws_manager, ws_router
from models.database import init_db
from services.redis_service import RedisService
from services.scheduler_service import start_scheduler, stop_scheduler
from services.workflow_engine import workflow_engine


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_db()
    await RedisService.connect()
    await orchestrator.start()
    await start_scheduler()

    # Wire the workflow engine to broadcast via WebSocket
    workflow_engine.set_broadcaster(ws_manager.broadcast)

    yield

    await stop_scheduler()
    await RedisService.disconnect()


app = FastAPI(
    title="NexusCore API",
    description="Multi-Agent Collaboration Platform for Autonomous Enterprise Workflows",
    version="2.0.0",
    lifespan=lifespan,
)

cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
register_middleware(app)
app.include_router(router, prefix="/api", tags=["api"])
app.include_router(webhooks_router, prefix="/api")
app.include_router(ws_router)
