# Project Clarity — Role 2 Persistent Context

> **Read this file at the start of every Claude session before writing a single line of code.**
> It is the single source of truth for Role 2 architecture, decisions, and status.

---

## 1. Project Summary

**Name**: Project Clarity (Autonomous Cognitive OS)
**Track**: Open Innovation
**Deadline**: June 28, 2026 (MVP evaluation)
**Today**: June 25, 2026 — 3 days remaining

### The Problem
Corporate communication is riddled with implicit expectations, passive-aggressive language, and vague
requests ("Hey, can you take a look at this whenever?"). For neurodivergent professionals (ADHD,
Autism), decoding this is exhausting and can cause burnout.

### The Solution
A Multi-Agent "Communication Buffer" that intercepts vague workplace messages, negotiates their true
meaning via a swarm of specialized AI agents, and delivers clear, explicit, structured tasks tailored
to the user's cognitive preferences.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ROLE 1 (shrey)                                    │
│  Frontend (Lovable.dev → Vercel)  +  MCP Servers (Slack / Email / Calendar)│
└─────────────────────────────────────────────────────────────────────────────┘
         │                                                       ▲
         │  POST /api/v1/process                                 │
         │  {raw Slack/Email message as JSON}                    │  JSON response
         ▼                                                       │  {translated task
┌────────────────────────────────────────────────────────────────┤   + calendar slot}
│                     ROLE 2 — FastAPI Server (THIS REPO)        │
│                                                                │
│   ┌──────────────┐  ┌─────────────────┐  ┌─────────────┐     │
│   │  Interceptor │→ │ Contextualizer  │→ │  Scheduler  │     │
│   │  (Agent 1)   │  │  (Agent 2)      │  │  (Agent 3)  │     │
│   └──────────────┘  └─────────────────┘  └──────┬──────┘     │
│                              │                   │            │
│                              └──────────┬─────────┘           │
│                                         ▼                     │
│                              ┌──────────────────┐             │
│                              │ Debate Engine     │             │
│                              │ (Agents 2+3+4    │             │
│                              │  cross-review)   │             │
│                              └────────┬─────────┘             │
│                                       ▼                       │
│                              ┌──────────────────┐             │
│                              │   Translator     │             │
│                              │   (Agent 4)      │─────────────┘
│                              └──────────────────┘
│          │                              │
│          ▼                              ▼
│   ┌─────────────┐              ┌──────────────────┐
│   │  Role 3     │              │   Role 1 MCP     │
│   │  Memory     │              │   Calendar       │
│   │  Service    │              │   Server         │
│   │  (Qdrant)   │              └──────────────────┘
│   └─────────────┘
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Technologies

| Technology | Status | Notes |
|---|---|---|
| Python 3.13.14 | ✅ Available | Do not use deprecated syntax |
| `google-genai` 2.8.0 | ✅ Installed | New unified GenAI SDK; replaces `google-generativeai` |
| `fastapi` 0.136.3 | ✅ Installed | REST API server |
| `pydantic` 2.13.4 | ✅ Installed | Schemas and validation |
| `uvicorn` 0.49.0 | ✅ Installed | ASGI server |
| `httpx` 0.28.1 | ✅ Installed | Async HTTP client |
| `google-adk` 2.3.0 | ✅ Installed | Google Agent Development Kit; LlmAgent, Runner, InMemorySessionService |
| `lyzr-adk` 0.1.11 | ✅ Installed | Official Lyzr SDK (replaces old `lyzr` pkg); Python 3.13 compatible |
| `structlog` 26.1.0 | ✅ Installed | Structured JSON logging |
| `pydantic-settings` 2.14.2 | ✅ Installed | Env-var config |

**IMPORTANT**: The `google-genai` 2.8.0 SDK uses a different API from older `google-generativeai`.
Always use `from google import genai` and `client = genai.Client(api_key=...)`.

