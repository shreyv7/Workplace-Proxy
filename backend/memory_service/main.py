"""Role 3 — Memory Service: FastAPI application.

Provides the Qdrant-backed context retrieval API that Role 2's
MemoryInterface calls during the multi-agent pipeline.

Endpoints:
  GET  /context/user       — User cognitive preferences (UserPreferences)
  GET  /context/corporate   — Corporate jargon & sender patterns (CorporateContext)
  POST /feedback            — Store user feedback ratings for learning
  GET  /health              — Health check + Qdrant stats

Run with:
  cd backend
  python -m uvicorn memory_service.main:app --host 0.0.0.0 --port 8001 --reload
"""
from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from memory_service.embeddings import embed_text, get_embedding_mode
from memory_service.qdrant_client_setup import (
    FEEDBACK_COLLECTION,
    ensure_collections,
    get_collection_stats,
    get_qdrant_client,
    upsert_points,
)
from memory_service.search import build_corporate_response, build_user_response
from memory_service.seed_data import seed_qdrant


# ── Pydantic models ──────────────────────────────────────────────────────────

class FeedbackPayload(BaseModel):
    """Feedback from the user's quality slider, forwarded by Role 2."""
    request_id: str
    user_id: str
    rating: int = Field(..., ge=1, le=5)
    original_message: str = ""
    translated_output: str = ""
    notes: str | None = None


# ── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Initialize Qdrant collections and seed data at startup."""
    print("\n" + "=" * 60)
    print("  Role 3 — Memory Service starting up")
    print("=" * 60)

    ensure_collections()
    counts = seed_qdrant()

    print(f"\n[startup] Qdrant seeded: {counts}")
    print(f"[startup] Embedding mode: {get_embedding_mode()}")
    print(f"[startup] Memory service ready on port 8001")
    print("=" * 60 + "\n")

    yield

    print("[shutdown] Memory service shutting down")


# ── FastAPI app ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="Workplace Proxy — Role 3: Memory & Infrastructure",
    description=(
        "Qdrant-backed context retrieval service. Provides user cognitive preferences "
        "and corporate context to Role 2's multi-agent pipeline via semantic search."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS — Role 2 calls us from localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://localhost:8001",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    """Health check — Role 2 pings this to verify memory service is alive."""
    stats = get_collection_stats()
    return {
        "status": "ok",
        "service": "memory_service",
        "embedding_mode": get_embedding_mode(),
        "qdrant": "connected",
        "collections": stats,
    }


@app.get("/context/user")
async def get_user_context(
    user_id: str = Query(..., description="ID of the neurodivergent user"),
    query: str = Query(..., description="The message text being processed"),
):
    """
    Fetch user cognitive preferences from Qdrant.

    Role 2's MemoryInterface calls this endpoint. Returns formatting preferences,
    working hours, deep work blocks, known stress triggers, and raw context
    from the vector store.

    Endpoint: GET /context/user?user_id=<id>&query=<text>
    """
    response = build_user_response(user_id, query)
    return JSONResponse(content=response)


@app.get("/context/corporate")
async def get_corporate_context(
    query: str = Query(..., description="The message text being processed"),
    sender: str | None = Query(None, description="Name of the message sender"),
):
    """
    Fetch corporate context (jargon, project history, sender patterns) from Qdrant.

    Role 2's MemoryInterface calls this endpoint. Returns resolved jargon,
    relevant projects, sender history, and raw context from the vector store.

    When a sender name is provided, the search is boosted with sender-specific
    documents (communication patterns, escalation history).

    Endpoint: GET /context/corporate?query=<text>&sender=<name>
    """
    response = build_corporate_response(query, sender)
    return JSONResponse(content=response)


@app.post("/feedback")
async def store_feedback(payload: FeedbackPayload):
    """
    Store user feedback for continuous calibration.

    Role 2 forwards the user's slider rating (1-5) here. We embed the
    original message + translated output and store it in Qdrant's feedback
    collection for future retrieval and learning.

    Endpoint: POST /feedback
    """
    try:
        from qdrant_client.models import PointStruct
        import time

        # Create embedding from the combined text
        combined_text = f"{payload.original_message} {payload.translated_output}"
        vector = embed_text(combined_text)

        # Generate a unique numeric ID from request_id
        point_id = abs(hash(payload.request_id)) % (2**63)

        point = PointStruct(
            id=point_id,
            vector=vector,
            payload={
                "request_id": payload.request_id,
                "user_id": payload.user_id,
                "rating": payload.rating,
                "original_message": payload.original_message,
                "translated_output": payload.translated_output,
                "notes": payload.notes,
                "stored_at": time.time(),
            },
        )

        upsert_points(FEEDBACK_COLLECTION, [point])

        return {
            "status": "stored",
            "request_id": payload.request_id,
            "rating": payload.rating,
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)},
        )


# ── CLI entry point ──────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "memory_service.main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
    )
