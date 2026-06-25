"""Google ADK (Agent Development Kit) integration layer.

google-adk 2.3.0 is installed and confirmed working.

This module provides ADK-native LlmAgent wrappers for each Project Clarity agent persona,
and a Runner factory for executing them. The core DebateEngine uses these as an optional
backend — the pure Python orchestration in debate/engine.py remains the primary path.

ADK A2A (Agent-to-Agent) capability:
  google.adk.a2a is available for cross-agent communication. The A2AAgentExecutor
  can expose agents as A2A services that other agents call via HTTP. This aligns
  perfectly with the PRD's multi-agent debate requirement.

Extension point: to wire ADK agents into DebateEngine, implement agent_backends
with ADK-backed LLMBackend instances and pass them to create_debate_engine().
"""
from __future__ import annotations

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
    app_name: str = "project_clarity",
) -> "Runner":
    """
    Create an ADK Runner for executing a single agent with in-memory session management.

    For multi-agent pipelines, create one Runner per agent and coordinate externally
    (DebateEngine handles this coordination).
    """
    if not ADK_AVAILABLE:
        raise RuntimeError("google-adk not available.")

    return Runner(
        agent=agent,
        app_name=app_name,
        session_service=InMemorySessionService(),
    )


async def run_adk_agent(
    runner: "Runner",
    user_message: str,
    session_id: str,
    user_id: str,
) -> str:
    """
    Execute an ADK agent via its Runner and return the text response.

    Collects all event text from the async generator until the run completes.
    """
    if not ADK_AVAILABLE:
        raise RuntimeError("google-adk not available.")

    from google.genai import types as genai_types

    content = genai_types.Content(
        role="user",
        parts=[genai_types.Part.from_text(text=user_message)],
    )

    final_text = ""
    async for event in runner.run_async(
        session_id=session_id,
        user_id=user_id,
        new_message=content,
    ):
        # ADK events: collect text from model response events
        if hasattr(event, "content") and event.content:
            for part in event.content.parts:
                if hasattr(part, "text") and part.text:
                    final_text += part.text

    return final_text.strip()