### LLM Backend Architecture

```
DebateEngine → BaseAgent → LLMBackend (abstract)
                               ├── GoogleBackend  (google-genai 2.8.0, default)
                               └── LyzrBackend    (lyzr-adk 0.1.11, LYZR_ENABLED=true)
```

Backend is selected once at startup by `create_backend(settings)` in `llm/backend.py`.
All four agents share the same backend instance (injected via constructor).
Agent code never checks which backend is active.

---

## 4. Role 2 Responsibilities (WHAT I OWN)

1. **FastAPI server** — exposes `/api/v1/process`, `/api/v1/feedback`, `/health` endpoints
2. **The four agents**:
   - Agent 1 (Interceptor): Structures and analyses the raw incoming message
   - Agent 2 (Contextualizer): Enriches with Qdrant context via Role 3's memory service
   - Agent 3 (Scheduler): Proposes realistic timeline using calendar data from Role 1's MCP
   - Agent 4 (Translator): Rewrites message into clear, user-preference-aligned output
3. **Debate engine**: Orchestrates Agents 2/3/4 cross-reviewing each other's output
4. **Lyzr integration**: Wraps orchestration with Lyzr's multi-agent framework
5. **Google ADK integration**: Uses ADK as the agent runtime backing Gemini models
6. **Interface to Role 3**: HTTP client for Qdrant context retrieval
7. **Interface to Role 1 MCP**: HTTP client for Calendar availability

---

## 5. Teammate Responsibilities (WHAT I DO NOT OWN)

### Role 1 — shrey (Full-Stack & Integration Lead)
- Frontend dashboard (Lovable.dev → Vercel)
- MCP servers: Slack, Email, Calendar (actual connections)
- Supabase for relational data (if used)
- **Sends** raw messages as JSON to `POST /api/v1/process`
- **Displays** our `ProcessResponse` JSON to the user
- **Collects** user feedback slider → sends to `POST /api/v1/feedback`

### Role 3 — (Memory & Infrastructure Lead)
- Qdrant Docker container (port 6333 by default)
- RAG pipeline (chunking, embedding, storing corporate data)
- **Exposes** HTTP service for context search (endpoint TBD — see INTEGRATION_NOTES.md)

---

## 6. Multi-Agent Workflow (A2A Flow)

```
1. POST /api/v1/process  ← Role 1 sends raw message
       │
       ▼
2. Interceptor.process(request)
   → Extracts: sender intent, vague phrases, key references, implicit signals
   → Output: InterceptedContext
       │
       ▼
3. Contextualizer.process(intercepted_ctx, corporate_ctx, user_prefs)
   → Queries Role 3: corporate context + user preferences (via memory_interface)
   → Decodes vague language ("no rush" → urgency level, "the thing" → project ref)
   → Output: EnrichedContext
       │
       ▼
4. Scheduler.process(enriched_ctx, calendar_blocks)
   → Calls Role 1 Calendar MCP (via mcp_interface)
   → Proposes realistic deadline + calendar slot
   → Output: ScheduledContext
       │
       ▼
5. Translator.process(enriched_ctx, scheduled_ctx, user_prefs)
   → Rewrites message per user formatting preferences
   → Produces: draft TranslatedTask
       │
       ▼
6. DEBATE LOOP (max 3 rounds):
   ├── Contextualizer.review(draft) → ContextReview (approve / concern)
   ├── Scheduler.review(draft) → SchedulerReview (approve / concern)
   ├── If both approve → break
   └── If concern raised → Translator.revise(draft, [reviews]) → new draft
       │
       ▼
7. Return ProcessResponse  → Role 1 displays to user
```

---

## 7. The Debate Mechanism

