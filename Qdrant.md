# Qdrant Integration — Workplace Proxy (Role 3)

## 1. What is Qdrant?

Qdrant is an open-source vector database used in this project to store and retrieve semantic embeddings of user preferences, corporate knowledge, and agent feedback. It enables the multi-agent pipeline (Role 2) to perform semantic similarity search over structured context documents at inference time.

---

## 2. Where Qdrant Runs

Qdrant runs **in-process in memory** by default — no external Docker container or network server is required.

```python
# backend/memory_service/qdrant_client_setup.py
_client = QdrantClient(":memory:")  # in-memory; resets on process restart
```

When `QDRANT_HOST` or `QDRANT_URL` environment variables are set, the client connects to an external Qdrant instance instead (e.g., a Docker container or Qdrant Cloud).

---

## 3. Which Services Use Qdrant

Only **Role 3 (Memory Service)** interacts with Qdrant directly.

| Service | Port | Qdrant Access |
|---|---|---|
| Memory Service (`memory_service/main.py`) | 8001 | Direct via `qdrant-client` |
| Orchestrator (`orchestrator/main.py`) | 8000 | Indirect — calls Memory Service HTTP API |
| Frontend | 5173 | Indirect — calls Orchestrator or Memory Service |

Role 2 never calls Qdrant directly. It goes through `MemoryInterface`, which calls `http://localhost:8001/context/user` and `http://localhost:8001/context/corporate`.

---

## 4. Collections

Three collections are created at Memory Service startup by `ensure_collections()`:

| Collection | Purpose | Seeded at Startup |
|---|---|---|
| `user_context` | User cognitive preferences (formatting style, working hours, triggers, deep-work blocks) | Yes — 4 documents from `seed_data.py` |
| `corporate_context` | Corporate jargon, project names, sender communication patterns, process docs | Yes — 8 documents from `seed_data.py` |
| `feedback` | User quality ratings for agent outputs (1–5 star) | No — populated at runtime via POST /feedback |

---

## 5. Vector Dimensions

All vectors are **768-dimensional**.

```python
# backend/memory_service/embeddings.py
EMBEDDING_DIM = 768
```

This matches the output of **Google's `text-embedding-004` model**. When `GOOGLE_API_KEY` is not set or is a placeholder, a deterministic **SHA-256 hash-based fallback** is used. Both produce 768-dimensional unit vectors so the same Qdrant collections work identically in both modes.

The previous UI label "1536 dimensions (OpenAI text-embedding-3-small)" was incorrect — this project never uses OpenAI embeddings.

---

## 6. Embedding Modes

```
GOOGLE_API_KEY set & valid  →  google/text-embedding-004 (real semantic search)
GOOGLE_API_KEY missing      →  hash-based fallback (deterministic, same-text similarity works)
```

The active mode is reported in:
- `GET /health` on the Memory Service (field: `embedding_mode`)
- The Memory Service startup log: `[startup] Embedding mode: google|hash_fallback`

---

## 7. Data Seeded at Startup

`seed_qdrant()` is called during the FastAPI lifespan hook. It inserts:

**User Context (4 documents):**
1. Communication Style Preferences — bullet points, explicit deadlines
2. Energy & Focus Cycles — peaks 09:00–11:30, deep work 10:00–12:00 and 14:00–16:00
3. Known Stress Triggers — ambiguous deadlines, vague requests, context switches
4. Working Hours & Boundaries — 09:00–18:00, no meetings before 10:00

**Corporate Context (8 documents):**
1. Q2 Customer Demo — "the thing" decoded to this project (due June 28)
2. Alice Johnson Communication Patterns — "no rush" = EOD same day
3. Production Deployment Procedures — staging verification, #infra channel
4. Onboarding Flow v3 Design Files — Figma directory path
5. Northwind Client Information — John Doe, Sally Miller, CRM pipeline
6. Corporate Jargon Reference — EOD, ASAP, circle back, touch base
7. Manager Tom Communication Patterns — hedging language patterns
8. Priya Design Communication Patterns — collaborative language style

Seed data is idempotent — re-running always overwrites the same integer IDs.

---

## 8. Search Implementation

Semantic search uses `client.query_points()` (qdrant-client 1.18.0+, replaces deprecated `.search()`).

- **User context search**: filtered by `user_id` field to scope results to the requesting user
- **Corporate context search**: unfiltered full-collection search; when a `sender` name is provided, a second sender-specific search is merged to boost sender pattern documents
- Results are scored by cosine similarity between the query embedding and stored vectors

---

