"""Google ADK (Agent Development Kit) integration layer.

google-adk 2.3.0 is installed and confirmed working.

This module provides ADK-native LlmAgent wrappers for each Workplace Proxy agent persona
and the ADKRunner wrapper that the DebateEngine uses to run the Interceptor stage.

Architecture role:
  The Interceptor (Agent 1) runs through Google ADK's LlmAgent on every request.
  Agents 2-4 (Contextualizer, Scheduler, Translator) run through LyzrBackend.
  Both ultimately route to Google Gemini — ADK directly, Lyzr via its cloud.

ADK A2A (Agent-to-Agent) capability:
  google.adk.a2a is available for cross-agent communication. The A2AAgentExecutor
  can expose agents as A2A services that other agents call via HTTP. This aligns
  perfectly with the PRD's multi-agent debate requirement.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from orchestrator.utils.logging_config import get_logger

logger = get_logger(__name__)

# ── Import ADK (confirmed installed: google-adk 2.3.0) ───────────────────────
try:
    from google.adk.agents import LlmAgent
    from google.adk.runners import Runner
    from google.adk.sessions import InMemorySessionService
    ADK_AVAILABLE = True
    logger.info("google_adk_available", version="2.3.0")
except ImportError:
    ADK_AVAILABLE = False
    logger.warning("google_adk_not_installed", hint="pip install google-adk")


# ── ADKRunner wrapper ─────────────────────────────────────────────────────────

@dataclass
class ADKRunner:
    """
    Wraps a Google ADK Runner together with its InMemorySessionService.

    InMemorySessionService requires explicit session creation before run_async()
    is called. This wrapper handles that automatically.

    Created once at startup (create_runner) and stored on DebateEngine.
    The engine calls .run() for every incoming request in _run_interceptor.
    """

    runner: Any
    session_service: Any
    app_name: str = "workplace_proxy"

    async def run(self, user_message: str, session_id: str, user_id: str) -> str:
        """
        Execute the ADK LlmAgent and return the full text response.

        Creates a fresh session for this request (idempotent — safe if session
        already exists), runs the agent, and collects all content text events.
        """
        from google.genai import types as genai_types

        # InMemorySessionService does not auto-create sessions
        try:
            await self.session_service.create_session(
                app_name=self.app_name,
                user_id=user_id,
                session_id=session_id,
            )
        except Exception:
            pass  # Session already exists for this session_id

        content = genai_types.Content(
            role="user",
            parts=[genai_types.Part.from_text(text=user_message)],
        )

        final_text = ""
        async for event in self.runner.run_async(
            session_id=session_id,
            user_id=user_id,
            new_message=content,
        ):
            if hasattr(event, "content") and event.content:
                for part in event.content.parts:
                    if hasattr(part, "text") and part.text:
                        final_text += part.text

        return final_text.strip()


def create_interceptor_agent(gemini_model: str, persona: str) -> "LlmAgent":
    """
    Create an ADK LlmAgent for the Interceptor role.

    The Interceptor has no external tools — it reasons entirely over the prompt.
    """
    if not ADK_AVAILABLE:
        raise RuntimeError("google-adk not available. Run: pip install google-adk")

    return LlmAgent(
        name="interceptor",
        model=gemini_model,
        instruction=persona,
        description=(
            "Receives raw workplace messages and produces structured analysis: "
            "vague phrases, implicit signals, key references, and urgency estimate."
        ),
        tools=[],
    )


def create_contextualizer_agent(
    gemini_model: str,
    persona: str,
    memory_search_fn: Any | None = None,
) -> "LlmAgent":
    """
    Create an ADK LlmAgent for the Contextualizer role.

    Pass memory_search_fn as a tool so the agent can call Role 3's Qdrant
    context retrieval directly within the ADK tool-call loop.
    """
    if not ADK_AVAILABLE:
        raise RuntimeError("google-adk not available.")

    tools = [memory_search_fn] if memory_search_fn else []
    return LlmAgent(
        name="contextualizer",
        model=gemini_model,
        instruction=persona,
        description=(
            "Enriches intercepted message analysis with corporate context and user "
            "preferences retrieved from Qdrant memory (via Role 3)."
        ),
        tools=tools,
    )


def create_scheduler_agent(
    gemini_model: str,
    persona: str,
    calendar_fn: Any | None = None,
) -> "LlmAgent":
    """
    Create an ADK LlmAgent for the Scheduler role.

    Pass calendar_fn as a tool so the agent can check Role 1's Calendar MCP
    within the ADK tool-call loop.
    """
    if not ADK_AVAILABLE:
        raise RuntimeError("google-adk not available.")

    tools = [calendar_fn] if calendar_fn else []
    return LlmAgent(
        name="scheduler",
        model=gemini_model,
        instruction=persona,
        description=(
            "Proposes a realistic deadline and calendar slot by checking the user's "
            "calendar via Role 1's MCP server."
        ),
        tools=tools,
    )


def create_translator_agent(gemini_model: str, persona: str) -> "LlmAgent":
    """
    Create an ADK LlmAgent for the Translator role.

    The Translator has no external tools — all context is injected into the prompt.
    """
    if not ADK_AVAILABLE:
        raise RuntimeError("google-adk not available.")

    return LlmAgent(
        name="translator",
        model=gemini_model,
        instruction=persona,
        description=(
            "Rewrites vague corporate messages as clear, explicit, neurodivergent-friendly "
            "task descriptions tailored to the user's formatting preferences."
        ),
        tools=[],
    )


def create_runner(
    agent: "LlmAgent",
    app_name: str = "workplace_proxy",
) -> "ADKRunner":
    """
    Create an ADKRunner (LlmAgent + Runner + InMemorySessionService).

    Returns an ADKRunner wrapper that handles session lifecycle automatically.
    Called once at startup; the instance is held on DebateEngine for the
    lifetime of the process.
    """
    if not ADK_AVAILABLE:
        raise RuntimeError("google-adk not available.")

    session_service = InMemorySessionService()
    runner = Runner(
        agent=agent,
        app_name=app_name,
        session_service=session_service,
    )
    return ADKRunner(runner=runner, session_service=session_service, app_name=app_name)


async def run_adk_agent(
    adk_runner: "ADKRunner",
    user_message: str,
    session_id: str,
    user_id: str,
) -> str:
    """
    Execute an ADK LlmAgent via its ADKRunner and return the text response.

    Delegates to ADKRunner.run() which handles session creation automatically.
    """
    if not ADK_AVAILABLE:
        raise RuntimeError("google-adk not available.")
    return await adk_runner.run(user_message, session_id, user_id)
