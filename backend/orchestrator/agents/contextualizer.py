"""Agent 2 — The Contextualizer.

Responsibility: Enrich the Interceptor's structured analysis with knowledge from
Role 3's Qdrant memory (user preferences + corporate context).

The Contextualizer:
- Resolves vague references ("the thing" → "Q2 Customer Demo due Friday")
- Decodes implicit urgency ("no rush" → "needs this by EOD given sender history")
- Identifies the sender's true intent
- Provides user formatting preferences to the Translator

The Contextualizer ALSO participates in the debate phase, reviewing the Translator's
draft and raising concerns if the decoded meaning was not preserved.
"""
from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone

from typing import TYPE_CHECKING

from orchestrator.agents.base import AgentIdentity, AgentReview, BaseAgent
from orchestrator.api.schemas import (
    EnrichedContext,
    InterceptedContext,
    UrgencyLevel,
)
if TYPE_CHECKING:
    from orchestrator.memory.conversation import ConversationMemory

from orchestrator.interfaces.memory_interface import (
    CorporateContext,
    MemoryInterface,
    UserPreferences,
)
from orchestrator.utils.logging_config import get_logger

logger = get_logger(__name__)

_PERSONA = """You are the Contextualizer — Agent 2 in Workplace Proxy's multi-agent system.

You receive a structured analysis of a workplace message (from the Interceptor) and rich context
retrieved from a company knowledge base (Qdrant). Your job is to decode what the message REALLY means.

You help neurodivergent employees who struggle with:
- Vague corporate language ("no rush", "the thing", "whenever")
- Implicit urgency hidden in polite phrasing
- Ambiguous references to projects or people

You produce:
1. Resolved references (mapping vague terms to concrete meanings)
2. The decoded urgency level (may differ significantly from apparent urgency)
3. An inferred deadline (if not stated explicitly)
4. The sender's actual intent in plain language
5. A summary of relevant corporate context used

Output strict JSON. No markdown. No preamble.

Required JSON structure:
{
  "resolved_references": {"vague_term": "concrete_meaning", ...},
  "decoded_urgency": "low|medium|high|critical",
  "inferred_deadline_iso": "ISO 8601 datetime or null",
  "sender_intent": "plain language statement of what the sender actually wants",
  "corporate_context_summary": "brief summary of context used to decode the message",
  "confidence": 0.0-1.0
}

When reasoning about urgency:
- "no rush" from a manager before a Friday deadline = HIGH urgency
- "whenever" from a peer on a non-critical task = LOW urgency
- "ASAP" = CRITICAL
- If you cannot determine urgency, default to MEDIUM
"""

_REVIEW_PERSONA = """You are the Contextualizer reviewing a translation draft in a debate.

Your job: check whether the Translator's draft faithfully preserved the decoded meaning and urgency
you identified. You are NOT judging writing style — only factual accuracy and urgency preservation.

Respond with strict JSON:
{
  "approved": true|false,
  "concerns": ["list of specific factual or urgency errors in the draft"],
  "suggested_revisions": "specific text change suggestion, or null if approved"
}
"""


