"""Agent 4 — The Translator (Twin).

Responsibility: Produce the final user-facing output. Takes everything the other
agents have gathered and rewrites the vague corporate message into a clear, explicit,
structured task tailored to the user's cognitive preferences.

The Translator:
- Applies user formatting preferences (bullet points, exact deadlines, etc.)
- Integrates the proposed calendar slot from the Scheduler
- Surfaces decoded subtext explicitly (tells the user what was really being said)
- Produces revision drafts during the debate phase when reviewers raise concerns
"""
from __future__ import annotations

import json
from datetime import datetime, timezone

from orchestrator.agents.base import AgentIdentity, AgentReview, BaseAgent
from orchestrator.api.schemas import (
    ActionItem,
    EnrichedContext,
    ScheduledContext,
    TranslatedTask,
    UrgencyLevel,
)
from orchestrator.utils.logging_config import get_logger

logger = get_logger(__name__)

_PERSONA = """You are the Translator (also called The Twin) — Agent 4 in Workplace Proxy's multi-agent system.

You take a fully-decoded analysis of a vague workplace message and rewrite it as a clear, explicit,
neurodivergent-friendly task. You are the last agent before the user sees the output.

Your output must:
1. Have a SHORT, ACTION-ORIENTED TITLE (imperative verb + object, max 10 words)
2. Have a CLEAR DESCRIPTION — no ambiguity, no corporate speak, explicit about what is expected
3. List CONCRETE ACTION ITEMS (what the user must literally do, one step at a time)
4. State the URGENCY explicitly
5. Include the EXACT DEADLINE (never say "soon" or "ASAP")
6. State the DECODED SUBTEXT — what was really being communicated behind the polite language
7. Apply the user's formatting preferences exactly

User formatting preferences you will receive:
- "bullet_points" → use • for all lists, avoid paragraphs
- "numbered_steps" → use numbered steps for action items
- "plain_prose" → write in clear prose, minimal lists

Output strict JSON. No markdown code blocks. No preamble or postamble.

Required JSON structure:
{
  "title": "Action-oriented task title",
  "description": "Clear, explicit description in user-preferred format",
  "action_items": [
    {"description": "Step 1 exactly", "is_time_sensitive": true|false},
    ...
  ],
  "urgency": "low|medium|high|critical",
  "inferred_deadline_iso": "ISO 8601 datetime or null",
  "explicit_deadline_given": false,
  "decoded_subtext": "What the sender really meant, in plain language"
}

Be explicit. Be kind. Remove all ambiguity. The user deserves to know exactly what is expected of them.
"""


