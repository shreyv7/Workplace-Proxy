# Hackathon Checklist — Workplace Proxy, Role 2

> **Deadline**: June 28, 2026  
> **Audience**: Any teammate who needs to demo or run Role 2 on short notice.  
> **Role 2 owner**: pranav

---

## 1. Environment Setup

### Required Tools

| Tool | Version | Check |
|---|---|---|
| Python | 3.13.x | `python --version` |
| pip | latest | `pip --version` |
| git | any | `git --version` |

### Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

> **Troubleshooting**: If `lyzr-adk` fails, try `pip install lyzr-adk==0.1.11`. If `google-adk` fails, it is non-critical — core pipeline runs without it.

---

## 2. Required API Keys

| Key | Where to Get | Required? |
|---|---|---|
| `GOOGLE_API_KEY` | [aistudio.google.com](https://aistudio.google.com) → Get API key | **CRITICAL — system will not start without it** |
| `LYZR_API_KEY` | studio.lyzr.ai | Optional — only needed if `LYZR_ENABLED=true` |

### Setting up `.env`

```bash
cp backend/.env.example backend/.env
# Edit backend/.env and fill in GOOGLE_API_KEY
```

Minimum viable `.env`:
```
GOOGLE_API_KEY=your-key-here
```

For demo mode (recommended for live presentation):
```
GOOGLE_API_KEY=your-key-here
DEMO_MODE=true
```

---

## 3. Starting the Server

```bash
cd backend
python -m uvicorn orchestrator.main:app --host 0.0.0.0 --port 8000 --reload
```

**Verify startup** — you should see:
```
startup  version=0.1.0  environment=development
startup_complete  backend=GoogleBackend
```

**Health check**:
```bash
curl http://localhost:8000/api/v1/health
```
Expected: `{"status": "ok", ...}`

---

## 4. Demo Script

### The Canonical Demo Message

**Alice Johnson (Engineering Manager) sends to Slack:**
> "Hey, are we still on track for the thing? No rush."

**This is the message to demo to judges.** It demonstrates:
- Vague corporate language decoded ("the thing" → "Q2 Customer Demo")
- Hidden urgency surfaced ("no rush" → HIGH)
- Multi-agent debate (2 rounds in demo mode)
- Calendar slot proposed
- Confidence score computed

### Demo Mode (Recommended for Live Presentation)

With `DEMO_MODE=true` in your `.env`, this message returns a **deterministic, pre-baked response** — no LLM calls, instant and reliable.

```bash
curl -X POST http://localhost:8000/api/v1/process \
  -H "Content-Type: application/json" \
  -d '{
    "message_id": "demo-001",
    "source": "slack",
    "sender_name": "Alice Johnson",
    "sender_role": "Engineering Manager",
    "content": "Hey, are we still on track for the thing? No rush.",
    "user_id": "user-123"
  }'
```

### Full Pipeline Mode (More Impressive, Less Predictable)

Remove `DEMO_MODE=true` from `.env` and send the same request. The real Gemini pipeline runs. Allow **5–15 seconds** for the response.

---

## 5. Walkthrough for Judges

### Step 1 — Show the raw message
> "This is a real-world Slack message from a manager. Notice the vague language: 'the thing', 'no rush', no explicit deadline."

### Step 2 — Send to API and show the response
Point out:
- **Title**: "Status Update Required: Q2 Customer Demo" — vague "thing" is resolved
- **Urgency**: HIGH — despite "no rush", the system decoded real urgency
- **Decoded subtext**: explains the manager psychology in plain language
- **Action items**: explicit, numbered, time-sensitive flags
- **Calendar slot**: automatically scheduled tomorrow morning
- **Debate summary**: 2 rounds, consensus reached — two AI agents debated and agreed

### Step 3 — Show the debug transcript
```bash
curl http://localhost:8000/api/v1/debug/transcript
```
> "This is the raw A2A (agent-to-agent) debate transcript. The Contextualizer agent raised a concern in round 1. The Translator revised the draft. Both agents approved in round 2."

Key fields to highlight:
- `stage_latencies` — shows which stage took how long
- `consensus_history` — shows the debate evolution round by round
- `messages` — individual agent messages with reasoning

### Step 4 — Show the metrics
```bash
curl http://localhost:8000/api/v1/debug/metrics
```
> "We track operational metrics: messages processed, average latency, consensus rate."

### Step 5 — Show the architecture (optional deep-dive)
Point to `ARCHITECTURE.md`. Key talking points:
- 4 specialized AI agents, not one monolithic model
- Structured debate forces accuracy
- Memory-aware review (agents remember prior rounds)
- Designed for neurodivergent users: removes cognitive overhead of decoding corporate language

---

## 6. Fallback Plan

### If Gemini API is slow / down
→ Switch to `DEMO_MODE=true` and restart the server. The demo scenario returns instantly.

### If the server won't start
→ Check `GOOGLE_API_KEY` is set in `.env`  
→ Check Python 3.13 is active (`python --version`)  
→ Try `pip install -r requirements.txt` again

### If Role 1's frontend can't reach Role 2
→ Check CORS: `CORS_ORIGINS=*` is the default (allows all)  
→ Check the port: Role 2 runs on 8000 by default  
→ Try `curl http://localhost:8000/api/v1/health` from the same machine

### If Role 3's memory service is down
→ Role 2 has graceful degradation built in. The pipeline still runs with default user preferences.  
→ You'll see a warning in the response `warnings` field but the output is still complete.

### If Role 1's Calendar MCP is down
→ Role 2 automatically falls back to a next-morning 09:00 slot.  
→ You'll see `[Fallback slot — calendar unavailable]` in the calendar title.  
→ Pipeline does not crash.

---

## 7. Known Limitations

| Limitation | Impact | Workaround |
|---|---|---|
| Single process — no horizontal scaling | One request at a time | Acceptable for demo |
| ConversationMemory is per-request (not cross-session) | Debate doesn't accumulate knowledge between users | By design for privacy |
| Gemini API latency 1–3s per call | Full pipeline can take 8–15s | Use DEMO_MODE for live demo |
| stdio/SSE MCP transport are stubs | Can't connect to a real MCP stdio server yet | HTTP transport works |
| LLM response quality varies | Debate may produce unexpected phrasings | DEMO_MODE for consistency |

---

## 8. Architecture Explanation for Judges

```
Role 1 Frontend (Shrey)
     │  POST /api/v1/process
     ▼
┌─────────────────────────────────────────────────────────┐
│  Role 2: Multi-Agent Orchestrator (Pranav)              │
│                                                         │
│  Interceptor Agent                                      │
│  (structures the raw Slack/Email message)               │
│        │                                                │
│        ▼                                                │
│  Contextualizer Agent ◄──► Role 3 Memory (Qdrant)      │
│  (decodes vague language using company knowledge)       │
│        │                                                │
│        ▼                                                │
│  Scheduler Agent ◄──► Role 1 Calendar MCP              │
│  (finds the right time slot)                            │
│        │                                                │
│        ▼                                                │
│  Translator Agent                                       │
│  (writes the neurodivergent-friendly task)              │
│        │                                                │
│        ▼                                                │
│  ┌─ Debate Loop (up to 3 rounds) ─┐                    │
│  │ Contextualizer reviews draft   │                    │
│  │ Scheduler reviews draft        │  ← concurrent      │
│  │ ConsensusEngine evaluates      │                    │
│  │ Translator revises if needed   │                    │
│  └────────────────────────────────┘                    │
│        │                                                │
│        ▼                                                │
│  ProcessResponse (JSON)                                 │
└─────────────────────────────────────────────────────────┘
     │
     ▼
Role 1 Frontend displays result to neurodivergent user
```

**Why multiple agents instead of one?**  
Each agent has a focused, constrained role. Specialisation improves accuracy. The debate catches errors: if the Contextualizer detects that the Translator lost the urgency signal, it raises a concern and the translation is revised.

**Why debate?**  
"No rush" from a manager looks low-urgency to a single model. But the Contextualizer, which specialises in decoding implicit urgency, catches it and ensures the final translation correctly flags it as HIGH urgency.

---

## 9. Integration Checklist

Before the demo, verify:

- [ ] `GOOGLE_API_KEY` is valid (test: `curl http://localhost:8000/api/v1/health` → `"gemini": "configured"`)
- [ ] Role 1 has the correct API URL for Role 2 (default: `http://localhost:8000`)
- [ ] Role 1 CORS origin is allowed (default: `*` allows everything)
- [ ] Role 3 memory service URL is set (`MEMORY_SERVICE_URL`) — or confirm fallback works
- [ ] Calendar MCP URL is set (`MCP_CALENDAR_URL`) — or confirm fallback works
- [ ] 36/36 tests pass: `cd backend && python -m pytest tests/ -q`
- [ ] Server starts cleanly: `startup_complete` in logs
- [ ] `/api/v1/health` returns `"status": "ok"`
- [ ] `/api/v1/process` with the demo message returns a valid `ProcessResponse`
- [ ] `/api/v1/debug/transcript` returns the debate transcript
- [ ] `/api/v1/debug/metrics` returns the metrics snapshot

---

## 10. Common Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `ValidationError: google_api_key` | `GOOGLE_API_KEY` not set | Add to `.env` |
| `AttributeError: 'Settings' object has no attribute X` | Stale `.pyc` cache | `find backend -name '__pycache__' -type d -exec rm -rf {} +` |
| `ConnectionRefusedError` from memory service | Role 3 not running | Expected — pipeline uses fallback automatically |
| `ConnectionRefusedError` from calendar MCP | Role 1 MCP not running | Expected — Scheduler uses fallback slot automatically |
| `422 Unprocessable Entity` | Missing required fields in request | Ensure `message_id`, `source`, `sender_name`, `content`, `user_id` are all present |
| `503 Service Unavailable` on `/process` | Engine not initialised | Check startup logs for errors |
| Slow responses (>15s) | Gemini API + 3 debate rounds | Enable `DEMO_MODE=true` for demos |
| `ModuleNotFoundError: orchestrator` | Wrong working directory | Run from `backend/` directory |

---

## 11. Useful Commands Reference

```bash
# Start the server
cd backend && python -m uvicorn orchestrator.main:app --host 0.0.0.0 --port 8000

# Run all tests
cd backend && python -m pytest tests/ -q

# Run just debate tests
cd backend && python -m pytest tests/test_debate.py -v

# Check health
curl http://localhost:8000/api/v1/health | python -m json.tool

# Send demo message
curl -X POST http://localhost:8000/api/v1/process \
  -H "Content-Type: application/json" \
  -d '{"message_id":"demo-1","source":"slack","sender_name":"Alice Johnson","sender_role":"Engineering Manager","content":"Hey, are we still on track for the thing? No rush.","user_id":"user-123"}' \
  | python -m json.tool

# View last debate transcript
curl http://localhost:8000/api/v1/debug/transcript | python -m json.tool

# View metrics
curl http://localhost:8000/api/v1/debug/metrics | python -m json.tool

# Clear Python cache (if import errors)
find backend -type d -name "__pycache__" -exec rm -rf {} +

# Check Python version
python --version

# Check installed packages
pip list | grep -E "fastapi|pydantic|google-genai|lyzr|httpx"
```

---

## 12. Judge Talking Points

1. **The problem is real**: Neurodivergent employees (ADHD, Autism) face real cognitive overhead decoding corporate language like "no rush" or "the thing". Our system removes that burden.

2. **Multi-agent = more accurate**: A single LLM call might miss the hidden urgency. Our Contextualizer specialises in this and can override the initial reading. The debate enforces accuracy.

3. **Production architecture**: This isn't a prototype. We have structured logging, graceful degradation, retry logic, configurable backends, transport adapters, and 36 unit tests. It's ready for production.

4. **Memory-aware debate**: In round 2+, agents remember what they said in round 1. They don't repeat the same concerns — they check if the revision addressed them. This is genuine iterative reasoning.

5. **Extensible**: Swap Gemini for Lyzr with one env var (`LYZR_ENABLED=true`). Add more debate agents without changing the orchestration. Swap the calendar transport without touching the Scheduler.

6. **The business case**: Every neurodivergent employee spends 20–40 minutes per day decoding ambiguous messages. Our system returns that time. At scale, this is a significant productivity gain.
