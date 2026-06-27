"""Agent 1 — The Interceptor.

Responsibility: Receive the raw incoming message and produce a structured analysis.
Does NOT query Qdrant (that is Agent 2's job).
Does NOT check the calendar (that is Agent 3's job).
Does NOT rewrite the message (that is Agent 4's job).

The Interceptor extracts:
- Vague or ambiguous phrases
- Implicit signals from sender context
- Key references that need resolution
- An initial (pre-context) urgency estimate
"""
from __future__ import annotations

import json

from orchestrator.agents.base import AgentIdentity, BaseAgent
from orchestrator.api.schemas import (
    InterceptedContext,
    MessageSource,
    ProcessRequest,
    UrgencyLevel,
)
from orchestrator.utils.logging_config import get_logger

logger = get_logger(__name__)

_PERSONA = """You are the Interceptor — Agent 1 in Workplace Proxy's multi-agent system.

Your sole job is to receive a raw workplace message and extract structured intelligence from it.
You are helping neurodivergent employees who struggle to decode implicit corporate communication.

You DO NOT interpret meaning using company context (that comes later).
You DO NOT check schedules or propose deadlines.
You DO NOT rewrite the message.

You ONLY produce a structured analysis of what you observe directly in the message.

Output strict JSON. No markdown. No explanation outside the JSON.

Required JSON structure:
{
  "identified_vague_phrases": ["list of ambiguous phrases found verbatim in the message"],
  "implicit_signals": ["unstated implications you can infer from the message structure alone"],
  "key_references": ["named entities that are unclear and need contextual resolution"],
  "initial_urgency_estimate": "low|medium|high|critical",
  "requires_calendar_check": true|false,
  "interceptor_notes": "brief plain-text note on what makes this message particularly tricky"
}

Vague phrases include: "whenever", "no rush", "at your convenience", "the thing", "that project",
"soon", "ASAP", "circle back", "touch base", "loop in", "ping me", "quick question", etc.

Implicit signals include: sender is a manager (power dynamic), end of day/week timing,
passive question framing that implies expectation, etc.
"""


class Interceptor(BaseAgent):
    """
    Agent 1: Structures and analyses the raw incoming message.

    Powered by Gemini via google-genai 2.8.0.
    Input: ProcessRequest (directly from FastAPI route)
    Output: InterceptedContext (passed to Contextualizer)
    """

    AGENT_IDENTITY = AgentIdentity(
        name="interceptor",
        role="Message Intelligence Analyst",
        expertise=[
            "Pattern recognition in corporate language",
            "Identifying vague and ambiguous phrasing",
            "Extracting implicit power dynamics from text",
            "Detecting unstated urgency signals",
        ],
        goals=[
            "Produce a complete, accurate structural analysis of every message",
            "Flag all implicit signals that neurodivergent users might miss",
        ],
        limitations=[
            "Cannot interpret vagueness using corporate context (Contextualizer's role)",
            "Cannot propose deadlines or schedules (Scheduler's role)",
            "Cannot rewrite the message (Translator's role)",
        ],
        confidence_baseline=0.85,
    )

    def __init__(self, settings=None, backend=None) -> None:
        super().__init__(
            name="interceptor",
            persona=_PERSONA,
            settings=settings,
            backend=backend,
        )

    def _parse_result(self, request: ProcessRequest, result: dict) -> InterceptedContext:
        """
        Build an InterceptedContext from a parsed JSON result dict.

        Extracted so both the Lyzr path (process) and the Google ADK path
        (DebateEngine._run_interceptor) can share the same construction logic.
        """
        try:
            return InterceptedContext(
                raw_content=request.content,
                sender_name=request.sender_name,
                sender_role=request.sender_role,
                source=request.source,
                identified_vague_phrases=result.get("identified_vague_phrases", []),
                implicit_signals=result.get("implicit_signals", []),
                key_references=result.get("key_references", []),
                initial_urgency_estimate=UrgencyLevel(
                    result.get("initial_urgency_estimate", "medium")
                ),
                requires_calendar_check=bool(result.get("requires_calendar_check", True)),
                metadata={"interceptor_notes": result.get("interceptor_notes", "")},
            )
        except (KeyError, ValueError) as exc:
            self._logger.error(
                "interceptor_parse_error",
                error=str(exc),
                raw_result=json.dumps(result)[:200],
            )
            raise ValueError(f"Interceptor could not parse LLM output: {exc}") from exc

    def process(self, request: ProcessRequest) -> InterceptedContext:  # type: ignore[override]
        """
        Analyse the raw message and return a structured InterceptedContext.

        This is the Lyzr-backend path. The Google ADK path bypasses this method
        and calls _parse_result() directly after running via ADKRunner.

        Raises ValueError if the LLM response cannot be parsed after one retry.
        """
        self._logger.info(
            "interceptor_processing",
            message_id=request.message_id,
            source=request.source,
            content_length=len(request.content),
        )

        prompt = self._build_prompt(request)
        result = self._call_json(prompt)
        context = self._parse_result(request, result)

        self._logger.info(
            "interceptor_done",
            vague_phrases=len(context.identified_vague_phrases),
            urgency=context.initial_urgency_estimate,
        )
        return context

    def _build_prompt(self, request: ProcessRequest) -> str:
        """Assemble the full prompt for the Interceptor."""
        parts = [
            f"SOURCE: {request.source.value.upper()}",
            f"FROM: {request.sender_name}" + (
                f" ({request.sender_role})" if request.sender_role else ""
            ),
            f'MESSAGE: "{request.content}"',
        ]
        if request.thread_context:
            parts.append("THREAD CONTEXT (prior messages, oldest first):")
            for msg in request.thread_context[-5:]:  # limit to last 5 for context window
                parts.append(f'  > "{msg}"')

        parts.append(
            "\nAnalyse the MESSAGE above. Produce only the JSON structure described in your instructions."
        )
        return "\n".join(parts)
