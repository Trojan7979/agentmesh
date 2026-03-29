<p align="center">
  <img src="https://img.shields.io/badge/NexusCore-v2.0-cyan?style=for-the-badge&logo=hexagon&logoColor=white" alt="NexusCore v2.0" />
  <img src="https://img.shields.io/badge/Python-3.11+-blue?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-0.135-teal?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License" />
</p>

# NexusCore -- Multi-Agent Collaboration Platform

> **Agentic AI for Autonomous Enterprise Workflows**
>
> A production-grade multi-agent system that takes full ownership of complex, multi-step enterprise processes -- detecting failures, self-correcting, and completing jobs with minimal human involvement while maintaining an auditable trail of every decision.

---

## Problem Statement

Enterprise workflows -- procurement, onboarding, contract management -- involve dozens of steps across multiple systems and stakeholders. Today, these processes are:

- **Fragile**: A single missed approval or expired certificate stalls the entire pipeline.
- **Manual**: Humans babysit each step, copy-paste between systems, and chase follow-ups.
- **Opaque**: When things fail, nobody knows why, and there's no audit trail.

**NexusCore solves this** by deploying a swarm of specialized AI agents that autonomously orchestrate, execute, verify, and self-correct enterprise workflows end-to-end.

---

## Architecture

```
                    +-------------------+
                    |   React Frontend  |
                    |   (Vite + TW v4)  |
                    +--------+----------+
                             |
                    REST API + WebSocket
                             |
                    +--------+----------+
                    |   FastAPI Backend  |
                    +--------+----------+
                             |
          +------------------+------------------+
          |                  |                  |
   +------+------+   +------+------+   +-------+-----+
   |  Workflow    |   |   Meeting   |   |    Chat     |
   |  Engine      |   | Intelligence|   |   Service   |
   +------+------+   +------+------+   +-------------+
          |                  |
    +-----+-----+     +-----+-----+
    | Agent Swarm|     | Agent Swarm|
    +-----+-----+     +-----+-----+
          |                  |
  +-------+-------+  +------+------+
  | Nexus Orch.   |  | Scribe      |
  | Data Fetcher  |  | Extractor   |
  | Action Exec   |  | Dispatcher  |
  | Shield Verify |  | Stalker     |
  | SLA Monitor   |  | Escalation  |
  +-------+-------+  +------+------+
          |                  |
    +-----+-----+     +-----+-----+
    | Jira API  |     | Slack API |
    | (Real)    |     | Redis PubSub|
    +-----------+     +-----------+
```

---

## Key Features

### 1. Multi-Agent Workflow Orchestration

Five specialized agents collaborate to execute enterprise workflows autonomously:

| Agent | Role | What It Does |
|-------|------|-------------|
| **Nexus Orchestrator** | Workflow Manager | Routes steps, manages state machine, handles approval chains |
| **Data Fetcher v4** | Context Retrieval | Vendor lookups, budget checks, compliance data, usage analytics |
| **Action Exec Alpha** | Execution Engine | Creates POs, provisions accounts, generates contracts, sends emails |
| **Shield Verifier** | Quality Assurance | SOC2/GDPR compliance, risk scoring, clause analysis, final verification |
| **SLA Monitor** | Health Watcher | Predicts bottlenecks, tracks breach risk, auto-escalates |

### 2. Self-Correction & Chaos Mode

The system doesn't just handle happy paths -- it **detects and recovers from failures autonomously**:

- **Chaos Mode**: Inject failures at any `can_fail` step to test resilience
- **Self-Correction**: Agents collaborate to resolve issues (e.g., expired certificate -> auto-request renewal -> re-validate -> resume)
- **Zero human intervention**: Recovery sequences run fully autonomously
- **Full audit trail**: Every failure detection and recovery step is logged

### 3. Real-Time WebSocket Streaming

Workflow execution streams live over WebSocket:

```
WORKFLOW_STARTED -> STEP_STARTED -> STEP_COMPLETED -> FAILURE_DETECTED
  -> RECOVERY_STEP (x6) -> SELF_CORRECTED -> ... -> WORKFLOW_COMPLETED
```

### 4. Meeting Intelligence Pipeline

Separate agent pipeline for meeting-driven workflow:

```
Audio/Transcript -> Scribe -> Extractor -> Dispatcher -> Jira + Slack
                                              |
                                    Stalker (periodic sweep)
                                              |
                                    Escalation Agent
```

- Extracts **decisions**, **action items**, and **blockers** from transcripts
- Creates **real Jira tickets** via production-grade REST API integration
- Sends **Slack notifications** to task owners
- **Stalker agent** monitors overdue tasks and nudges owners
- **Escalation agent** calculates risk scores and escalates to managers