Agents 2 (Contextualizer), 3 (Scheduler), and 4 (Translator) participate in structured debate:
- Each reviewer reads the Translator's draft
- Each produces a structured `AgentReview`: `approved: bool`, `concerns: list[str]`, `suggested_revisions: str | None`
- If consensus (threshold=2 approvals) is reached → debate ends
- If not → Translator receives all concerns and revises (max 3 rounds)
- Round counter is always incremented; partial consensus is logged

---

## 8. Interfaces with Teammates

All interfaces are in `orchestrator/interfaces/`. They have fallback behaviour so the system
degrades gracefully when teammates' services are not yet running.

| Interface | File | Direction | Status |
|---|---|---|---|
| Role 1 → Role 2 | `api/schemas.py` (ProcessRequest) | Inbound | Defined, **pending Role 1 confirmation** |
| Role 2 → Role 1 | `api/schemas.py` (ProcessResponse) | Outbound | Defined, **pending Role 1 confirmation** |
| Role 2 → Role 3 | `interfaces/memory_interface.py` | Outbound | Stub implemented, **endpoint TBD by Role 3** |
| Role 2 → Role 1 MCP | `interfaces/mcp_interface.py` | Outbound | Stub implemented, **endpoint TBD by Role 1** |

---

## 9. Assumptions Avoided

