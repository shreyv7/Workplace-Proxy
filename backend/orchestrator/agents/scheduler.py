"""Agent 3 — The Scheduler.

Responsibility: Propose a realistic deadline and an optimal calendar slot for the
translated task. Uses Role 1's Calendar MCP server to check actual availability.

The Scheduler:
- Checks the user's existing calendar blocks
- Finds the next appropriate deep-work or shallow-work window
- Proposes a deadline based on inferred urgency and calendar reality
- Participates in the debate by reviewing whether the Translator's draft
  includes a realistic and achievable timeline
"""
from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone

from typing import TYPE_CHECKING

from orchestrator.agents.base import AgentIdentity, AgentReview, BaseAgent
from orchestrator.api.schemas import (
    BlockType,
    CalendarSlot,
    EnrichedContext,
    ScheduledContext,
    UrgencyLevel,
)
if TYPE_CHECKING:
    from orchestrator.memory.conversation import ConversationMemory

from orchestrator.interfaces.mcp_interface import MCPInterface, SlotRequest
from orchestrator.utils.logging_config import get_logger

logger = get_logger(__name__)

_PERSONA = """You are the Scheduler — Agent 3 in Workplace Proxy's multi-agent system.

You receive an enriched analysis of a workplace message and information about the user's calendar.
Your job is to propose:
1. A realistic DEADLINE for the task (considering urgency and when the day ends)
2. A DURATION estimate (how long the task will take)
3. A RATIONALE for the timeline choice

You help neurodivergent employees by removing scheduling ambiguity. Never say "soon" or "later" —
always give a concrete time.

Consider:
- CRITICAL urgency → deadline within 2 hours
- HIGH urgency → deadline by end of business day
- MEDIUM urgency → deadline within 2 working days
- LOW urgency → deadline within 5 working days

Output strict JSON. No markdown. No preamble.

Required JSON structure:
{
  "proposed_deadline_iso": "ISO 8601 datetime or null",
  "proposed_duration_minutes": integer (15, 30, 60, 90, or 120),
  "preferred_block_type": "deep_work|shallow_work|meeting|admin",
  "deadline_rationale": "plain-text explanation of why this deadline was chosen",
  "scheduling_rationale": "plain-text explanation of what kind of time block is needed"
}

Duration guidelines:
- Sending a status update → 15–30 min
- Reviewing a document → 30–60 min
- Writing a report → 60–90 min
- Complex analysis / design → 90–120 min
"""

_REVIEW_PERSONA = """You are the Scheduler reviewing a translation draft in a debate.

Your job: check whether the Translator's draft includes a realistic, achievable timeline.
You are NOT judging writing style — only the deadline and time estimates.

Respond with strict JSON:
{
  "approved": true|false,
  "concerns": ["list of specific timeline issues in the draft"],
  "suggested_revisions": "specific correction, or null if approved"
}
"""


