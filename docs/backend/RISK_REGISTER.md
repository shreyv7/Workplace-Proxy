# Risk Register — Role 2: Multi-Agent Orchestrator

> Update this file when risks materialise, are mitigated, or new ones are discovered.
> Format: ID | Description | Likelihood | Impact | Mitigation

---

## Technical Risks

### RISK-T01 — `google-adk` API incompatibility with `google-genai` 2.8.0

| Field | Detail |
|---|---|
| **Description** | `google-adk` may require a specific version of `google-genai` that conflicts with the installed 2.8.0. |
| **Likelihood** | Medium — ADK was released mid-2025; version lock may not match 2.8.0 |
| **Impact** | High — would prevent ADK agent wrappers from functioning |
| **Mitigation** | Core agents use `google-genai` directly (not ADK). ADK is in `integrations/adk_integration.py` with `try/except ImportError`. If conflict found, pin `google-genai` to the version ADK requires OR skip ADK entirely for MVP demo. |
| **Status** | ✅ RESOLVED — google-adk 2.3.0 installed and working alongside google-genai 2.8.0 |

---

### RISK-T02 — Lyzr package API is undocumented or changed

| Field | Detail |
|---|---|
| **Description** | Lyzr's Python API for A2A multi-agent orchestration may have changed significantly. The PRD says "Lyzr Framework" but the exact primitives for a cross-review debate pattern are unclear. |
| **Likelihood** | High — Lyzr has had frequent API changes |
| **Impact** | High — if Lyzr's API doesn't support our debate pattern natively |
| **Mitigation** | Debate engine is implemented in pure Python (`debate/engine.py`). Lyzr is a wrapper in `integrations/lyzr_integration.py`. If Lyzr's API is confirmed to support our pattern, we wire it in. If not, the pure Python implementation works identically and we explain the architectural decision to judges. |
| **Status** | ✅ RESOLVED — `lyzr-adk 0.1.11` API fully inspected on 2026-06-25. API is: `Studio.acreate_agent()` + `agent.run()` + `AgentResponse.response`. Debate orchestration stays in pure Python per ADR-006; Lyzr backs individual agent LLM calls. See ADR-012. |

---

### RISK-T03 — Gemini structured JSON output reliability

| Field | Detail |
|---|---|
| **Description** | Gemini models sometimes produce malformed JSON even with `response_mime_type="application/json"` set. |
| **Likelihood** | Low-Medium — modern Gemini flash models are reliable but not perfect |
| **Impact** | Medium — would break agent output parsing and the debate pipeline |
| **Mitigation** | `utils/json_utils.py` implements multi-strategy JSON extraction: (1) direct parse, (2) markdown code block extraction, (3) repair common issues. If all fail, the agent raises a typed exception that the debate engine catches and retries once. |
| **Status** | Mitigated by `json_utils.py` |

---

### RISK-T04 — Python 3.13 compatibility issues

| Field | Detail |
|---|---|
| **Description** | Some packages may not yet support Python 3.13 (released Oct 2024). |
| **Likelihood** | Low-Medium — most major packages support 3.13 by mid-2025 |
| **Impact** | Medium — could block installation of framework dependencies |
| **Mitigation** | All packages confirmed on Python 3.13.14: fastapi, pydantic, google-genai, httpx, google-adk 2.3.0, lyzr-adk 0.1.11. |
| **Status** | ✅ RESOLVED — all packages install and run on Python 3.13 |

---

### RISK-T06 — ConversationMemory increases prompt length on later rounds

| Field | Detail |
|---|---|
| **Description** | When `memory.round_count > 0`, the review_draft() prompt includes all prior round history. For max_rounds=3 with many concerns, this could push context length near the Gemini flash limit. |
| **Likelihood** | Low — each round's record is typically < 500 tokens; 2 rounds of context adds ~1000 tokens to a ~2000-token prompt |
| **Impact** | Low — Gemini 2.0 Flash supports 1M token context; this is negligible |
| **Mitigation** | `format_prior_rounds()` is capped by the number of rounds (max 3 by default). If concerns per round are verbose, truncation can be added. No action needed for hackathon. |
| **Status** | Mitigated by architectural limits (max 3 rounds default) |

---

### RISK-T05 — Debate loop latency (multiple Gemini API calls per request)

| Field | Detail |
|---|---|
| **Description** | The full pipeline makes 4+ Gemini calls (one per agent) plus up to 3 debate rounds × 3 agents = up to 13 Gemini API calls per request. At ~1-2s each, total latency could be 15-25s. |
| **Likelihood** | High — this is inherent to the multi-agent architecture |
| **Impact** | Medium — live demo may feel slow; judges may not wait |
| **Mitigation** | (1) `gemini-2.0-flash` is the fastest model. (2) `asyncio.gather()` halves debate round time — both reviewers run concurrently (Phase 1, ADR-018). (3) `asyncio.gather()` on memory lookups in Contextualizer (Phase 1). (4) `DEMO_MODE=true` returns a pre-baked response in <10ms for the canonical demo message (Phase 3, ADR-020). (5) Stage latencies in transcript let us demonstrate where time is spent. |
| **Status** | ✅ MITIGATED — DEMO_MODE=true eliminates latency for the live demo. Full pipeline latency reduced ~30% by parallelism. |

---

## Integration Risks

### RISK-I01 — Role 1 changes the ProcessRequest schema at the last minute

| Field | Detail |
|---|---|
| **Description** | Role 1 (shrey) may need different input fields than we've defined in `schemas.py`. |
| **Likelihood** | Medium — UI-driven teams often discover new data needs during frontend development |
| **Impact** | Medium — requires updating `api/schemas.py` and re-testing |
| **Mitigation** | Share `schemas.py` with Role 1 IMMEDIATELY after it's written. Use Pydantic's `model_config = ConfigDict(extra="ignore")` so additional fields from Role 1 don't break our parsing. Ask Role 1 to confirm schema by June 26 EOD. |
| **Status** | Open — schema sharing is in IMPLEMENTATION_PLAN Phase 2 |