## 9. HTTP Endpoints (Memory Service, port 8001)

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Returns status, embedding mode, and per-collection point counts |
| `GET` | `/context/user?user_id=&query=` | Semantic search over `user_context`; returns aggregated preferences |
| `GET` | `/context/corporate?query=&sender=` | Semantic search over `corporate_context`; returns jargon, projects, docs |
| `POST` | `/feedback` | Stores a user rating (1–5) in the `feedback` collection |
| `POST` | `/context/user` | Upserts a user onboarding profile into `user_context` |

CORS is configured to allow origins at ports 5173, 8000, 8001, 3000, 3001, 3002.

---

## 10. Response Schemas

### GET /context/user
```json
{
  "formatting_style": "bullet_points",
  "preferred_urgency_language": "explicit_deadlines",
  "working_hours_start": "09:00",
  "working_hours_end": "18:00",
  "deep_work_blocks": ["10:00-12:00", "14:00-16:00"],
  "known_triggers": ["ambiguous deadlines", "vague requests"],
  "raw_context": "Full text of matched documents..."
}
```

### GET /context/corporate
```json
{
  "relevant_projects": ["Q2 Demo", "Northwind Account"],
  "jargon_decoded": {"the thing": "Q2 Customer Demo", "EOD": "17:00 UTC"},
  "sender_history": ["Alice tends to understate urgency"],
  "relevant_docs": ["Q2 Customer Demo", "Corporate Jargon Reference"],
  "raw_context": "Full text of matched documents..."
}
```

---

## 11. Environment Variables

| Variable | Default | Description |
|---|---|---|
| `QDRANT_URL` | unset | Full URL to external Qdrant instance (e.g. `http://localhost:6333`) |
| `QDRANT_HOST` | unset | Hostname of external Qdrant; used together with `QDRANT_PORT` |
| `QDRANT_PORT` | `6333` | Port of external Qdrant (only used if `QDRANT_HOST` is set) |
| `GOOGLE_API_KEY` | unset | Enables Google text-embedding-004; falls back to hash mode when missing |

When neither `QDRANT_URL` nor `QDRANT_HOST` is set, Qdrant runs **in-memory** and no external process is needed.

---

## 12. Persistence

In-memory Qdrant loses all data when the Memory Service process restarts. This is expected during the hackathon — `seed_qdrant()` re-inserts the fixed corpus on every startup, so collections are always populated.

For production persistence, set `QDRANT_URL` to point to a persistent Qdrant instance (Docker volume or Qdrant Cloud). The client code requires no changes.

---

## 13. How Role 2 Uses Qdrant

During the `/api/v1/process` pipeline:

1. **Interceptor Agent** flags the message and passes it to the Contextualizer
2. **Contextualizer Agent** calls `MemoryInterface.get_user_context(user_id, message_text)` and `get_corporate_context(message_text, sender_name)`
3. `MemoryInterface` makes HTTP GET requests to the Memory Service at port 8001
4. The Memory Service embeds the query text and runs `query_points()` against Qdrant
5. Matching documents are assembled into `UserPreferences` and `CorporateContext` objects
6. The Contextualizer uses these to decode ambiguous phrases, infer deadlines, and understand sender history
7. After the user rates the output, `MemoryInterface.store_feedback()` POSTs to `/feedback` which writes a new Qdrant point to the `feedback` collection

---

## 14. Frontend Integration

The **Workspace Memory** page (`src/routes/memory.tsx`) fetches live data from the Memory Service at startup:

```typescript
// src/lib/api.ts
export const MEMORY_SERVICE_URL =
  (import.meta.env.VITE_MEMORY_SERVICE_URL as string | undefined) ?? "http://localhost:8001";

getUserContext(userId)        // GET /context/user
getCorporateContext()         // GET /context/corporate
```

Results are mapped to `MemoryEntry[]` objects and displayed as vector binding cards. If the Memory Service is unreachable, the page falls back to the static `initialMemories` from `src/lib/mock-data.ts`.

The Qdrant Host URI shown in Settings (`src/routes/settings.tsx`) reflects the external Qdrant address when configured via `QDRANT_HOST`/`QDRANT_URL`.

---

## 15. Running Without Docker

Qdrant does **not** require Docker to run locally. The Memory Service uses the in-process `QdrantClient(":memory:")` client, which keeps all data in RAM within the Python process.

To start the Memory Service locally:
```bash
cd backend
# Activate venv first
python -m uvicorn memory_service.main:app --host 0.0.0.0 --port 8001 --reload
```

`start-services.cjs` automatically starts the Memory Service in this mode when Docker is not available. Collections are seeded with the demo corpus every time the process starts.

For an external persistent Qdrant (optional):
```bash
docker run -p 6333:6333 qdrant/qdrant
# Then set: QDRANT_HOST=localhost in backend/.env
```
