# Workplace Proxy — Role 2 Architecture

> Written before implementation of the 9-phase multi-agent enhancement (Session 4).
> This document is the authoritative reference for the Role 2 system design.

---

## 1. Dependency Graph

```
orchestrator/
├── main.py                        ← FastAPI app factory + lifespan startup
│
├── api/
│   ├── schemas.py                 ← ProcessRequest, ProcessResponse, all sub-models
│   └── routes.py                  ← /process, /feedback, /health, /debug/transcript
│
├── config/
│   └── settings.py                ← All env-var config (pydantic-settings)
│
├── agents/
│   ├── base.py                    ← BaseAgent, AgentReview, AgentIdentity
│   ├── interceptor.py             ← Agent 1: analyses raw message
│   ├── contextualizer.py          ← Agent 2: decodes vague language + debate reviewer
│   ├── scheduler.py               ← Agent 3: proposes deadline + debate reviewer
│   └── translator.py              ← Agent 4: produces final output + revises on demand
│
├── debate/
│   ├── engine.py                  ← DebateEngine: pipeline orchestration + debate loop
│   └── transcript.py              ← DebateTranscript: full observability record
│
├── consensus/
│   └── engine.py                  ← ConsensusEngine: per-round consensus evaluation
│
├── memory/
│   └── conversation.py            ← ConversationMemory: per-request debate history
│
├── communication/
│   └── protocol.py                ← AgentMessage, MessageType: A2A protocol
│
├── llm/
│   └── backend.py                 ← LLMBackend ABC, GoogleBackend, create_backend()
│
├── integrations/
│   ├── adk_integration.py         ← Google ADK LlmAgent wrappers (optional)
│   └── lyzr_integration.py        ← LyzrBackend, create_lyzr_backend(),
│                                      create_per_agent_lyzr_backends()
│
├── interfaces/
│   ├── memory_interface.py        ← HTTP client → Role 3 Qdrant service
│   └── mcp_interface.py           ← HTTP client → Role 1 Calendar MCP
│
└── utils/
    ├── logging_config.py          ← structlog structured JSON logging
    └── json_utils.py              ← Robust LLM JSON extraction
```

### Import dependency order (bottom → top, no cycles):

```
config/settings.py
utils/logging_config.py
utils/json_utils.py
    ↓
api/schemas.py
interfaces/memory_interface.py
interfaces/mcp_interface.py
communication/protocol.py
    ↓
agents/base.py          (imports: config, utils, TYPE_CHECKING: llm/backend)
consensus/engine.py     (imports: agents/base, utils)
memory/conversation.py  (imports: agents/base)
    ↓
agents/interceptor.py   (imports: agents/base, api/schemas)
agents/contextualizer.py (imports: agents/base, api/schemas, interfaces/memory,
                           TYPE_CHECKING: memory/conversation)
agents/scheduler.py     (imports: agents/base, api/schemas, interfaces/mcp,
                           TYPE_CHECKING: memory/conversation)
agents/translator.py    (imports: agents/base, api/schemas)
llm/backend.py          (imports: config, utils, TYPE_CHECKING: integrations/lyzr)
integrations/lyzr_integration.py  (imports: llm/backend, utils)
integrations/adk_integration.py   (imports: agents/base, utils)
    ↓
debate/transcript.py    (imports: communication/protocol,
                           TYPE_CHECKING: consensus/engine)
debate/engine.py        (imports: ALL agents, api/schemas, communication/protocol,
                           config, consensus/engine, debate/transcript,
                           interfaces, memory/conversation, utils,
                           TYPE_CHECKING: llm/backend)
    ↓
api/routes.py           (imports: api/schemas, config, utils)
main.py                 (imports: api/routes, config, debate/engine,
                           interfaces, llm/backend, utils)
```

---

## 2. Sequence Diagram — Full Pipeline