class Scheduler(BaseAgent):
    """
    Agent 3: Proposes deadline and calendar slot using Role 1's Calendar MCP.

    Requires an MCPInterface to check calendar availability.
    Degrades gracefully when the Calendar MCP is unavailable.
    """

    AGENT_IDENTITY = AgentIdentity(
        name="scheduler",
        role="Temporal Realism Enforcer",
        expertise=[
            "Mapping urgency levels to concrete deadlines",
            "Reading calendar availability from Role 1's MCP server",
            "Estimating task duration by task type",
            "Proposing deep-work vs shallow-work block classifications",
        ],
        goals=[
            "Eliminate all scheduling ambiguity — never say 'soon' or 'later'",
            "Propose a deadline that is both realistic and aligned with true urgency",
        ],
        limitations=[
            "Cannot decode vague corporate language (Contextualizer's role)",
            "Cannot produce the final user-facing output (Translator's role)",
            "Calendar accuracy depends on Role 1's MCP server being reachable",
        ],
        confidence_baseline=0.85,
    )

    def __init__(
        self,
        mcp: MCPInterface,
        settings=None,
        backend=None,
    ) -> None:
        super().__init__(
            name="scheduler",
            persona=_PERSONA,
            settings=settings,
            backend=backend,
        )
        self._mcp = mcp

    async def process(  # type: ignore[override]
        self,
        enriched: EnrichedContext,
        user_id: str,
    ) -> tuple[ScheduledContext, list[str]]:
        """
        Propose a deadline and calendar slot for the task.

        Returns (ScheduledContext, warnings).
        """
        self._logger.info(
            "scheduler_processing",
            decoded_urgency=enriched.decoded_urgency,
            inferred_deadline=enriched.inferred_deadline,
        )

        warnings: list[str] = []

        # Fetch today's calendar blocks from Role 1's MCP
        today_blocks, cal_warning = await self._mcp.get_todays_blocks(user_id=user_id)
        if cal_warning:
            warnings.append(cal_warning)

        # Ask Gemini to reason about deadline and duration
        prompt = self._build_prompt(enriched, today_blocks)
        result = self._call_json(prompt)

        # Parse proposed deadline
        proposed_deadline: datetime | None = enriched.inferred_deadline
        raw_deadline = result.get("proposed_deadline_iso")
        if raw_deadline:
            try:
                proposed_deadline = datetime.fromisoformat(raw_deadline)
                if proposed_deadline.tzinfo is None:
                    proposed_deadline = proposed_deadline.replace(tzinfo=timezone.utc)
            except ValueError:
                self._logger.warning("bad_scheduler_deadline", value=raw_deadline)

        duration = int(result.get("proposed_duration_minutes", 30))
        block_type_str = result.get("preferred_block_type", "shallow_work")

        # Find actual slot from Calendar MCP
        preferred_after = datetime.now(tz=timezone.utc)
        slot_request = SlotRequest(
            user_id=user_id,
            duration_minutes=duration,
            preferred_after=preferred_after,
            preferred_block_type=block_type_str,
        )
        cal_block, slot_warning = await self._mcp.find_available_slot(slot_request)
        if slot_warning:
            warnings.append(slot_warning)

        # Convert to CalendarSlot schema
        try:
            btype = BlockType(block_type_str)
        except ValueError:
            btype = BlockType.SHALLOW_WORK

        calendar_slot = CalendarSlot(
            suggested_start=cal_block.start,
            suggested_end=cal_block.end,
            duration_minutes=duration,
            block_type=btype,
            rationale=result.get("scheduling_rationale", "Next available slot."),
        )

        scheduled = ScheduledContext(
            proposed_deadline=proposed_deadline,
            proposed_duration_minutes=duration,
            calendar_slot=calendar_slot,
            scheduling_rationale=result.get("scheduling_rationale", ""),
            deadline_rationale=result.get("deadline_rationale", ""),
        )

        self._logger.info(
            "scheduler_done",
            proposed_deadline=proposed_deadline,
            duration_minutes=duration,
            slot_start=cal_block.start.isoformat(),
        )
        return scheduled, warnings

    async def review_draft(
        self,
        translation_draft: str,
        memory: ConversationMemory | None = None,
    ) -> AgentReview:
        """
        Debate phase: review the Translator's draft for timeline correctness.

        When memory contains prior rounds, prompts the reviewer to address
        whether previously flagged timeline issues have been resolved.
        Tests pass memory=None (default) so mock side_effect sequences hold.
        """
        self._logger.debug(
            "scheduler_reviewing_draft",
            prior_rounds=memory.round_count if memory else 0,
        )

        if memory and memory.round_count > 0:
            prior_context = memory.format_prior_rounds()
            review_prompt = (
                f"You have reviewed this translation in previous debate rounds.\n\n"
                f"WHAT HAPPENED IN PRIOR ROUNDS:\n{prior_context}\n\n"
                f"CURRENT DRAFT (round {memory.round_count + 1}):\n"
                f"{translation_draft}\n\n"
                f"Have the timeline concerns you previously raised been addressed? "
                f"Are there any remaining or new scheduling issues? "
                f"Respond only with the required JSON."
            )
        else:
            review_prompt = (
                f"The Translator produced this draft translation:\n\n"
                f"{translation_draft}\n\n"
                f"Review it for timeline accuracy and realistic scheduling. "
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

    def _build_prompt(self, enriched: EnrichedContext, today_blocks: list) -> str:
        """Assemble the Scheduler's prompt."""
        calendar_info = "No calendar data available (using defaults)."
        if today_blocks:
            block_lines = []
            for b in today_blocks:
                start = b.start.strftime("%H:%M") if hasattr(b.start, "strftime") else str(b.start)
                end = b.end.strftime("%H:%M") if hasattr(b.end, "strftime") else str(b.end)
                status = "FREE" if b.is_available else b.block_type.upper()
                title = f" — {b.title}" if b.title else ""
                block_lines.append(f"  {start}–{end}: {status}{title}")
            calendar_info = "Today's calendar:\n" + "\n".join(block_lines)

        refs = enriched.resolved_references
        refs_text = json.dumps(refs) if refs else "none"
        working_hours = f"{enriched.user_working_hours[0]}–{enriched.user_working_hours[1]}"

        return f"""TASK TO SCHEDULE:

Original message: "{enriched.intercepted.raw_content}"
Sender intent: {enriched.sender_intent}
Decoded urgency: {enriched.decoded_urgency.value.upper()}
Inferred deadline from context: {enriched.inferred_deadline or 'none'}
Resolved references: {refs_text}

USER WORKING HOURS: {working_hours}

{calendar_info}

Today's datetime (UTC): {datetime.now(tz=timezone.utc).isoformat()}

Based on the urgency and calendar, propose a deadline and estimate task duration.
Produce only the required JSON."""
