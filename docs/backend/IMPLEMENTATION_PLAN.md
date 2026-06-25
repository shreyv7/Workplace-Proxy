# Implementation Plan — Role 2: Multi-Agent Orchestrator

> Each task has: priority, purpose, dependencies, estimated complexity, and a checkbox.
> Tasks are ordered to minimise merge conflicts: API contract first, interfaces second, logic last.

---

## Phase 0 — Environment Setup

| # | Priority | Task | Dependencies | Complexity | Done |
|---|---|---|---|---|---|
| 0.1 | CRITICAL | Install `pydantic-settings` | Python 3.13 | Trivial | ✅ |
| 0.2 | CRITICAL | Install `structlog` | Python 3.13 | Trivial | ✅ |
| 0.3 | HIGH | Install `google-adk` | `google-genai` 2.8.0 | Low | ✅ v2.3.0 installed |
| 0.4 | HIGH | Install `lyzr-adk` (official replacement for `lyzr`) | None | Low | ✅ lyzr-adk 0.1.11 installed (Python 3.13 compatible) |
| 0.5 | CRITICAL | Create `role2/` directory structure | None | Trivial | ✅ |
| 0.6 | CRITICAL | Write `pyproject.toml` | Package list | Low | ✅ |
| 0.7 | CRITICAL | Write `requirements.txt` | Package list | Trivial | ✅ |
| 0.8 | CRITICAL | Write `.env.example` | Settings plan | Trivial | ✅ |

---

## Phase 1 — Configuration & Utilities (Zero External Dependencies)

These files have no dependencies on teammates and can be done in total isolation.

| # | Priority | Task | Dependencies | Complexity | Done |
|---|---|---|---|---|---|
| 1.1 | CRITICAL | `config/settings.py` — env-var driven Settings class | pydantic-settings | Low | ✅ |
| 1.2 | CRITICAL | `utils/logging_config.py` — structured JSON logging | structlog | Low | ✅ |
| 1.3 | HIGH | `utils/json_utils.py` — robust JSON extraction from LLM output | None | Low | ✅ |

---

## Phase 2 — API Contract (Share with Role 1 ASAP)

This is the most critical deliverable for teammate integration. Share `schemas.py` with shrey
immediately after writing it.

| # | Priority | Task | Dependencies | Complexity | Done |
|---|---|---|---|---|---|
| 2.1 | CRITICAL | `api/schemas.py` — ProcessRequest, ProcessResponse, all sub-models | Pydantic v2 | Medium | ✅ |
| 2.2 | HIGH | Circulate schema to Role 1 for feedback | 2.1 | Trivial | ☐ |
| 2.3 | MEDIUM | `api/schemas.py` — FeedbackRequest schema | Pydantic v2 | Low | ✅ |

---

## Phase 3 — Teammate Interfaces (Stubs That Work)

Write these before the agents so agents always have something to call.
Both interfaces must degrade gracefully (fallback, no exception propagation).

| # | Priority | Task | Dependencies | Complexity | Done |
|---|---|---|---|---|---|
| 3.1 | CRITICAL | `interfaces/memory_interface.py` — Role 3 Qdrant client stub | httpx | Medium | ✅ |
| 3.2 | CRITICAL | `interfaces/mcp_interface.py` — Role 1 Calendar MCP client stub | httpx | Medium | ✅ |
| 3.3 | HIGH | Write `MemoryInterface` fallback behaviour (default prefs) | 3.1 | Low | ✅ |
| 3.4 | HIGH | Write `MCPInterface` fallback calendar slot | 3.2 | Low | ✅ |
| 3.5 | MEDIUM | Update interfaces once Role 3 confirms their endpoint schema | 3.1 | Medium | ☐ |
| 3.6 | MEDIUM | Update MCP interface once Role 1 confirms Calendar endpoint | 3.2 | Medium | ☐ |

---

## Phase 4 — Agent Personas & Processing Logic

Write agents in dependency order: base → interceptor → contextualizer → scheduler → translator.

| # | Priority | Task | Dependencies | Complexity | Done |
|---|---|---|---|---|---|
| 4.1 | CRITICAL | `agents/base.py` — BaseAgent with `google-genai` 2.8.0 client | google-genai | Medium | ✅ |
| 4.2 | CRITICAL | `agents/interceptor.py` — Agent 1, structures raw message | BaseAgent | Medium | ✅ |
| 4.3 | CRITICAL | `agents/contextualizer.py` — Agent 2, enriches with Qdrant context | BaseAgent, MemoryInterface | High | ✅ |
| 4.4 | CRITICAL | `agents/scheduler.py` — Agent 3, finds calendar slot | BaseAgent, MCPInterface | High | ✅ |
| 4.5 | CRITICAL | `agents/translator.py` — Agent 4, produces final translation | BaseAgent | High | ✅ |
| 4.6 | HIGH | Prompt engineering: tune Interceptor system prompt | 4.2 | Medium | ✅ |
| 4.7 | HIGH | Prompt engineering: tune Contextualizer system prompt | 4.3 | Medium | ✅ |
| 4.8 | HIGH | Prompt engineering: tune Scheduler system prompt | 4.4 | Medium | ✅ |
| 4.9 | HIGH | Prompt engineering: tune Translator system prompt | 4.5 | Medium | ✅ |