### 5. Production-Grade Jira Integration

Not a mock -- the Jira service connects to real Atlassian APIs:

- Creates issues with ADF-formatted descriptions
- Resolves assignees by email -> accountId lookup
- Adds comments, updates priority, transitions status
- Retry logic with exponential backoff on 429/5xx
- Graceful stub fallback when credentials aren't configured

### 6. Three Scripted Enterprise Scenarios

| Scenario | Steps | Failure Path |
|----------|-------|-------------|
| **Procure-to-Pay** | 8 steps: PR -> Vendor check -> Budget -> Compliance -> Approval -> PO -> Payment | SOC2 certificate expired -> auto-renewal request -> re-validation |
| **Employee Onboarding** | 6 steps: Offer -> Background check -> IT provisioning -> Hardware -> Notification -> Verification | GitHub org seat limit -> identify inactive users -> deactivate -> retry |
| **Contract Lifecycle** | 6 steps: Trigger -> Usage analysis -> Draft -> Legal review -> e-Signature -> Archive | Non-standard indemnification clause -> policy lookup -> counter-proposal -> resolution |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 8, TailwindCSS 4, Lucide Icons, Recharts |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, httpx (async) |
| **Communication** | WebSocket (real-time), REST API, Redis PubSub (event bus) |
| **Integrations** | Jira Cloud REST API v3, Slack SDK |
| **Infrastructure** | Docker Compose, Makefile |

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Git

### 1. Clone & Setup Backend

```bash
git clone https://github.com/Trojan7979/agentmesh.git
cd agentmesh

# Backend
cd backend
python -m venv venv
.\venv\Scripts\activate       # Windows
# source venv/bin/activate    # macOS/Linux
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp ../.env.example .env
```

Edit `.env` with your credentials (optional -- runs in stub mode without them):

```env
JIRA_BASE_URL=https://yourorg.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-api-token
JIRA_PROJECT_KEY=KAN
```

### 3. Start Backend

```bash
.\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Start Frontend

```bash
cd ../frontend
npm install
npm run dev
```

### 5. Open the App

- **Frontend**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs
- **WebSocket**: ws://localhost:8000/ws

---

## API Reference

### Dashboard & Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/dashboard/metrics` | System metrics (workflows, autonomy rate, self-corrections) |
| `GET` | `/api/dashboard/agents` | Live agent statuses and success rates |

### Workflow Simulation

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/workflows/scenarios` | List available scenarios |
| `POST` | `/api/workflows/simulate` | Start a simulation (chaos_mode, step_duration_ms) |
| `GET` | `/api/workflows` | List all workflow instances |
| `GET` | `/api/workflows/{id}` | Get workflow detail with step statuses |
| `POST` | `/api/workflows/{id}/pause` | Pause a running workflow |
| `POST` | `/api/workflows/{id}/resume` | Resume a paused workflow |

### Meeting Intelligence

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/meetings` | Ingest a meeting transcript |
| `POST` | `/api/meetings/demo` | Create a demo meeting |
| `GET` | `/api/meetings` | List all meetings |
| `GET` | `/api/meetings/{id}` | Get meeting detail |
| `GET` | `/api/meetings/{id}/audit` | Get meeting audit trail |

### SLA & Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/sla/statuses` | SLA statuses with breach predictions |
| `GET` | `/api/agents/collab-graph` | Agent collaboration edges |
| `GET` | `/api/audit` | Global audit trail |

### Chat & RBAC

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Send message to agent swarm |
| `GET` | `/api/chat/history` | Chat history |
| `GET` | `/api/users` | List users |
| `PUT` | `/api/users/{id}/role` | Update user role |

### WebSocket Channels

| Channel | Description |
|---------|-------------|
| `ws://host/ws` | Global event stream (all workflow + meeting events) |
| `ws://host/ws/meeting/{id}` | Meeting-specific events |
| `ws://host/ws/workflow/{id}` | Workflow-specific step events |

---

## Example: Start a Workflow Simulation

```bash
# Start Procure-to-Pay with chaos mode (failures will be injected)
curl -X POST http://localhost:8000/api/workflows/simulate \
  -H "Content-Type: application/json" \
  -d '{"scenario_id": "sc-p2p", "chaos_mode": true, "step_duration_ms": 2000}'

# Watch events in real-time
wscat -c ws://localhost:8000/ws
```

**Response stream (WebSocket):**

