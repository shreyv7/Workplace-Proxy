"""Qdrant client setup and collection management for Role 3.

Uses Qdrant in-memory mode (no Docker required) for hackathon simplicity.
Can be switched to a real Qdrant server by changing the connection parameters.

Collections:
  - user_context:      Personal cognitive preferences per user
  - corporate_context:  Company knowledge, jargon, sender patterns
  - feedback:          User feedback ratings for continuous learning
"""
from __future__ import annotations

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    PointStruct,
    VectorParams,
)

from memory_service.embeddings import EMBEDDING_DIM

# ── Collection names (constants) ─────────────────────────────────────────────

USER_CONTEXT_COLLECTION = "user_context"
CORPORATE_CONTEXT_COLLECTION = "corporate_context"
FEEDBACK_COLLECTION = "feedback"

ALL_COLLECTIONS = [
    USER_CONTEXT_COLLECTION,
    CORPORATE_CONTEXT_COLLECTION,
    FEEDBACK_COLLECTION,
]


# ── Singleton client ─────────────────────────────────────────────────────────

_client: QdrantClient | None = None


def get_qdrant_client() -> QdrantClient:
    """Return the singleton Qdrant client (in-memory for hackathon)."""
    global _client
    if _client is None:
        _client = QdrantClient(":memory:")
        print("[qdrant] Initialized in-memory Qdrant client")
    return _client


def ensure_collections() -> None:
    """Create all required collections if they don't exist."""
    client = get_qdrant_client()

    existing = {c.name for c in client.get_collections().collections}

    for collection_name in ALL_COLLECTIONS:
        if collection_name not in existing:
            client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(
                    size=EMBEDDING_DIM,
                    distance=Distance.COSINE,
                ),
            )
            print(f"[qdrant] Created collection: {collection_name}")
        else:
            print(f"[qdrant] Collection already exists: {collection_name}")


def get_collection_stats() -> dict[str, int]:
    """Return point counts for each collection (for health check)."""
    client = get_qdrant_client()
    stats = {}
    for name in ALL_COLLECTIONS:
        try:
            info = client.get_collection(name)
            stats[name] = info.points_count
        except Exception:
            stats[name] = -1
    return stats


def upsert_points(
    collection_name: str,
    points: list[PointStruct],
) -> None:
    """Insert or update points in a collection."""
    client = get_qdrant_client()
    client.upsert(
        collection_name=collection_name,
        points=points,
    )
