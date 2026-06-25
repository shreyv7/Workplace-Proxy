"""Base agent abstraction for all Project Clarity agents.

Each concrete agent (Interceptor, Contextualizer, Scheduler, Translator) extends
BaseAgent and gets LLM inference via the injected LLMBackend. The backend is
swapped by configuration at startup — agent code is never aware of which backend
is active.

Backend injection:
    Explicit:  Agent(settings=..., backend=GoogleBackend(...))
    Default:   Agent(settings=...)  →  GoogleBackend created from settings
               (preserves backward compatibility; tests work without change)

The _call_text() and _call_json() methods pass self.persona as the system_prompt
to the backend. Contextualizer and Scheduler temporarily swap self.persona during
debate review calls — this is transparent to the backend.

Session 4 additions:
    AgentIdentity — static description of each agent's role and expertise
    BaseAgent.get_identity() — returns the class-level AGENT_IDENTITY constant
    BaseAgent.critique() — optional cross-agent critique capability (not called
                           in the standard debate loop; available for extensions)
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any

from orchestrator.config.settings import Settings, get_settings
from orchestrator.utils.logging_config import get_logger

if TYPE_CHECKING:
    from orchestrator.llm.backend import LLMBackend


# ── Agent identity ────────────────────────────────────────────────────────────

@dataclass
class AgentIdentity:
    """Static description of an agent's role, expertise, and confidence baseline.

    Defined as a class constant (AGENT_IDENTITY) on each concrete agent.
    Used by the DebateTranscript and debug endpoint to surface agent metadata.
    """
    name: str
    role: str
    expertise: list[str]
    goals: list[str]
    limitations: list[str]
    confidence_baseline: float    # Prior probability this agent's output is correct


# ── Shared pipeline types ─────────────────────────────────────────────────────

@dataclass
class AgentReview:
    """Structured review produced by a debate-participant agent."""
    agent_name: str
    approved: bool
    concerns: list[str] = field(default_factory=list)
    suggested_revisions: str | None = None
    timestamp: datetime = field(default_factory=lambda: datetime.now(tz=timezone.utc))

    def to_text(self) -> str:
        """Render as human-readable text for inclusion in subsequent prompts."""
        lines = [f"[{self.agent_name}] — {'APPROVED' if self.approved else 'CONCERNS RAISED'}"]
        if self.concerns:
            lines.append("Concerns:")
            lines.extend(f"  • {c}" for c in self.concerns)
        if self.suggested_revisions:
            lines.append(f"Suggested revision: {self.suggested_revisions}")
        return "\n".join(lines)


# ── Base class ────────────────────────────────────────────────────────────────

class BaseAgent(ABC):
    """
    Abstract base for all Project Clarity agents.

    Each concrete agent provides:
    - name: unique agent identifier
    - persona: the system instruction passed to the LLM on every call
    - AGENT_IDENTITY: class-level AgentIdentity (role, expertise, confidence)
    - process(): the primary processing method (signature varies per agent)

    The LLMBackend is injected via constructor. When not provided, a GoogleBackend
    is created from settings — this default keeps existing call sites unchanged.
    """

    AGENT_IDENTITY: AgentIdentity | None = None    # Override in each subclass

    def __init__(
        self,
        name: str,
        persona: str,
        settings: Settings | None = None,
        backend: LLMBackend | None = None,
    ) -> None:
        self.name = name
        self.persona = persona
        self._settings = settings or get_settings()
        self._logger = get_logger(f"agent.{name}")

        if backend is not None:
            self._backend: LLMBackend = backend
        else:
            from orchestrator.llm.backend import GoogleBackend
            self._backend = GoogleBackend(
                api_key=self._settings.google_api_key,
                model=self._settings.gemini_model,
            )

    # ── LLM call helpers ─────────────────────────────────────────────────────

    def _call_text(self, prompt: str, temperature: float = 0.3) -> str:
        """Delegate to the active LLM backend for a free-form text response."""
        self._logger.debug(
            "llm_call_text",
            prompt_length=len(prompt),
            backend=type(self._backend).__name__,
        )
        return self._backend.call_text(
            prompt=prompt,
            system_prompt=self.persona,
            temperature=temperature,
        )

    def _call_json(self, prompt: str, temperature: float = 0.2) -> Any:
        """
        Delegate to the active LLM backend for a JSON response.

        The active persona (self.persona) is passed as system_prompt. Contextualizer
        and Scheduler temporarily replace self.persona during debate review calls —
        that swap is transparent here, the backend receives whatever is current.
        """
        self._logger.debug(
            "llm_call_json",
            prompt_length=len(prompt),
            backend=type(self._backend).__name__,
        )
        try:
            return self._backend.call_json(
                prompt=prompt,
                system_prompt=self.persona,
                temperature=temperature,
            )
        except Exception as exc:
            self._logger.error(
                "llm_call_json_failed",
                error=str(exc),
                backend=type(self._backend).__name__,
            )
            raise

    def _build_context_block(self, items: dict[str, str]) -> str:
        """Format a dict of context items as a readable block for prompt injection."""
        if not items:
            return "(no additional context available)"
        lines = []
        for key, value in items.items():
            lines.append(f"  [{key}]: {value}")
        return "\n".join(lines)

    # ── Identity & critique ───────────────────────────────────────────────────

    def get_identity(self) -> AgentIdentity | None:
        """Return this agent's static identity descriptor."""
        return self.__class__.AGENT_IDENTITY

    def critique(self, other_output: str, context: str = "") -> AgentReview:
        """
        Optional cross-agent critique capability.

        Not called in the standard debate loop — the loop uses review_draft()
        on Contextualizer and Scheduler. This method exists as an extension
        point for richer cross-agent critique patterns.
        """
        ctx_block = f"CONTEXT:\n{context}\n\n" if context else ""
        prompt = (
            f"{ctx_block}"
            f"OUTPUT TO CRITIQUE:\n{other_output}\n\n"
            f"As {self.name}, identify any issues with the above. "
            f'Respond with strict JSON: {{"approved": true|false, '
            f'"concerns": [...], "suggested_revisions": "..." or null}}'
        )
        try:
            result = self._call_json(prompt, temperature=0.1)
            return AgentReview(
                agent_name=self.name,
                approved=bool(result.get("approved", True)),
                concerns=result.get("concerns", []),
                suggested_revisions=result.get("suggested_revisions"),
            )
        except Exception:
            return AgentReview(agent_name=self.name, approved=True, concerns=[])

    @abstractmethod
    def process(self, *args: Any, **kwargs: Any) -> Any:
        """Primary processing method — each agent defines its own signature."""
        ...