```json
{"type": "WORKFLOW_STARTED", "agent": "nexus_orchestrator", "message": "Started workflow: Acme Corp Software License"}
{"type": "WORKFLOW_STEP_STARTED", "agent": "system", "message": "Step 1: Purchase Request Submitted"}
{"type": "WORKFLOW_STEP_COMPLETED", "agent": "system", "message": "Step 1 completed", "metadata": {"progress": 12}}
...
{"type": "WORKFLOW_FAILURE_DETECTED", "agent": "shield_verifier", "message": "FAILURE: SOC2 Certificate Expired"}
{"type": "WORKFLOW_RECOVERY_STEP", "agent": "shield_verifier", "message": "Recovery 1/6: Paused workflow and logged compliance gap"}
{"type": "WORKFLOW_RECOVERY_STEP", "agent": "action_executor", "message": "Recovery 2/6: Auto-generated certificate renewal request"}
...
{"type": "WORKFLOW_SELF_CORRECTED", "agent": "nexus_orchestrator", "message": "Step 4 self-corrected after: SOC2 Certificate Expired"}
...
{"type": "WORKFLOW_COMPLETED", "agent": "nexus_orchestrator", "message": "Workflow completed: 8 steps, 1 self-corrections, 0 escalations"}
```

---

## Evaluation Criteria Alignment

| Criteria | How NexusCore Delivers |
|----------|----------------------|
| **Depth of Autonomy** | 8/8 steps complete without human involvement across 3 enterprise scenarios. Full end-to-end execution with no manual gates. |
| **Error Recovery** | Chaos mode injects real failures (expired certs, API limits, policy violations). Agents self-correct through multi-step recovery with zero human input. |
| **Auditability** | Every event, decision, and reasoning logged with timestamps. Full audit trail accessible via API. Decision panel shows confidence scores and rejected alternatives. |
| **Real-World Applicability** | Real Jira API integration (not mocked). Production-grade retry/backoff. Enterprise scenarios based on actual P2P, HR, and legal workflows. |

---

## Project Structure

```
agentmesh/
+-- backend/
|   +-- agents/              # AI agent implementations
|   |   +-- base_agent.py           # Abstract base with event bus integration
|   |   +-- orchestrator.py         # Main orchestrator (registers all agents)
|   |   +-- scribe_agent.py         # Transcript -> speaker segments
|   |   +-- extractor_agent.py      # NLP extraction (decisions, actions, blockers)
|   |   +-- dispatcher_agent.py     # Jira + Slack task dispatch
|   |   +-- stalker_agent.py        # Periodic overdue task sweep
|   |   +-- escalation_agent.py     # Risk-based escalation
|   |   +-- audit_logger.py         # Global event audit + WebSocket push
|   +-- api/                 # FastAPI routes & middleware
|   |   +-- router.py               # 20+ REST endpoints
|   |   +-- websocket.py            # WebSocket manager (global, meeting, workflow)
|   |   +-- webhooks.py             # Zoom webhook ingestion
|   |   +-- middleware.py           # Request ID & timing
|   +-- models/              # Pydantic schemas & in-memory database
|   |   +-- schemas.py              # 30+ models (workflows, SLA, agents, RBAC, chat)
|   |   +-- database.py             # InMemoryDatabase with full query layer
|   +-- services/            # External integrations & engines
|   |   +-- workflow_engine.py      # Async workflow execution engine
|   |   +-- jira_service.py         # Production Jira REST API v3 wrapper
|   |   +-- slack_service.py        # Slack integration
|   |   +-- chat_service.py         # Agent chat with intent routing
|   |   +-- redis_service.py        # In-memory event bus (pub/sub)
|   |   +-- scheduler_service.py    # Periodic task scheduler
|   |   +-- whisper_service.py      # Transcript parser
|   +-- workflows/           # Scenario definitions
|   |   +-- scenarios.py            # 3 enterprise scenarios with failure paths
|   +-- prompts/             # Agent prompt templates
|   +-- main.py              # FastAPI application entry point
+-- frontend/
|   +-- src/
|       +-- App.jsx                  # Main app with 11 views
|       +-- components/              # 10 feature components
|       +-- mockData.js              # Dashboard seed data
|       +-- mockScenarios.js         # Client-side scenario definitions
|       +-- useSimulation.js         # Live simulation hook
+-- docker-compose.yml
+-- Makefile
```

---

## Demo Credentials

| Email | Password | Role |
|-------|----------|------|
| `admin@nexuscore.ai` | `admin123` | Super Admin |
| `sarah@nexuscore.ai` | `sarah123` | VP Engineering |
| `james@nexuscore.ai` | `james123` | Product Manager |

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<p align="center">
  <b>NexusCore</b> -- Because enterprise workflows shouldn't need babysitters.
</p>
