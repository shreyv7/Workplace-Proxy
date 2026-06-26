# Workplace Proxy — Role 3 Memory Service

This is the Qdrant-backed semantic search memory service built for Role 3 (Memory & Infrastructure Lead). It retrieves user preferences and corporate context for the Multi-Agent Orchestration pipeline.

## Features

- **FastAPI service** running on port `8001`.
- **In-memory Qdrant instance** requires zero Docker setup for development/hackathon simplicity.
- **Robust Fallback Embeddings**: If a `GOOGLE_API_KEY` is not present, it gracefully degrades to a deterministic hash-based embedding. This generates consistent 768-dimensional vectors allowing the entire search codebase to function without key dependencies.
- **Auto-seeding**: Auto-populates corporate context and user preference profiles on startup.

## API Endpoints

- `GET /health`: Health status and vector store collection statistics.
- `GET /context/user`: Retrieves user formatting preferences, stress triggers, and cognitive profiles filtered by `user_id`.
- `GET /context/corporate`: Retrieves corporate project context, jargon, and sender patterns based on query semantics, with special boost/merge logic if a `sender` parameter is provided.
- `POST /feedback`: Stores user-submitted feedback rating in the Qdrant vector store.

## Running Locally

From the `backend/` directory:
```bash
python -m uvicorn memory_service.main:app --host 0.0.0.0 --port 8001 --reload
```

## Running Verification Checks

Test the API via PowerShell:
```powershell
# Test User Context
Invoke-RestMethod -Uri 'http://localhost:8001/context/user?user_id=usr_clarity_101&query=formatting' | ConvertTo-Json

# Test Corporate Context
Invoke-RestMethod -Uri 'http://localhost:8001/context/corporate?query=are+we+still+on+track+for+the+thing+no+rush&sender=Alice+Johnson' | ConvertTo-Json
```