- We do NOT assume Role 3's HTTP endpoint schema. `memory_interface.py` uses documented placeholders.
- We do NOT assume Role 1's MCP server protocol. `mcp_interface.py` uses documented placeholders.
- We do NOT implement Qdrant directly (that is Role 3's responsibility).
- We do NOT implement MCP servers (that is Role 1's responsibility).
- We do NOT implement the UI feedback display (that is Role 1's responsibility).
- We do NOT assume which Gemini model version — it is configurable via `GEMINI_MODEL` env var.

---

## 10. Unanswered Questions (Must Resolve Before June 28)

| # | Question | Owner | Blocking |
|---|---|---|---|
| Q1 | What HTTP endpoint schema does Role 3 expose for context retrieval? | Role 3 | Contextualizer, Translator |
| Q2 | What HTTP endpoint does Role 1's Calendar MCP server expose? | Role 1 | Scheduler |
| Q3 | Does Role 1 need auth on our FastAPI endpoints? | Role 1 | `/api/v1/process` |
| Q4 | What exact `ProcessRequest` JSON fields does Role 1 send? | Role 1 | API contract |
| Q5 | Which Gemini model is approved? (`gemini-2.0-flash` assumed) | Team | All agents |
| Q6 | ~~Lyzr API version and available primitives for A2A?~~ | ✅ Resolved | lyzr-adk 0.1.11 — Studio.acreate_agent + agent.run. See ADR-012. |
| Q7 | ~~Does `google-adk` work with `google-genai` 2.8.0?~~ | ✅ Resolved | google-adk 2.3.0 installed and working alongside google-genai 2.8.0 |
| Q8 | Where does the feedback rating get persisted — Role 3 Qdrant? | Role 3 | Feedback endpoint |

---

## 11. Coding Conventions

- Python 3.13 — use `X | Y` union syntax (not `Optional[X]`)
- Full type hints on every function signature
- Pydantic v2 models for all data structures (no dict passing between layers)
- All configuration from environment variables via `Settings` in `config/settings.py`
- All logging via `orchestrator/utils/logging_config.py` (structured JSON)
- All HTTP calls async (httpx)
- No business logic in FastAPI route handlers — delegate to service/engine layers
- Interfaces have graceful fallback when teammate services are unavailable
- Every public method has a one-line docstring explaining WHY, not WHAT

---

## 12. Project File Structure

```
workplace_proxy_2/
├── docs/                         (PDFs — do not modify)
├── ARCHITECTURE.md               ← Full dependency graph + sequence diagrams (Session 4)
├── backend/                      (Role 2 implementation)
│   ├── orchestrator/
│   │   ├── api/
│   │   │   ├── schemas.py        ← API contract (ProcessRequest / ProcessResponse)
│   │   │   └── routes.py         ← FastAPI routes + /debug/transcript (Session 4)
│   │   ├── agents/
│   │   │   ├── base.py           ← BaseAgent + AgentIdentity + critique() (Session 4)
│   │   │   ├── interceptor.py    ← Agent 1 + AGENT_IDENTITY (Session 4)
│   │   │   ├── contextualizer.py ← Agent 2 + AGENT_IDENTITY + memory-aware review (S4)
│   │   │   ├── scheduler.py      ← Agent 3 + AGENT_IDENTITY + memory-aware review (S4)
│   │   │   └── translator.py     ← Agent 4 + AGENT_IDENTITY (Session 4)
│   │   ├── debate/
│   │   │   ├── engine.py         ← A2A debate orchestration (Session 4 enhanced)
│   │   │   └── transcript.py     ← DebateTranscript observability record (Session 4)
│   │   ├── communication/
│   │   │   └── protocol.py       ← AgentMessage + MessageType A2A protocol (Session 4)
│   │   ├── consensus/
│   │   │   └── engine.py         ← ConsensusEngine + ConsensusResult (Session 4)
│   │   ├── memory/
│   │   │   └── conversation.py   ← Per-request ConversationMemory (Session 4)
│   │   ├── interfaces/
│   │   │   ├── memory_interface.py   ← Role 3 (Qdrant) client
│   │   │   ├── mcp_interface.py      ← Role 1 (Calendar MCP) client — uses transport adapter
│   │   │   └── mcp_transport.py      ← MCPTransportAdapter ABC + HTTP/SSE/stdio impls (S5)
│   │   ├── integrations/
│   │   │   ├── adk_integration.py    ← Google ADK wiring
│   │   │   └── lyzr_integration.py   ← LyzrBackend + per-agent factory (Session 4)
│   │   ├── llm/
│   │   │   └── backend.py        ← LLMBackend ABC + GoogleBackend + create_backend()
│   │   ├── demo/
│   │   │   └── scenarios.py      ← Pre-baked demo scenarios (Session 5, DEMO_MODE=true)
│   │   ├── metrics/
│   │   │   └── store.py          ← In-process metrics counters (Session 5)
│   │   ├── config/
│   │   │   └── settings.py       ← All env-var config + S5: retry, MCP transport, demo mode
│   │   ├── utils/
│   │   │   ├── logging_config.py ← Structured logging
│   │   │   └── json_utils.py     ← Robust LLM JSON extraction
│   │   └── main.py               ← FastAPI app factory + per-agent Lyzr + transport wiring
│   ├── tests/
│   ├── .env.example
│   ├── pyproject.toml
│   └── requirements.txt
├── PROJECT_CONTEXT.md            ← THIS FILE
├── IMPLEMENTATION_PLAN.md
├── DECISIONS.md
├── RISK_REGISTER.md
├── INTEGRATION_NOTES.md
├── ARCHITECTURE.md               ← Full dependency graph (Session 4)
└── HACKATHON_CHECKLIST.md        ← Demo runbook for any teammate (Session 5)
```

---

## 13. Current Project Status

**Last updated**: 2026-06-25 — End of session 5 (9-phase hackathon optimisation)

| Component | Status | Notes |
|---|---|---|
| Documentation (7 files) | ✅ Complete | PROJECT_CONTEXT, IMPLEMENTATION_PLAN, DECISIONS, RISK_REGISTER, INTEGRATION_NOTES, ARCHITECTURE.md, HACKATHON_CHECKLIST.md |
| Project config | ✅ Complete | pyproject.toml + requirements.txt + .env.example |
| Settings | ✅ Enhanced | Session 5: llm_retry_*, mcp_transport, mcp_stdio_command, demo_mode, demo_trigger_phrase, max_transcript_events |
| API schemas | ✅ Complete | ProcessRequest / ProcessResponse / all sub-models — UNCHANGED |
| memory_interface | ✅ Complete | Graceful fallback when Role 3 unavailable |
| mcp_interface | ✅ Enhanced | Now delegates to MCPTransportAdapter; HTTP/SSE/stdio selection from settings |
| mcp_transport | ✅ New | interfaces/mcp_transport.py — HTTPTransportAdapter (active) + SSE/stdio stubs |
| BaseAgent | ✅ Enhanced | AgentIdentity dataclass, get_identity(), critique() extension point |
| Interceptor | ✅ Enhanced | AGENT_IDENTITY class constant added |
| Contextualizer | ✅ Enhanced | AGENT_IDENTITY + memory-aware review_draft() + asyncio.gather() for parallel memory |
| Scheduler | ✅ Enhanced | AGENT_IDENTITY + memory-aware review_draft() |
| Translator | ✅ Enhanced | AGENT_IDENTITY class constant added |
| Debate Engine | ✅ Enhanced | asyncio.gather() for parallel reviews; demo mode fast-path; stage timing; metrics |
| ConsensusEngine | ✅ Complete | consensus/engine.py — per-round evaluation, conflict detection |
| ConversationMemory | ✅ Complete | memory/conversation.py — per-request debate history |
| AgentMessage / Protocol | ✅ Complete | communication/protocol.py — structured A2A message type |
| DebateTranscript | ✅ Enhanced | Session 5: stage_latencies, total_processing_ms, fallback_events, record_stage() |
| Demo mode | ✅ New | demo/scenarios.py — deterministic pre-baked response for "no rush" message |
| MetricsStore | ✅ New | metrics/store.py — in-process counters; /debug/metrics endpoint |
| FastAPI routes | ✅ Enhanced | /process, /feedback, /health, /debug/transcript + NEW: /debug/metrics |
| ADK integration | ✅ Implemented | google-adk 2.3.0, LlmAgent wrappers + Runner factory |
| Lyzr integration | ✅ Enhanced | Shared agent (ADR-012) + per-agent option (ADR-017) |
| LLM backend abstraction | ✅ Enhanced | GoogleBackend now has retry_count + retry_delay (exponential backoff) |
| Tests | ✅ Complete | 36/36 pass — all session 5 changes are backwards compatible |
| HACKATHON_CHECKLIST.md | ✅ New | Full demo runbook for any teammate to run the live demo |

## 14. Confirmed Environment Facts (Session 1)

| Fact | Value |
|---|---|
| Python version | 3.13.14 |
| google-genai | 2.8.0 (new unified SDK — use `from google import genai`) |
| google-adk | 2.3.0 (installed, working — LlmAgent, Runner, InMemorySessionService) |
| lyzr-adk | 0.1.11 (installed — official Lyzr SDK, replaces old `lyzr` package) |
| fastapi | 0.136.3 |
| pydantic | 2.13.4 |
| pydantic-settings | 2.14.2 |
| structlog | 26.1.0 |
| httpx | 0.28.1 |

## 15. Next Session Start Checklist

1. Read this file first, then read ARCHITECTURE.md and HACKATHON_CHECKLIST.md
2. Run `cd d:/workplace_proxy_2/Workplace-Proxy/backend && python -m pytest tests/ -v` to verify green (36/36)
3. Run a live end-to-end test with real GOOGLE_API_KEY in `.env` (non-demo mode)
4. Test DEMO_MODE=true: set it in `.env`, restart, send the canonical "No rush" message
5. Verify `/api/v1/debug/transcript` returns stage_latencies and fallback_events fields
6. Verify `/api/v1/debug/metrics` returns the metrics snapshot
7. Sync with Role 1 (shrey) on Calendar MCP transport — set MCP_TRANSPORT accordingly
8. Sync with Role 3 on memory service endpoint schema — update memory_interface.py if needed
9. If showing Lyzr Studio to judges: set LYZR_ENABLED=true LYZR_PER_AGENT=true