---

## Phase 5 — Debate Engine (A2A Orchestration)

The core differentiator. Implement after all four agents are stable.

| # | Priority | Task | Dependencies | Complexity | Done |
|---|---|---|---|---|---|
| 5.1 | CRITICAL | `debate/engine.py` — DebateEngine orchestrates full A2A pipeline | All agents | High | ✅ |
| 5.2 | HIGH | Implement max-round guard (prevent infinite loops) | 5.1 | Low | ✅ |
| 5.3 | HIGH | Implement consensus detection logic | 5.1 | Medium | ✅ |
| 5.4 | MEDIUM | Log full debate transcript for debugging | 5.1 | Low | ✅ |
| 5.5 | MEDIUM | Implement graceful partial-consensus handling | 5.3 | Low | ✅ |

---

## Phase 6 — Framework Integrations (ADK + Lyzr)

Documented integration stubs. Not required for MVP to function, but required per PRD.

| # | Priority | Task | Dependencies | Complexity | Done |
|---|---|---|---|---|---|
| 6.1 | HIGH | `integrations/adk_integration.py` — ADK agent wrappers | google-adk (install) | Medium | ✅ Implemented with 2.3.0 API |
| 6.2 | HIGH | `integrations/lyzr_integration.py` — LyzrBackend implements LLMBackend | lyzr-adk | Medium | ✅ LyzrBackend(LLMBackend) + create_lyzr_backend() factory |
| 6.3 | MEDIUM | Wire ADK agents into DebateEngine as optional backend | 6.1, 5.1 | High | ☐ Not required for MVP (ADR-006) |
| 6.4 | HIGH | `llm/backend.py` — LLMBackend ABC + GoogleBackend + create_backend() | All agents | Medium | ✅ LLM backend abstraction complete |
| 6.5 | HIGH | Inject LLMBackend into BaseAgent constructor | 6.4 | Low | ✅ backend= param on all 4 agents; backward compatible |

---

## Phase 7 — FastAPI Application

| # | Priority | Task | Dependencies | Complexity | Done |
|---|---|---|---|---|---|
| 7.1 | CRITICAL | `api/routes.py` — POST /api/v1/process handler | schemas, DebateEngine | Medium | ✅ |
| 7.2 | CRITICAL | `api/routes.py` — POST /api/v1/feedback handler | schemas, MemoryInterface | Low | ✅ |
| 7.3 | HIGH | `api/routes.py` — GET /health handler | Settings | Trivial | ✅ |
| 7.4 | CRITICAL | `main.py` — FastAPI app factory with CORS, middleware, lifespan | routes, settings | Medium | ✅ |
| 7.5 | HIGH | Add request timing middleware (for processing_time_ms in response) | 7.4 | Low | ✅ |
| 7.6 | MEDIUM | Add structured error responses (422 validation, 500 internal) | 7.4 | Low | ✅ |

---

## Phase 8 — Testing

| # | Priority | Task | Dependencies | Complexity | Done |
|---|---|---|---|---|---|
| 8.1 | HIGH | `tests/conftest.py` — fixtures, mock interfaces, test client | pytest | Medium | ✅ |
| 8.2 | HIGH | `tests/test_schemas.py` — schema validation round-trips | schemas | Low | ✅ |
| 8.3 | HIGH | `tests/test_agents.py` — unit tests for each agent (mocked LLM) | agents | Medium | ✅ |
| 8.4 | HIGH | `tests/test_debate.py` — debate engine with mocked agents | debate/engine | Medium | ✅ |
| 8.5 | MEDIUM | `tests/test_api.py` — FastAPI endpoint integration tests | routes, TestClient | Medium | ✅ |

---

## Phase 9 — Integration & Polish

| # | Priority | Task | Dependencies | Complexity | Done |
|---|---|---|---|---|---|
| 9.1 | CRITICAL | Sync ProcessRequest schema with Role 1 once they confirm | Role 1 | Low | ☐ |
| 9.2 | CRITICAL | Update MemoryInterface endpoints once Role 3 delivers their API | Role 3 | Low | ☐ |
| 9.3 | CRITICAL | Update MCPInterface once Role 1 Calendar MCP is live | Role 1 | Low | ☐ |
| 9.4 | HIGH | End-to-end demo: run FastAPI, send mock Slack message, verify response | All | Medium | ☐ |
| 9.5 | HIGH | Update PROJECT_CONTEXT.md with final status | All | Trivial | ☐ |

---

## Phase 10 — Multi-Agent Intelligence Enhancement (Session 4)