```
Role 1 (shrey)                Role 2 (this repo)
    │
    │  POST /api/v1/process
    │  {ProcessRequest}
    ├─────────────────────────────────────────────────────────────────→│
    │                                                          FastAPI route
    │                                                               │
    │                                              engine.run(request)
    │                                                               │
    │                                             ┌─── 1. INTERCEPTOR ───────────────┐
    │                                             │  interceptor.process(request)     │
    │                                             │  → InterceptedContext             │
    │                                             └──────────────────────────────────┘
    │                                                               │
    │                                             ┌─── 2. CONTEXTUALIZER ────────────┐
    │                                             │  contextualizer.process(          │
    │                                             │      intercepted, user_id)        │
    │                                             │  ← GET /context/user (Role 3)    │
    │                                             │  ← GET /context/corporate (R3)   │
    │                                             │  → EnrichedContext                │
    │                                             └──────────────────────────────────┘
    │                                                               │
    │                                             ┌─── 3. SCHEDULER ─────────────────┐
    │                                             │  scheduler.process(               │
    │                                             │      enriched, user_id)           │
    │                                             │  ← GET /calendar (Role 1 MCP)    │
    │                                             │  → ScheduledContext               │
    │                                             └──────────────────────────────────┘
    │                                                               │
    │                                             ┌─── 4. TRANSLATOR (initial) ──────┐
    │                                             │  translator.process(              │
    │                                             │      enriched, scheduled)         │
    │                                             │  → TranslatedTask (draft)         │
    │                                             └──────────────────────────────────┘
    │                                                               │
    │                                             ┌─── 5. DEBATE LOOP ───────────────┐
    │                                             │  ConversationMemory created       │
    │                                             │  DebateTranscript created         │
    │                                             │                                   │
    │                                             │  for round in 1..max_rounds:      │
    │                                             │    contextualizer.review_draft(   │
    │                                             │        draft, memory=memory)      │
    │                                             │    scheduler.review_draft(        │
    │                                             │        draft, memory=memory)      │
    │                                             │    ConsensusEngine.evaluate_round │
    │                                             │    → wrap in AgentMessages        │
    │                                             │    → record in DebateTranscript   │
    │                                             │    if consensus: break            │
    │                                             │    else:                          │
    │                                             │      translator.revise(           │
    │                                             │          enriched, reviews)       │
    │                                             │      memory.record_round(...)     │
    │                                             └──────────────────────────────────┘
    │                                                               │
    │                                             ┌─── 6. RESPONSE ASSEMBLY ─────────┐
    │                                             │  _build_response(state, elapsed)  │
    │                                             │  _compute_confidence(state)       │
    │                                             │  transcript.finalise(...)         │
    │                                             │  → ProcessResponse                │
    │                                             └──────────────────────────────────┘
    │
    │  {ProcessResponse}
    │←─────────────────────────────────────────────────────────────────
```

---

## 3. A2A Protocol

All inter-agent communication in the debate phase is wrapped in `AgentMessage`
before being recorded in the `DebateTranscript`.

```
AgentMessage {
    sender: str              # "contextualizer" | "scheduler" | "translator"
    recipient: str           # "debate_engine"
    message_type: MessageType
    confidence: float        # 0.0–1.0 normalised
    reasoning: str           # First 300 chars of concern text or "Approved"
    recommendations: list    # Suggested revisions (max 5)
    payload: AgentReview     # Source object
    timestamp: datetime
}

MessageType {
    PROPOSAL   → initial evaluation or draft submission
    CRITIQUE   → cross-agent critique (via BaseAgent.critique(), not in debate loop)
    REVISION   → translator's revised draft after concerns raised
    CONSENSUS  → reviewer approves the draft
    DISSENT    → reviewer raises concerns
}
```

### Message flow per round:

```
contextualizer.review_draft() → AgentReview
    → AgentMessage(type=CONSENSUS|DISSENT, sender="contextualizer", recipient="debate_engine")

scheduler.review_draft() → AgentReview
    → AgentMessage(type=CONSENSUS|DISSENT, sender="scheduler", recipient="debate_engine")

[if no consensus]:
translator.revise() → new TranslatedTask
    → AgentMessage(type=REVISION, sender="translator", recipient="debate_engine")
```

---

## 4. Debate Lifecycle

