# Integration Notes — Workplace Proxy

> This document is the binding API contract between Role 1, Role 2, and Role 3.
> ALL THREE roles must agree on these schemas before the June 28 demo.
> Last updated: 2026-06-25 (Role 2 initial proposal — PENDING TEAMMATE CONFIRMATION)

---

## The Single Integration Contract

As stated in the Roles document:
> "Role 1 (shrey) will send a JSON payload (the raw Slack message) to a FastAPI endpoint.
> Role 2 and Role 3 will process that message through Lyzr and Qdrant, and return a clean JSON
> payload (the translated task and calendar slot) back to your frontend."

---

## Interface A — Role 1 → Role 2 (Inbound Request)

**Direction**: Role 1 frontend sends to Role 2 FastAPI  
**Endpoint**: `POST http://<role2-host>:8000/api/v1/process`  
**Status**: ⚠️ PROPOSED by Role 2 — awaiting Role 1 confirmation

### Request Payload (`ProcessRequest`)

```json
{
  "message_id": "slack-C01234567-1234567890.123456",
  "source": "slack",
  "sender_name": "Alice Johnson",
  "sender_role": "Engineering Manager",
  "content": "Hey, are we still on track for the thing? No rush.",
  "timestamp": "2026-06-25T14:30:00Z",
  "thread_context": [
    "Alice: BTW the Q2 demo is on Friday",
    "Bob: Got it, working on it"
  ],
  "user_id": "user_789"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `message_id` | string | Yes | Unique ID from source system |
| `source` | enum: `"slack"`, `"email"`, `"jira"` | Yes | Origin platform |
| `sender_name` | string | Yes | Human-readable sender name |
| `sender_role` | string \| null | No | Sender's org role if known |
| `content` | string | Yes | Raw message text |
| `timestamp` | ISO 8601 datetime | No | Defaults to now |
| `thread_context` | array of strings | No | Prior messages in thread |
| `user_id` | string | Yes | ID of the receiving neurodivergent user |

---

## Interface B — Role 2 → Role 1 (Outbound Response)

**Direction**: Role 2 FastAPI returns to Role 1 frontend  
**Status**: ⚠️ PROPOSED by Role 2 — awaiting Role 1 confirmation

### Response Payload (`ProcessResponse`)

```json
{
  "request_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "original_message": "Hey, are we still on track for the thing? No rush.",
  "translated_task": {
    "title": "Confirm Q2 Demo Readiness with Alice Johnson",
    "description": "Alice is asking about progress on the Q2 demo scheduled for Friday. Despite saying 'no rush', given the Friday deadline and her role as Engineering Manager, this requires a status update today.",
    "action_items": [
      {"description": "Send a brief status update to Alice on Q2 demo progress", "is_time_sensitive": true},
      {"description": "Confirm the demo environment is ready", "is_time_sensitive": true}
    ],
    "urgency": "high",
    "inferred_deadline": "2026-06-25T17:00:00Z",
    "explicit_deadline_given": false,
    "decoded_subtext": "'No rush' here likely means 'I need this by end of day' given the Friday demo context."
  },
  "calendar_slot": {
    "suggested_start": "2026-06-25T15:00:00Z",
    "suggested_end": "2026-06-25T15:30:00Z",
    "duration_minutes": 30,
    "block_type": "shallow_work",
    "rationale": "Next available 30-min window in your schedule; shallow work appropriate for a status update."
  },
  "debate_summary": {
    "rounds_completed": 2,
    "consensus_reached": true,
    "final_positions": {
      "contextualizer": "Approved: context confirms high urgency despite vague language",
      "scheduler": "Approved: 15:00 slot available and appropriate",
      "translator": "Draft accepted after 1 revision to clarify decoded subtext"
    }
  },
  "confidence_score": 0.87,
  "processing_time_ms": 4823,
  "warnings": []
}
```

---

## Interface C — Role 1 → Role 2 (Feedback Submission)

**Direction**: Role 1 sends user's slider rating to Role 2  
**Endpoint**: `POST http://<role2-host>:8000/api/v1/feedback`  
**Status**: ⚠️ PROPOSED — awaiting confirmation

### Feedback Payload (`FeedbackRequest`)