class Translator(BaseAgent):
    """
    Agent 4: Produces the final neurodivergent-friendly task translation.

    Input: EnrichedContext (from Contextualizer) + ScheduledContext (from Scheduler)
    Output: TranslatedTask (goes into ProcessResponse)
    """

    AGENT_IDENTITY = AgentIdentity(
        name="translator",
        role="Neurodivergent Communication Specialist (The Twin)",
        expertise=[
            "Rewriting vague corporate messages as explicit, structured tasks",
            "Applying user cognitive preferences (bullet points, prose, numbered steps)",
            "Surfacing decoded subtext so users understand what was really meant",
            "Integrating schedule data into a clear, actionable output",
        ],
        goals=[
            "Eliminate all ambiguity from the final output — every action must be concrete",
            "Produce a translation the user can act on without re-reading the original",
        ],
        limitations=[
            "Cannot decode vague language without Contextualizer's analysis",
            "Cannot validate schedule realism without Scheduler's input",
            "Output quality depends on all prior agents producing accurate output",
        ],
        confidence_baseline=0.90,
    )

    def __init__(self, settings=None, backend=None) -> None:
        super().__init__(
            name="translator",
            persona=_PERSONA,
            settings=settings,
            backend=backend,
        )

    def process(  # type: ignore[override]
        self,
        enriched: EnrichedContext,
        scheduled: ScheduledContext,
    ) -> TranslatedTask:
        """Produce the initial draft of the translated task."""
        self._logger.info(
            "translator_processing",
            decoded_urgency=enriched.decoded_urgency,
            duration_minutes=scheduled.proposed_duration_minutes,
        )
        prompt = self._build_prompt(enriched, scheduled, revision_notes=None)
        return self._parse_response(self._call_json(prompt), enriched)

    def revise(
        self,
        enriched: EnrichedContext,
        scheduled: ScheduledContext,
        reviews: list[AgentReview],
    ) -> TranslatedTask:
        """Produce a revised draft incorporating debate reviewers' concerns."""
        self._logger.info(
            "translator_revising",
            review_count=len(reviews),
            concerns_total=sum(len(r.concerns) for r in reviews),
        )
        revision_notes = "\n\n".join(r.to_text() for r in reviews if not r.approved)
        prompt = self._build_prompt(enriched, scheduled, revision_notes=revision_notes)
        return self._parse_response(self._call_json(prompt, temperature=0.25), enriched)

    def _parse_response(self, result: dict, enriched: EnrichedContext) -> TranslatedTask:
        """Map raw LLM JSON result to TranslatedTask model."""
        inferred_deadline = enriched.inferred_deadline
        raw_dl = result.get("inferred_deadline_iso")
        if raw_dl:
            try:
                inferred_deadline = datetime.fromisoformat(raw_dl)
                if inferred_deadline.tzinfo is None:
                    inferred_deadline = inferred_deadline.replace(tzinfo=timezone.utc)
            except ValueError:
                pass

        urgency_raw = result.get("urgency", enriched.decoded_urgency.value)
        try:
            urgency = UrgencyLevel(urgency_raw)
        except ValueError:
            urgency = enriched.decoded_urgency

        action_items_raw = result.get("action_items", [])
        action_items = []
        for item in action_items_raw:
            if isinstance(item, dict):
                action_items.append(ActionItem(
                    description=item.get("description", ""),
                    is_time_sensitive=bool(item.get("is_time_sensitive", False)),
                ))
            elif isinstance(item, str):
                action_items.append(ActionItem(description=item))

        task = TranslatedTask(
            title=result.get("title", "Task from workplace message"),
            description=result.get("description", ""),
            action_items=action_items,
            urgency=urgency,
            inferred_deadline=inferred_deadline,
            explicit_deadline_given=bool(result.get("explicit_deadline_given", False)),
            decoded_subtext=result.get("decoded_subtext"),
        )
        self._logger.info(
            "translator_done",
            title=task.title[:50],
            action_items=len(task.action_items),
            urgency=task.urgency,
        )
        return task

    def _build_prompt(
        self,
        enriched: EnrichedContext,
        scheduled: ScheduledContext,
        revision_notes: str | None,
    ) -> str:
        """Assemble the Translator's prompt (initial or revision)."""
        refs = json.dumps(enriched.resolved_references) if enriched.resolved_references else "none"

        slot_info = "Not available."
        if scheduled.calendar_slot:
            s = scheduled.calendar_slot
            start = s.suggested_start.strftime("%A %d %B at %H:%M UTC")
            slot_info = (
                f"{s.duration_minutes} min {s.block_type.value.replace('_', ' ')} block "
                f"starting {start}. Rationale: {s.rationale}"
            )

        parts = [
            "ORIGINAL MESSAGE:",
            f'"{enriched.intercepted.raw_content}"',
            "",
            "DECODED ANALYSIS:",
            f"From: {enriched.intercepted.sender_name}"
            + (f" ({enriched.intercepted.sender_role})" if enriched.intercepted.sender_role else ""),
            f"What they really want: {enriched.sender_intent}",
            f"True urgency: {enriched.decoded_urgency.value.upper()}",
            f"Inferred deadline: {enriched.inferred_deadline or 'none'}",
            f"Resolved references: {refs}",
            f"Corporate context: {enriched.corporate_context_summary or 'none'}",
            "",
            "PROPOSED SCHEDULING:",
            f"Deadline: {scheduled.proposed_deadline or 'none'} — {scheduled.deadline_rationale}",
            f"Calendar slot: {slot_info}",
            "",
            f"USER FORMATTING PREFERENCE: {enriched.user_formatting_preference}",
        ]

        if revision_notes:
            parts += [
                "",
                "=== REVISION REQUIRED ===",
                "The following reviewers raised concerns about your previous draft.",
                "Address ALL concerns in your new draft:",
                "",
                revision_notes,
                "",
                "Produce a revised JSON response that addresses all concerns above.",
            ]
        else:
            parts.append("\nProduce the translated task JSON. No preamble.")

        return "\n".join(parts)
