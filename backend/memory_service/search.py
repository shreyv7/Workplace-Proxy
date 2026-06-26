"""Semantic search functions for the memory service.

Provides search capabilities over the Qdrant collections:
  - search_user_context:      Find user preference documents relevant to a query
  - search_corporate_context:  Find corporate knowledge relevant to a query + sender
  - build_user_response:      Assemble the JSON response for /context/user
  - build_corporate_response: Assemble the JSON response for /context/corporate

Uses qdrant-client 1.18.0 API (query_points instead of deprecated search).
"""
from __future__ import annotations

from qdrant_client.models import Filter, FieldCondition, MatchValue

from memory_service.embeddings import embed_text
from memory_service.qdrant_client_setup import (
    CORPORATE_CONTEXT_COLLECTION,
    USER_CONTEXT_COLLECTION,
    get_qdrant_client,
)


# ── Search functions ─────────────────────────────────────────────────────────

def search_user_context(
    user_id: str,
    query: str,
    top_k: int = 4,
) -> list[dict]:
    """
    Search user_context collection for documents matching the query.

    Filters by user_id to return only the requesting user's preferences.
    Returns top_k scored results as dicts with payload + score.
    """
    client = get_qdrant_client()
    query_vector = embed_text(query)

    results = client.query_points(
        collection_name=USER_CONTEXT_COLLECTION,
        query=query_vector,
        query_filter=Filter(
            must=[
                FieldCondition(
                    key="user_id",
                    match=MatchValue(value=user_id),
                )
            ]
        ),
        limit=top_k,
        with_payload=True,
    )

    return [
        {"payload": hit.payload, "score": hit.score}
        for hit in results.points
    ]


def search_corporate_context(
    query: str,
    sender_name: str | None = None,
    top_k: int = 5,
) -> list[dict]:
    """
    Search corporate_context collection for documents matching the query.

    When sender_name is provided, results are boosted by also searching for
    sender-specific documents (patterns, history).
    """
    client = get_qdrant_client()

    # Search with the full query
    query_vector = embed_text(query)
    results = client.query_points(
        collection_name=CORPORATE_CONTEXT_COLLECTION,
        query=query_vector,
        limit=top_k,
        with_payload=True,
    )

    hits = [{"payload": hit.payload, "score": hit.score} for hit in results.points]

    # If sender is specified, also search for sender-specific context
    if sender_name:
        sender_query = f"{sender_name} communication patterns history"
        sender_vector = embed_text(sender_query)
        sender_results = client.query_points(
            collection_name=CORPORATE_CONTEXT_COLLECTION,
            query=sender_vector,
            limit=3,
            with_payload=True,
        )

        # Merge sender results, avoiding duplicates
        existing_ids = {h["payload"].get("title") for h in hits}
        for hit in sender_results.points:
            title = hit.payload.get("title", "")
            if title not in existing_ids:
                hits.append({"payload": hit.payload, "score": hit.score})
                existing_ids.add(title)

    return hits


# ── Response builders ────────────────────────────────────────────────────────

def build_user_response(user_id: str, query: str) -> dict:
    """
    Build the JSON response for GET /context/user.

    Matches the schema expected by Role 2's MemoryInterface.UserPreferences:
      - formatting_style
      - preferred_urgency_language
      - working_hours_start / end
      - deep_work_blocks
      - known_triggers
      - raw_context
    """
    hits = search_user_context(user_id, query)

    if not hits:
        # Return defaults if no user data found
        return {
            "formatting_style": "bullet_points",
            "preferred_urgency_language": "explicit_deadlines",
            "working_hours_start": "09:00",
            "working_hours_end": "18:00",
            "deep_work_blocks": [],
            "known_triggers": [],
            "raw_context": "No user context found in vector store.",
        }

    # Aggregate fields from all matching documents
    formatting_style = "bullet_points"
    preferred_urgency = "explicit_deadlines"
    working_start = "09:00"
    working_end = "18:00"
    deep_work_blocks: list[str] = []
    known_triggers: list[str] = []
    raw_parts: list[str] = []

    for hit in hits:
        payload = hit["payload"]
        raw_parts.append(payload.get("content", ""))

        if "formatting_style" in payload:
            formatting_style = payload["formatting_style"]
        if "preferred_urgency_language" in payload:
            preferred_urgency = payload["preferred_urgency_language"]
        if "working_hours_start" in payload:
            working_start = payload["working_hours_start"]
        if "working_hours_end" in payload:
            working_end = payload["working_hours_end"]
        if "deep_work_blocks" in payload:
            deep_work_blocks.extend(payload["deep_work_blocks"])
        if "known_triggers" in payload:
            known_triggers.extend(payload["known_triggers"])

    # Deduplicate
    deep_work_blocks = list(dict.fromkeys(deep_work_blocks))
    known_triggers = list(dict.fromkeys(known_triggers))

    return {
        "formatting_style": formatting_style,
        "preferred_urgency_language": preferred_urgency,
        "working_hours_start": working_start,
        "working_hours_end": working_end,
        "deep_work_blocks": deep_work_blocks,
        "known_triggers": known_triggers,
        "raw_context": " | ".join(raw_parts),
    }


def build_corporate_response(query: str, sender_name: str | None = None) -> dict:
    """
    Build the JSON response for GET /context/corporate.

    Matches the schema expected by Role 2's MemoryInterface.CorporateContext:
      - relevant_projects
      - jargon_decoded
      - sender_history
      - relevant_docs
      - raw_context
    """
    hits = search_corporate_context(query, sender_name)

    if not hits:
        return {
            "relevant_projects": [],
            "jargon_decoded": {},
            "sender_history": [],
            "relevant_docs": [],
            "raw_context": "No corporate context found in vector store.",
        }

    relevant_projects: list[str] = []
    jargon_decoded: dict[str, str] = {}
    sender_history: list[str] = []
    relevant_docs: list[str] = []
    raw_parts: list[str] = []

    for hit in hits:
        payload = hit["payload"]
        raw_parts.append(payload.get("content", ""))

        # Collect projects
        if "relevant_projects" in payload:
            for p in payload["relevant_projects"]:
                if p not in relevant_projects:
                    relevant_projects.append(p)

        # Collect jargon
        if "jargon" in payload:
            jargon_decoded.update(payload["jargon"])

        # Collect sender history
        if "sender_history" in payload:
            for s in payload["sender_history"]:
                if s not in sender_history:
                    sender_history.append(s)

        # Use titles as "relevant docs"
        title = payload.get("title", "")
        if title and title not in relevant_docs:
            relevant_docs.append(title)

    return {
        "relevant_projects": relevant_projects,
        "jargon_decoded": jargon_decoded,
        "sender_history": sender_history,
        "relevant_docs": relevant_docs,
        "raw_context": " | ".join(raw_parts),
    }