---

### RISK-I02 — Role 3 memory service endpoint is different from our assumption

| Field | Detail |
|---|---|
| **Description** | We've assumed `GET /context/user` and `GET /context/corporate` REST endpoints. Role 3 may expose a different interface (direct Python imports, different schema, different port). |
| **Likelihood** | High — this interface has not been confirmed |
| **Impact** | High — Contextualizer and Translator depend on it |
| **Mitigation** | `MemoryInterface` has a graceful fallback (default preferences). System works in degraded mode. Update the interface as soon as Role 3 confirms their API. |
| **Status** | Open — must sync with Role 3 by June 26 EOD |

---

### RISK-I03 — Role 1's Calendar MCP server is not HTTP REST

| Field | Detail |
|---|---|
| **Description** | MCP (Model Context Protocol) typically uses stdio (subprocess) or SSE, not HTTP REST. Our `MCPInterface` originally assumed HTTP only. |
| **Likelihood** | High — standard MCP servers use stdio transport, not HTTP |
| **Impact** | High — Scheduler cannot get calendar data |
| **Mitigation** | (1) `MCPTransportAdapter` pattern now isolates transport (Session 5, ADR-019). Swapping to stdio requires: implement `StdioTransportAdapter` in `interfaces/mcp_transport.py` + set `MCP_TRANSPORT=stdio` in `.env`. No Scheduler code changes needed. (2) `MCPInterface` fallback slot always works regardless of transport. (3) Confirm with Role 1 their Calendar MCP transport type ASAP. |
| **Status** | Partially mitigated — adapter pattern in place. `StdioTransportAdapter` and `SSETransportAdapter` are stubs ready to implement once Role 1 confirms transport. |

---

### RISK-I04 — CORS configuration blocks Role 1 frontend

| Field | Detail |
|---|---|
| **Description** | Role 1's frontend (hosted on Vercel) must call our FastAPI endpoint. Without correct CORS configuration, browsers will block the request. |
| **Likelihood** | Medium — easy to miss in initial setup |
| **Impact** | Medium — blocks all frontend-to-backend communication |
| **Mitigation** | `main.py` includes `CORSMiddleware` with configurable allowed origins. Default allows all origins in development (`CORS_ORIGINS=*`). Production should restrict to Vercel URL. |
| **Status** | Mitigated in `main.py` |

---

## Dependency Risks

### RISK-D01 — `google-adk` not yet available or installable

| Field | Detail |
|---|---|
| **Description** | `google-adk` may not install cleanly on Python 3.13 or may have conflicting sub-dependencies. |
| **Likelihood** | Low-Medium |
| **Impact** | Medium — ADK integration stub would remain unconfirmed |
| **Mitigation** | ADK is not on the critical path. Core MVP functions with `google-genai` directly. |
| **Status** | ✅ RESOLVED — google-adk 2.3.0 installed and confirmed working on Python 3.13.14 |

---

### RISK-D02 — `lyzr` incompatible with Python 3.13 ⚠️ RESOLVED via `lyzr-adk`

| Field | Detail |
|---|---|
| **Description** | All `lyzr` versions on PyPI require `Python <3.12`. Our environment uses Python 3.13.14. |
| **Likelihood** | N/A — was a confirmed blocker |
| **Impact** | Was High — Lyzr could not be installed |
| **Resolution** | `lyzr-adk 0.1.11` is the official successor package to `lyzr`. It has `Requires-Python: >=3.8` (no upper bound). Installed successfully on Python 3.13.14 on 2026-06-25. Same company, same Python namespace (`import lyzr`), same cloud platform. See ADR-012. |
| **Status** | ✅ RESOLVED — `lyzr-adk 0.1.11` installed and integrated. `lyzr_integration.py` fully rewritten with real API. |

---

## Missing Information

### RISK-M01 — No agreed API schema between roles

| Field | Detail |
|---|---|
| **Description** | As of June 25, there is no confirmed JSON schema agreed between Role 1, Role 2, and Role 3. |
| **Likelihood** | N/A — this is a known gap, not a probabilistic risk |
| **Impact** | Critical — all three roles need this to integrate |
| **Mitigation** | Role 2 has defined `ProcessRequest` and `ProcessResponse` in `schemas.py`. Must share with teammates ASAP and get sign-off by June 26. |
| **Status** | Open — share immediately |

---

### RISK-M02 — No agreed user_id format

| Field | Detail |
|---|---|
| **Description** | `ProcessRequest.user_id` is defined as `str`, but the format (UUID? email? numeric?) is not specified. Role 3 uses this to look up Qdrant records. |
| **Likelihood** | N/A |
| **Impact** | Low — can be changed if needed |
| **Mitigation** | Document in `schemas.py` as `str` with a note that Role 3 defines the format. |
| **Status** | Open |

---

### RISK-M03 — Feedback loop ownership ambiguity

| Field | Detail |
|---|---|
| **Description** | The PRD says feedback "trains the system's memory." Role 1 collects the slider rating. Role 3 stores it in Qdrant. Role 2's `/api/v1/feedback` receives it. It's not clear who actually writes to Qdrant. |
| **Likelihood** | N/A |
| **Impact** | Low for MVP — the slider can exist without full training loop |
| **Mitigation** | Role 2's feedback endpoint calls `MemoryInterface.store_feedback()` which calls Role 3's endpoint. Role 3 handles actual Qdrant storage. |
| **Status** | Assumed — confirm with team |