```json
{
  "request_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "rating": 4,
  "user_id": "user_789",
  "notes": "Deadline was slightly off but overall helpful"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `request_id` | UUID string | Yes | Links back to the original ProcessResponse |
| `rating` | integer 1–5 | Yes | 1=poor, 5=excellent |
| `user_id` | string | Yes | |
| `notes` | string \| null | No | Optional user note |

---

## Interface D — Role 2 → Role 3 (Memory / Context Retrieval)

**Direction**: Role 2 calls Role 3's HTTP service  
**Status**: 🔴 PLACEHOLDER — Role 3 MUST confirm endpoint schema

### Expected Endpoint 1: User Preferences

```
GET http://<role3-host>:<port>/context/user?user_id=<id>&query=<text>
```

**Expected Response**:
```json
{
  "formatting_style": "bullet_points",
  "preferred_urgency_language": "explicit_deadlines",
  "working_hours_start": "09:00",
  "working_hours_end": "18:00",
  "deep_work_blocks": ["10:00-12:00", "14:00-16:00"],
  "known_triggers": ["ambiguous deadlines", "vague requests"],
  "raw_context": "User prefers bullet points. Gets anxious with vague language..."
}
```

### Expected Endpoint 2: Corporate Context

```
GET http://<role3-host>:<port>/context/corporate?query=<text>&sender=<name>
```

**Expected Response**:
```json
{
  "relevant_projects": ["Q2 Demo", "Customer Showcase"],
  "jargon_decoded": {
    "the thing": "Q2 Customer Demo (due Friday June 28)",
    "no rush": "typically means EOD same day from this sender"
  },
  "sender_history": ["Alice tends to understate urgency", "has escalated on same-day tasks before"],
  "relevant_docs": ["Q2 Demo requirements doc", "Alice's past messages on demos"],
  "raw_context": "The Q2 demo is scheduled for Friday June 28..."
}
```

### Expected Endpoint 3: Store Feedback

```
POST http://<role3-host>:<port>/feedback
Content-Type: application/json

{
  "request_id": "3fa85f64-...",
  "user_id": "user_789",
  "rating": 4,
  "original_message": "Hey, are we still on track...",
  "translated_output": "Confirm Q2 Demo Readiness...",
  "notes": "..."
}
```

**TODO FOR ROLE 3**: Confirm all three endpoints above. Until confirmed, `MemoryInterface` returns
default data and logs a warning. See `backend/orchestrator/interfaces/memory_interface.py`.

---

## Interface E — Role 2 → Role 1 MCP Calendar (Scheduler Agent)

**Direction**: Role 2's Scheduler agent calls Role 1's Calendar MCP server  
**Status**: 🔴 PLACEHOLDER — Role 1 MUST confirm MCP transport and endpoint schema

### Expected Endpoint 1: Find Available Slot

```
POST http://<mcp-host>:<port>/calendar/find-slot
Content-Type: application/json

{
  "user_id": "user_789",
  "duration_minutes": 30,
  "preferred_after": "2026-06-25T14:30:00Z",
  "block_type": "shallow_work"
}
```

**Expected Response**:
```json
{
  "start": "2026-06-25T15:00:00Z",
  "end": "2026-06-25T15:30:00Z",
  "block_type": "shallow_work",
  "is_available": true
}
```

### Expected Endpoint 2: Today's Calendar

```
GET http://<mcp-host>:<port>/calendar/today?user_id=user_789
```

**Expected Response**: Array of CalendarBlock objects

### ⚠️ MCP Transport Warning

Standard MCP servers use **stdio transport** (subprocess stdin/stdout), NOT HTTP. If Role 1's
Calendar MCP server uses stdio, Role 2's `MCPInterface` needs to be updated to spawn the
subprocess and communicate via stdin/stdout instead of HTTP.

**TODO FOR ROLE 1**: Confirm whether the Calendar MCP server exposes:
- (a) An HTTP REST endpoint (simplest for integration), or
- (b) Standard MCP stdio protocol (requires subprocess management), or
- (c) MCP with SSE transport

See `backend/orchestrator/interfaces/mcp_interface.py` for the current HTTP assumption.

---

## Health Check (Available Immediately)

```
GET http://<role2-host>:8000/health
```

**Response**:
```json
{
  "status": "ok",
  "version": "0.1.0",
  "dependencies": {
    "gemini": "ok",
    "memory_service": "unavailable",
    "calendar_mcp": "unavailable"
  }
}
```

Role 1 can use this to check if Role 2's server is running before sending messages.

---

## OpenAPI Documentation

When Role 2's server is running, the full interactive API documentation is available at:
```
http://localhost:8000/docs         (Swagger UI)
http://localhost:8000/redoc        (ReDoc)
http://localhost:8000/openapi.json (Raw schema for Role 1 to import)
```

---

## Integration Checklist

- [ ] Role 1 confirms `ProcessRequest` schema fields (Interface A)
- [ ] Role 1 confirms `ProcessResponse` schema is usable by frontend (Interface B)
- [ ] Role 1 confirms Calendar MCP transport protocol (Interface E)
- [ ] Role 3 confirms memory service endpoints (Interface D)
- [ ] Role 3 confirms `user_id` format used in Qdrant
- [ ] All three roles agree on `user_id` format consistency
- [ ] CORS configuration confirmed for Role 1's Vercel domain
- [ ] Feedback endpoint confirmed (Interface C)