```
_run_debate(state):
│
├── Create ConversationMemory   (empty; accumulates round history)
├── Create DebateTranscript     (empty; accumulates all events)
│
└── for round_num in 1..max_rounds:
    │
    ├── draft_text = _translation_to_text(state.current_translation)
    │
    ├── ctx_review = await contextualizer.review_draft(draft_text, memory=memory)
    │       └── if memory.round_count > 0: includes prior round context in prompt
    │
    ├── sch_review = await scheduler.review_draft(draft_text, memory=memory)
    │       └── if memory.round_count > 0: includes prior round context in prompt
    │
    ├── state.debate_rounds.append([ctx_review, sch_review])
    │       └── len(state.debate_rounds) === rounds_completed in ProcessResponse
    │
    ├── wrap reviews in AgentMessages (ctx_msg, sch_msg)
    │
    ├── consensus_result = ConsensusEngine.evaluate_round(reviews, round_num)
    │       ├── approved_count = sum(r.approved for r in reviews)
    │       ├── reached = approved_count >= threshold
    │       ├── all_concerns = [c for r if not r.approved for c in r.concerns]
    │       ├── conflicting_concerns = _detect_conflicts(reviews)
    │       └── dominant_objection = all_concerns[0] or None
    │
    ├── transcript.record_round(round_num, [ctx_msg, sch_msg], consensus_result)
    │
    ├── if consensus_result.reached:
    │       state.consensus_reached = True
    │       memory.record_round(RoundRecord(..., consensus_reached=True))
    │       break
    │
    └── else:
            concerns = [r for r if not r.approved]
            state.current_translation = translator.revise(enriched, scheduled, reviews=concerns)
            transcript.messages.append(AgentMessage(type=REVISION, ...))
            memory.record_round(RoundRecord(..., consensus_reached=False))

After loop:
    transcript.finalise(consensus, confidence=0.0, rounds=len(state.debate_rounds))
    self._last_transcript = transcript
    [_build_response() backfills final_confidence into transcript]
```

---

## 5. Consensus Lifecycle

```
ConsensusEngine.evaluate_round(reviews, round_num):
│
├── approved_count = sum(r.approved for r in reviews)
├── reached = approved_count >= self._threshold
│
├── Collect all concerns from non-approving reviewers
│       all_concerns = [c for r in reviews if not r.approved for c in r.concerns]
│
├── Detect conflicts (_detect_conflicts):
│       Flag concerns whose first 40 chars appear in multiple reviewer outputs.
│       These are amplified priorities for the Translator to address.
│
├── dominant_objection = all_concerns[0] (highest-priority concern to fix first)
│
└── return ConsensusResult {
        reached, approved_count, threshold, round_num,
        concerns, conflicting_concerns, dominant_objection
    }
```

**Threshold**: Default 2 of 2 reviewers must approve. Configurable via
`DEBATE_CONSENSUS_THRESHOLD` env var.

**Max rounds**: Default 3. Configurable via `MAX_DEBATE_ROUNDS` env var.
If max rounds reached without consensus, the last draft is returned with
`consensus_reached=False` and a 0.15 confidence penalty.

---

## 6. LLM Backend Abstraction

```
BaseAgent._call_json(prompt) / _call_text(prompt)
    │
    └── self._backend.call_json(prompt, system_prompt=self.persona)
              │
              ├── GoogleBackend (default)
              │     google-genai 2.8.0 → Gemini API
              │     system_instruction = self.persona (per-call)
              │     response_mime_type = "application/json" (for call_json)
              │
              └── LyzrBackend (LYZR_ENABLED=true)
                    lyzr-adk 0.1.11 → Lyzr Cloud → Gemini via lyzr_google credential
                    message = f"{system_prompt}\n\n{prompt}" (persona prepended)
                    temperature set at creation time (SDK limitation)

Backend selection at startup:

    LYZR_PER_AGENT=false (default):
        create_backend(settings) → GoogleBackend | LyzrBackend (shared)
        All 4 agents share one backend instance

    LYZR_PER_AGENT=true + LYZR_ENABLED=true:
        create_per_agent_lyzr_backends(api_key, model)
        → {interceptor: LyzrBackend, contextualizer: LyzrBackend,
           scheduler: LyzrBackend, translator: LyzrBackend}
        Each agent gets a dedicated Lyzr cloud agent with role-specific identity
```

---

## 7. Extension Points