All changes are additive and backwards compatible. 36/36 tests pass.

| # | Priority | Task | Done |
|---|---|---|---|
| 10.1 | HIGH | ARCHITECTURE.md — full dependency graph, sequence diagrams, A2A protocol, extension points | ✅ Written before implementation (Phase 8 per spec) |
| 10.2 | HIGH | AgentIdentity dataclass in agents/base.py | ✅ |
| 10.3 | HIGH | AGENT_IDENTITY class constant on all 4 agents | ✅ |
| 10.4 | HIGH | BaseAgent.get_identity() + critique() extension method | ✅ |
| 10.5 | HIGH | communication/protocol.py — AgentMessage + MessageType A2A protocol | ✅ |
| 10.6 | HIGH | consensus/engine.py — ConsensusEngine + ConsensusResult | ✅ |
| 10.7 | HIGH | memory/conversation.py — ConversationMemory + RoundRecord (per-request only) | ✅ |
| 10.8 | HIGH | debate/transcript.py — DebateTranscript full observability record | ✅ |
| 10.9 | HIGH | Rewire DebateEngine with ConsensusEngine, ConversationMemory, AgentMessage, Transcript | ✅ |
| 10.10 | MEDIUM | Add memory=None param to review_draft() in Contextualizer + Scheduler | ✅ Memory-aware prompts when prior rounds exist |
| 10.11 | MEDIUM | GET /api/v1/debug/transcript endpoint (additive — no schema change) | ✅ |
| 10.12 | MEDIUM | create_per_agent_lyzr_backends() in lyzr_integration.py (ADR-017) | ✅ |
| 10.13 | MEDIUM | LYZR_PER_AGENT setting + per-agent startup path in main.py | ✅ |
| 10.14 | HIGH | Update DECISIONS.md: ADR-013 through ADR-017 | ✅ |
| 10.15 | HIGH | Update PROJECT_CONTEXT.md: status table + file structure | ✅ |

---

## Phase 11 — Hackathon Optimisation (Session 5)

All changes preserve backward compatibility. 36/36 tests still pass.

| # | Phase | Task | Done |
|---|---|---|---|
| 11.1 | P1 | asyncio.gather() for parallel review_draft() in debate loop | ✅ |
| 11.2 | P1 | asyncio.gather() for parallel memory lookups in Contextualizer.process() | ✅ |
| 11.3 | P2 | interfaces/mcp_transport.py — MCPTransportAdapter ABC + HTTP/SSE/stdio adapters | ✅ |
| 11.4 | P2 | MCPInterface delegates to transport adapter (HTTP default, backward compatible) | ✅ |
| 11.5 | P2 | main.py wires transport via create_transport(settings.mcp_transport, ...) | ✅ |
| 11.6 | P3 | demo/scenarios.py — DemoScenario, find_demo_scenario(), pre-baked response + transcript | ✅ |
| 11.7 | P3 | debate/engine.py demo mode fast-path; getattr for Pydantic v2/spec-mock compat | ✅ |
| 11.8 | P4 | DebateTranscript: stage_latencies, total_processing_ms, fallback_events, record_stage() | ✅ |
| 11.9 | P4 | PipelineState.stage_latencies + _run_timed_stage() helper in engine.py | ✅ |
| 11.10 | P5 | metrics/store.py — Metrics singleton + derived properties | ✅ |
| 11.11 | P5 | GET /api/v1/debug/metrics endpoint (additive) | ✅ |
| 11.12 | P6 | GoogleBackend._call_with_retry() with exponential backoff | ✅ |
| 11.13 | P6 | create_backend() passes llm_retry_count + llm_retry_delay_seconds from settings | ✅ |
| 11.14 | P7 | Settings: llm_retry_count, llm_retry_delay_seconds, mcp_transport, mcp_stdio_command, demo_mode, demo_trigger_phrase, max_transcript_events | ✅ |
| 11.15 | P8 | main.py: fixed pre-existing bug (backend undefined in per-agent Lyzr success path) | ✅ |
| 11.16 | P9 | HACKATHON_CHECKLIST.md — full demo runbook | ✅ |
| 11.17 | ALL | Update DECISIONS.md: ADR-018 through ADR-025 | ✅ |
| 11.18 | ALL | Update PROJECT_CONTEXT.md: status table + file structure + next-session checklist | ✅ |

---

## Ordering Rationale

Tasks are ordered to:
1. **Unblock Role 1 first** — API schema (Phase 2) is shared immediately; Role 1 can build against it
2. **Decouple from teammates** — Interfaces (Phase 3) have stubs so agents work before teammates deliver
3. **Bottom-up agent build** — Base → Interceptor → Contextualizer → Scheduler → Translator prevents circular imports
4. **Debate last** — Needs all agents stable first
5. **Framework integrations (ADK/Lyzr) as enhancement** — Core MVP works without them; they are added on top
