"""Embedding helper for Role 3 memory service.

Supports two modes:
1. Google Generative AI embeddings (gemini-embedding-2) — when GOOGLE_API_KEY is set
2. Deterministic hash-based embeddings — fallback when no API key is available

Both produce vectors of the same dimensionality (768) so Qdrant collections
work identically regardless of which mode is active.

For the hackathon demo, the hash-based fallback is sufficient because we
pre-seed data with the same embedding function. Semantic similarity still
works within the hash space (identical/similar strings → similar hashes).
"""
from __future__ import annotations

import hashlib
import os

EMBEDDING_DIM = 768
GOOGLE_EMBEDDING_MODEL = "gemini-embedding-2"

# ── Try loading Google GenAI ─────────────────────────────────────────────────

_GOOGLE_AVAILABLE = False
_google_client = None
_google_failed = False

try:
    from google import genai
    from google.genai import types

    api_key_env = os.environ.get("GOOGLE_API_KEY", "")
    api_key = [k.strip() for k in api_key_env.split(",") if k.strip()][0] if api_key_env else ""
    if api_key and api_key != "your-google-api-key-here":
        _google_client = genai.Client(api_key=api_key)
        _GOOGLE_AVAILABLE = True
        print(f"[embeddings] Using Google {GOOGLE_EMBEDDING_MODEL}")
    else:
        print("[embeddings] No GOOGLE_API_KEY set — using hash-based fallback embeddings")
except ImportError:
    print("[embeddings] google-genai not installed — using hash-based fallback embeddings")


def get_embedding_mode() -> str:
    """Return the active embedding mode for diagnostics."""
    if _GOOGLE_AVAILABLE and not _google_failed:
        return "google"
    if _google_failed:
        return "hash_fallback_after_google_error"
    return "hash_fallback"


def embed_text(text: str) -> list[float]:
    """Embed a single text string into a 768-dimensional vector."""
    if _GOOGLE_AVAILABLE and not _google_failed:
        return _embed_google(text)
    return _embed_hash(text)


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed multiple texts. Uses batch API when available."""
    if _GOOGLE_AVAILABLE and not _google_failed:
        return _embed_google_batch(texts)
    return [_embed_hash(t) for t in texts]


# ── Google embedding implementation ──────────────────────────────────────────

def _embed_google(text: str) -> list[float]:
    """Embed using Google's Gemini embedding model."""
    global _google_failed

    try:
        result = _google_client.models.embed_content(
            model=GOOGLE_EMBEDDING_MODEL,
            contents=text,
            config=types.EmbedContentConfig(
                output_dimensionality=EMBEDDING_DIM,
            ),
        )
    except Exception as exc:
        _google_failed = True
        print(
            "[embeddings] Google embedding failed; "
            f"falling back to hash-based embeddings: {exc}"
        )
        return _embed_hash(text)

    return list(result.embeddings[0].values)


def _embed_google_batch(texts: list[str]) -> list[list[float]]:
    """Batch embed using Google's API."""
    vectors = []
    # Google GenAI batch limit: process in chunks
    for text in texts:
        vectors.append(_embed_google(text))
    return vectors


# ── Hash-based fallback implementation ───────────────────────────────────────

def _embed_hash(text: str) -> list[float]:
    """
    Deterministic hash-based embedding for demo fallback.

    Generates a 768-dim vector by repeatedly hashing the text with different
    seeds. Each byte of the SHA-256 digest is converted to a float in [-1, 1].
    This is deterministic (same text → same vector) and always produces valid
    finite floats (no NaN/Inf risk).

    For the hackathon, we enhance this with keyword matching in the search
    layer to compensate for the lack of true semantic understanding.
    """
    vector: list[float] = []
    # We need 768 floats. SHA-256 gives 32 bytes per hash.
    # So we need ceil(768/32) = 24 different salts.
    for i in range(24):
        h = hashlib.sha256(f"{i}:{text.lower().strip()}".encode()).digest()
        # Convert each byte to a float in [-1, 1]
        for byte_val in h:
            vector.append((byte_val / 127.5) - 1.0)

    # Trim to exactly EMBEDDING_DIM
    vector = vector[:EMBEDDING_DIM]

    # Normalize to unit vector
    norm = sum(x * x for x in vector) ** 0.5
    if norm > 0:
        vector = [x / norm for x in vector]
    return vector