### Adding a new agent:
1. Create `orchestrator/agents/new_agent.py` extending `BaseAgent`
2. Define `AGENT_IDENTITY` class constant
3. Implement `process()` and optionally `review_draft(translation_draft, memory=None)`
4. Add to `create_debate_engine()` in `debate/engine.py`
5. Add `review_draft()` call in `DebateEngine._run_debate()` (preserves test structure)

### Replacing the consensus algorithm:
1. Replace `ConsensusEngine.evaluate_round()` logic in `consensus/engine.py`
2. `DebateEngine._run_debate()` already delegates to it — no change needed

### Adding long-term memory (Role 3 integration):
1. `ConversationMemory` in `memory/conversation.py` is the short-term layer
2. Role 3 provides the long-term Qdrant layer via `MemoryInterface`
3. At debate end, `DebateTranscript` could be passed to Role 3 for storage
4. Future: `ContextualizerAgent.process()` already reads from Role 3 — the hook exists

### Adding a new LLM provider:
1. Implement `LLMBackend` ABC in `llm/backend.py` or a new file
2. Add a factory function like `create_<provider>_backend()`
3. Wire into `create_backend()` via a new settings flag

---

## 8. Future Role 3 Integration

**Current state**: `MemoryInterface` calls Role 3's HTTP service with graceful fallback.
`ConversationMemory` is per-request only (Phase 5).

**Planned Role 3 integration points**:

```
Flow with full Role 3:
    ProcessRequest
        → Contextualizer queries Role 3: GET /context/user + /context/corporate
        → DebateEngine completes
        → POST /feedback → MemoryInterface.store_feedback() → Role 3 Qdrant

Planned but not yet implemented:
    → After debate: POST transcript to Role 3 for long-term pattern learning
    → Before Interceptor: GET /user/prefs from Role 3 to personalise Interceptor prompts
    → After Translator.revise(): POST intermediate drafts to Role 3 for training data
```

**Why not now**: Role 3's endpoint schema is not yet confirmed (RISK-I02).
All Role 3 calls go through `MemoryInterface` which has graceful fallback.
When Role 3 confirms their API, only `memory_interface.py` needs updating.

---

## 9. Agent Identity Summary

| Agent | Role | Confidence Baseline | Debate Role |
|---|---|---|---|
| Interceptor | Message Intelligence Analyst | 0.85 | Pipeline stage only |
| Contextualizer | Corporate Language Decoder | 0.80 | Reviewer (review_draft) |
| Scheduler | Temporal Realism Enforcer | 0.85 | Reviewer (review_draft) |
| Translator | Neurodivergent Comm Specialist | 0.90 | Producer + reviser |

**Confidence baseline**: Inherent reliability of each agent's domain. Used by
`AgentIdentity.confidence_baseline`. Not yet wired into `ConsensusEngine` weighting
(extension point — weight reviews by agent confidence for more nuanced consensus).

---

## 10. File Map — Session 4 Additions

| File | Purpose | Phase |
|---|---|---|
| `communication/protocol.py` | AgentMessage, MessageType | 2 |
| `consensus/engine.py` | ConsensusEngine, ConsensusResult | 4 |
| `memory/conversation.py` | ConversationMemory, RoundRecord | 5 |
| `debate/transcript.py` | DebateTranscript, ConfidencePoint | 6 |
| `agents/base.py` | AgentIdentity, get_identity(), critique() | 1 |
| `agents/interceptor.py` | AGENT_IDENTITY | 1 |
| `agents/contextualizer.py` | AGENT_IDENTITY, memory param on review_draft() | 1, 3 |
| `agents/scheduler.py` | AGENT_IDENTITY, memory param on review_draft() | 1, 3 |
| `agents/translator.py` | AGENT_IDENTITY | 1 |
| `debate/engine.py` | ConsensusEngine, ConversationMemory, A2A messages, Transcript, last_transcript | 2, 3, 4, 5, 6 |
| `integrations/lyzr_integration.py` | create_per_agent_lyzr_backends() | 7 |
| `config/settings.py` | lyzr_per_agent setting | 7 |
| `api/routes.py` | GET /api/v1/debug/transcript | 6 |
| `main.py` | Per-agent Lyzr startup path | 7 |