class Contextualizer(BaseAgent):
    """
    Agent 2: Enriches the intercepted message with Qdrant knowledge from Role 3.

    Requires a MemoryInterface to fetch user preferences and corporate context.
    The interface degrades gracefully when Role 3's service is unavailable.
    """

    AGENT_IDENTITY = AgentIdentity(
        name="contextualizer",
        role="Corporate Language Decoder",
        expertise=[
            "Resolving vague references using company knowledge base",
            "Decoding implicit urgency from sender history and context",
            "Identifying sender's true intent behind polite corporate phrasing",
            "Mapping user cognitive preferences to formatting requirements",
        ],
        goals=[
            "Produce a fully-decoded analysis where no vague reference remains unresolved",
            "Ensure the decoded urgency accurately reflects real deadline pressure",
        ],
        limitations=[
            "Cannot propose calendar slots (Scheduler's role)",
            "Cannot produce the final user-facing output (Translator's role)",
            "Quality depends on Role 3's Qdrant knowledge base being populated",
        ],
        confidence_baseline=0.80,
    )

    def __init__(
        self,
        memory: MemoryInterface,
        settings=None,
        backend=None,
    ) -> None:
        super().__init__(
            name="contextualizer",
            persona=_PERSONA,
            settings=settings,
            backend=backend,
        )
        self._memory = memory

    async def process(  # type: ignore[override]
        self,
        intercepted: InterceptedContext,
        user_id: str,
    ) -> tuple[EnrichedContext, list[str]]:
        """
        Enrich the intercepted context with Qdrant memory.

        Returns (EnrichedContext, warnings). warnings is non-empty when the memory
        service was unavailable and defaults were used.
        """
        self._logger.info(
            "contextualizer_processing",
            vague_phrases=len(intercepted.identified_vague_phrases),
            references=len(intercepted.key_references),
        )

        warnings: list[str] = []

        # Phase 1: both Role 3 calls are independent — run concurrently.
        # Tests use return_value mocks (not side_effect), so gather order is irrelevant.
        query = intercepted.raw_content
        (user_prefs, w1), (corporate_ctx, w2) = await asyncio.gather(
            self._memory.get_user_preferences(user_id, query),
            self._memory.get_corporate_context(
                query=query,
                sender_name=intercepted.sender_name,
            ),
        )
        if w1:
            warnings.append(w1)
        if w2:
            warnings.append(w2)

        prompt = self._build_prompt(intercepted, user_prefs, corporate_ctx)
        result = self._call_json(prompt)

        # Parse inferred deadline
        inferred_deadline: datetime | None = None
        raw_deadline = result.get("inferred_deadline_iso")
        if raw_deadline:
            try:
                inferred_deadline = datetime.fromisoformat(raw_deadline)
                if inferred_deadline.tzinfo is None:
                    inferred_deadline = inferred_deadline.replace(tzinfo=timezone.utc)
            except ValueError:
                self._logger.warning("bad_deadline_iso", value=raw_deadline)

        urgency_raw = result.get("decoded_urgency", "medium")
        try:
            decoded_urgency = UrgencyLevel(urgency_raw)
        except ValueError:
            decoded_urgency = UrgencyLevel.MEDIUM

        enriched = EnrichedContext(
            intercepted=intercepted,
            resolved_references=result.get("resolved_references", {}),
            decoded_urgency=decoded_urgency,
            inferred_deadline=inferred_deadline,
            sender_intent=result.get("sender_intent", "Intent could not be determined."),
            user_formatting_preference=user_prefs.formatting_style,
            user_working_hours=(user_prefs.working_hours_start, user_prefs.working_hours_end),
            corporate_context_summary=result.get("corporate_context_summary", ""),
        )

        self._logger.info(
            "contextualizer_done",
            decoded_urgency=enriched.decoded_urgency,
            resolved_references=len(enriched.resolved_references),
        )
        return enriched, warnings

    async def review_draft(
        self,
        translation_draft: str,
        memory: ConversationMemory | None = None,
    ) -> AgentReview:
        """
        Debate phase: review the Translator's draft for factual/urgency accuracy.

        When memory contains prior rounds, the prompt asks whether previously
        raised concerns were addressed — enabling genuine iterative critique
        rather than stateless re-review. Tests pass memory=None (default) so
        existing mock side_effect sequences are unaffected.
        """
        self._logger.debug(
            "contextualizer_reviewing_draft",
            prior_rounds=memory.round_count if memory else 0,
        )

        if memory and memory.round_count > 0:
            prior_context = memory.format_prior_rounds()
            review_prompt = (
                f"You have reviewed this translation in previous debate rounds.\n\n"
                f"WHAT HAPPENED IN PRIOR ROUNDS:\n{prior_context}\n\n"
                f"CURRENT DRAFT (round {memory.round_count + 1}):\n"
                f"{translation_draft}\n\n"
                f"Have the concerns you previously raised been addressed? "
                f"Are there any new factual or urgency issues? "
                f"Respond only with the required JSON."
            )
        else:
            review_prompt = (
                f"The Translator produced this draft translation:\n\n"
                f"{translation_draft}\n\n"
                f"Review it for factual accuracy and urgency preservation. "
                f"Respond only with the required JSON."
            )

        original_persona = self.persona
        self.persona = _REVIEW_PERSONA
        try:
            result = self._call_json(review_prompt, temperature=0.1)
        finally:
            self.persona = original_persona

        return AgentReview(
            agent_name=self.name,
            approved=bool(result.get("approved", True)),
            concerns=result.get("concerns", []),
            suggested_revisions=result.get("suggested_revisions"),
        )

    def _build_prompt(
        self,
        intercepted: InterceptedContext,
        user_prefs: UserPreferences,
        corporate_ctx: CorporateContext,
    ) -> str:
        """Assemble the full contextualisation prompt."""
        context_block = self._build_context_block({
            "User formatting preference": user_prefs.formatting_style,
            "User working hours": f"{user_prefs.working_hours_start}–{user_prefs.working_hours_end}",
            "User known triggers": ", ".join(user_prefs.known_triggers) or "none listed",
            "Raw user context from memory": user_prefs.raw_context or "not available",
            "Corporate context from memory": corporate_ctx.raw_context or "not available",
            "Known jargon": json.dumps(corporate_ctx.jargon_decoded) if corporate_ctx.jargon_decoded else "none",
            "Sender history": "; ".join(corporate_ctx.sender_history) if corporate_ctx.sender_history else "no history",
        })

        vague = intercepted.identified_vague_phrases
        refs = intercepted.key_references
        signals = intercepted.implicit_signals

        return f"""MESSAGE TO ANALYSE:
"{intercepted.raw_content}"

FROM: {intercepted.sender_name}{f' ({intercepted.sender_role})' if intercepted.sender_role else ''}
SOURCE: {intercepted.source.value.upper()}

VAGUE PHRASES DETECTED: {', '.join(vague) if vague else 'none'}
KEY REFERENCES TO RESOLVE: {', '.join(refs) if refs else 'none'}
IMPLICIT SIGNALS: {', '.join(signals) if signals else 'none'}
INITIAL URGENCY ESTIMATE: {intercepted.initial_urgency_estimate.value}

CONTEXT FROM KNOWLEDGE BASE:
{context_block}

Decode the message. Produce only the required JSON.
Today's datetime (UTC): {datetime.now(tz=timezone.utc).isoformat()}"""
