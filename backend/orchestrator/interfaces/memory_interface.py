"""Interface to Role 3 (Memory & Infrastructure Lead) — Qdrant context retrieval.

Role 3 owns Qdrant and the RAG pipeline. We call their HTTP service to fetch context.
We do NOT touch Qdrant directly.

STATUS: Graceful fallback implementation. All methods return defaults when Role 3
is unreachable and log a warning rather than raising. Update endpoint paths and
response schemas once Role 3 confirms their API (see INTEGRATION_NOTES.md Interface D).
"""
from __future__ import annotations

from pydantic import BaseModel

from orchestrator.utils.logging_config import get_logger

logger = get_logger(__name__)

try:
    import httpx
    _HTTPX_AVAILABLE = True
except ImportError:
    _HTTPX_AVAILABLE = False


# ── Data models returned by Role 3's service ─────────────────────────────────

class UserPreferences(BaseModel):
    """User's cognitive preferences stored in Qdrant by Role 3."""
    user_id: str
    formatting_style: str = "bullet_points"
    preferred_urgency_language: str = "explicit_deadlines"
    working_hours_start: str = "09:00"
    working_hours_end: str = "18:00"
    deep_work_blocks: list[str] = []
    known_triggers: list[str] = []
    raw_context: str = ""


class CorporateContext(BaseModel):
    """Corporate and project context stored in Qdrant by Role 3."""
    relevant_projects: list[str] = []
    jargon_decoded: dict[str, str] = {}
    sender_history: list[str] = []
    relevant_docs: list[str] = []
    raw_context: str = ""


# ── Interface class ───────────────────────────────────────────────────────────

class MemoryInterface:
    """
    HTTP client for Role 3's context retrieval service.

    All methods degrade gracefully: if the service is unavailable, they return
    default data and add a warning to the caller. They never raise.

    Inject this class into agents via their constructor so tests can substitute a mock.
    """

    def __init__(self, base_url: str, timeout: float = 10.0) -> None:
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout

    async def get_user_preferences(
        self,
        user_id: str,
        query: str,
    ) -> tuple[UserPreferences, str | None]:
        """
        Fetch user cognitive preferences from Role 3's Qdrant service.

        Returns (preferences, warning_message). warning_message is None on success.

        Endpoint assumed: GET /context/user?user_id=&query= (pending Role 3 confirmation).
        """
        if not _HTTPX_AVAILABLE:
            return self._default_user_preferences(user_id), "httpx not installed"

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.get(
                    f"{self._base_url}/context/user",
                    params={"user_id": user_id, "query": query},
                )
                response.raise_for_status()
                data = response.json()
                prefs = UserPreferences(user_id=user_id, **data)
                logger.debug("user_preferences_fetched", user_id=user_id)
                return prefs, None

        except Exception as exc:
            warning = f"Memory service unavailable (user prefs): {type(exc).__name__}"
            logger.warning("memory_service_error", endpoint="get_user_preferences",
                           user_id=user_id, error=str(exc))
            return self._default_user_preferences(user_id), warning

    async def get_corporate_context(
        self,
        query: str,
        sender_name: str | None = None,
    ) -> tuple[CorporateContext, str | None]:
        """
        Fetch corporate context (jargon, project history, past ambiguities) from Role 3.

        Returns (context, warning_message). warning_message is None on success.

        Endpoint assumed: GET /context/corporate?query=&sender= (pending Role 3 confirmation).
        """
        if not _HTTPX_AVAILABLE:
            return CorporateContext(), "httpx not installed"

        try:
            params: dict[str, str] = {"query": query}
            if sender_name:
                params["sender"] = sender_name

            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.get(
                    f"{self._base_url}/context/corporate",
                    params=params,
                )
                response.raise_for_status()
                data = response.json()
                context = CorporateContext(**data)
                logger.debug("corporate_context_fetched", query=query[:50])
                return context, None

        except Exception as exc:
            warning = f"Memory service unavailable (corporate ctx): {type(exc).__name__}"
            logger.warning("memory_service_error", endpoint="get_corporate_context",
                           error=str(exc))
            return CorporateContext(), warning

    async def store_feedback(
        self,
        request_id: str,
        user_id: str,
        rating: int,
        original_message: str,
        translated_output: str,
        notes: str | None = None,
    ) -> bool:
        """
        Forward user feedback to Role 3 for storage in Qdrant.

        Returns True on success, False on failure (never raises).

        Endpoint assumed: POST /feedback (pending Role 3 confirmation).
        """
        if not _HTTPX_AVAILABLE:
            logger.warning("cannot_store_feedback", reason="httpx not installed")
            return False

        try:
            payload = {
                "request_id": request_id,
                "user_id": user_id,
                "rating": rating,
                "original_message": original_message,
                "translated_output": translated_output,
                "notes": notes,
            }
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.post(
                    f"{self._base_url}/feedback",
                    json=payload,
                )
                response.raise_for_status()
                logger.info("feedback_stored", request_id=request_id, rating=rating)
                return True

        except Exception as exc:
            logger.error("feedback_store_failed", request_id=request_id, error=str(exc))
            return False

    def _default_user_preferences(self, user_id: str) -> UserPreferences:
        """Sensible defaults used when the memory service is unavailable."""
        return UserPreferences(
            user_id=user_id,
            formatting_style="bullet_points",
            preferred_urgency_language="explicit_deadlines",
            working_hours_start="09:00",
            working_hours_end="18:00",
        )
