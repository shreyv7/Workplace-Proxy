"""LLM backend abstraction for Workplace Proxy agents.

All four agents (Interceptor, Contextualizer, Scheduler, Translator) call
BaseAgent._call_text() and ._call_json(), which delegate here. Swapping
backends requires only a configuration change; agent code is untouched.

Architecture:
    BaseAgent
        ↓
    LLMBackend (this module — abstract interface)
        ├── GoogleBackend  direct google-genai 2.8.0 inference
        └── LyzrBackend    lyzr-adk 0.1.11 cloud inference (see integrations/lyzr_integration.py)

Backend selection:
    create_backend(settings) returns the correct backend for the current config.
    When LYZR_ENABLED=true and LYZR_API_KEY is set → LyzrBackend.
    Otherwise → GoogleBackend (default, works with only GOOGLE_API_KEY).

Resilience (Phase 6):
    GoogleBackend wraps every API call in a retry loop.
    llm_retry_count (default 2) and llm_retry_delay_seconds (default 1.0) are
    read from Settings via create_backend(). Call sites are unchanged.
    Retry uses exponential backoff: delay * 2^attempt.
"""
from __future__ import annotations

import time
from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from orchestrator.config.settings import Settings


class LLMBackend(ABC):
    """
    Abstract interface that all LLM inference backends must implement.

    Both call_text and call_json receive the prompt (the variable user-message
    content) and the system_prompt (the agent's persona / role instruction)
    separately so that each backend can handle them in the most natural way.

    GoogleBackend passes system_prompt as system_instruction to the Gemini API.
    LyzrBackend prepends it to the message (the Lyzr agent has a generic description).
    """

    @abstractmethod
    def call_text(self, prompt: str, system_prompt: str, temperature: float = 0.3) -> str:
        """Return a free-form text response."""
        ...

    @abstractmethod
    def call_json(self, prompt: str, system_prompt: str, temperature: float = 0.2) -> Any:
        """Return a parsed Python object (dict or list) from a JSON response."""
        ...


class GoogleBackend(LLMBackend):
    """
    Direct google-genai 2.8.0 inference against the Gemini API.

    One instance is created per process (shared across all four agents via the
    create_debate_engine factory). system_prompt is passed as system_instruction
    in every call, so agent personas take effect at the model level.

    Temperature is honoured per-call (0.2 for JSON, 0.3 for text, 0.1 for review).

    Retry: every call is wrapped in a configurable retry loop.
    retry_count=2 and retry_delay_seconds=1.0 by default (matches Settings defaults).
    On each retry, the delay doubles (exponential backoff): 1s → 2s.
    This handles transient Gemini 429 / 503 errors without crashing the pipeline.
    """

    def __init__(
        self,
        api_key: str,
        model: str,
        retry_count: int = 2,
        retry_delay_seconds: float = 1.0,
    ) -> None:
        from google import genai
        from google.genai import types
        
        # Parse comma-separated list of keys for rotation
        self._api_keys = [k.strip() for k in api_key.split(",") if k.strip()]
        if not self._api_keys:
            self._api_keys = [api_key]
            
        self._current_key_idx = 0
        self._model = model
        self._types = types
        self._retry_count = retry_count
        self._retry_delay = retry_delay_seconds
        
        # Initialize client with first key
        self._reinit_client()

    def _reinit_client(self) -> None:
        from google import genai
        key = self._api_keys[self._current_key_idx]
        self._client = genai.Client(api_key=key)

    def _rotate_key(self) -> None:
        self._current_key_idx = (self._current_key_idx + 1) % len(self._api_keys)
        self._reinit_client()

    def _call_with_retry(self, fn: Any, *args: Any, **kwargs: Any) -> Any:
        """Execute fn(*args, **kwargs), retrying on failure. Rotates to next key on 429/503/UNAVAILABLE errors."""
        last_exc: Exception | None = None
        total_attempts = len(self._api_keys) * (self._retry_count + 1)
        
        for attempt in range(total_attempts):
            try:
                return fn(*args, **kwargs)
            except Exception as exc:
                last_exc = exc
                err_msg = str(exc)
                
                # Check for 429 Rate Limit/Quota or 503 Service Unavailable/Overload
                should_rotate = (
                    "429" in err_msg or 
                    "RESOURCE_EXHAUSTED" in err_msg or 
                    "503" in err_msg or 
                    "UNAVAILABLE" in err_msg
                )
                
                if should_rotate and len(self._api_keys) > 1:
                    # Rotate the API key and reinitialize the client
                    self._rotate_key()
                    # Small buffer delay before retrying with new key
                    time.sleep(0.5)
                    continue
                
                # Standard backoff retry for other errors or if only 1 key
                if attempt < self._retry_count:
                    delay = self._retry_delay * (2 ** attempt)
                    time.sleep(delay)
                else:
                    break
        raise last_exc  # type: ignore[misc]

    def _generate_text(self, prompt: str, system_prompt: str, temperature: float) -> str:
        response = self._client.models.generate_content(
            model=self._model,
            contents=prompt,
            config=self._types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=temperature,
            ),
        )
        return response.text.strip()

    def _generate_json(self, prompt: str, system_prompt: str, temperature: float) -> Any:
        from orchestrator.utils.json_utils import extract_json
        response = self._client.models.generate_content(
            model=self._model,
            contents=prompt,
            config=self._types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=temperature,
                response_mime_type="application/json",
            ),
        )
        return extract_json(response.text.strip())

    def call_text(self, prompt: str, system_prompt: str, temperature: float = 0.3) -> str:
        return self._call_with_retry(self._generate_text, prompt, system_prompt, temperature)

    def call_json(self, prompt: str, system_prompt: str, temperature: float = 0.2) -> Any:
        return self._call_with_retry(self._generate_json, prompt, system_prompt, temperature)


async def create_backend(settings: Settings) -> LLMBackend:
    """
    Factory: return the configured LLM backend for this process.

    Decision tree (evaluated once at FastAPI startup):
      1. LYZR_ENABLED=true AND LYZR_API_KEY set → LyzrBackend (lyzr-adk cloud)
      2. Otherwise → GoogleBackend (google-genai direct) with retry from settings

    This is the single place that reads settings.lyzr_enabled. Agent code never
    checks backend type — it just calls self._backend.call_json(...).
    """
    if settings.lyzr_enabled and settings.lyzr_api_key:
        from orchestrator.integrations.lyzr_integration import (
            LYZR_AVAILABLE,
            create_lyzr_backend,
        )
        if LYZR_AVAILABLE:
            return await create_lyzr_backend(
                api_key=settings.lyzr_api_key,
                model=settings.gemini_model,
            )
        # lyzr-adk import failed — fall through to google-genai
    return GoogleBackend(
        api_key=settings.google_api_key,
        model=settings.gemini_model,
        retry_count=settings.llm_retry_count,
        retry_delay_seconds=settings.llm_retry_delay_seconds,
    )
