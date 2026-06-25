"""Per-request ConversationMemory for the debate loop.

Created fresh for each ProcessRequest; discarded after the debate ends.
This is NOT long-term memory — that is Role 3's responsibility via Qdrant.
This only exists during one debate to give reviewers access to prior rounds.

Without this, each reviewer evaluates the revised draft cold: they cannot answer
"did the Translator address my previous concerns?" With it, they can reference
exactly what they flagged before and whether it was resolved.

Phase 5 of the multi-agent intelligence enhancement (Session 4).
"""
from __future__ import annotations

from dataclasses import dataclass, field

from orchestrator.agents.base import AgentReview


@dataclass
class RoundRecord:
    """What happened in one completed debate round."""
    round_number: int
    draft_text: str
    reviews: list[AgentReview]
    approved_count: int
    consensus_reached: bool


class ConversationMemory:
    """
    Accumulates the history of a single debate's rounds (per-request only).

    Reviewers receive this during review_draft() calls. When round_count > 0,
    they include prior round context in their evaluation — enabling genuine
    iterative critique rather than stateless re-review of each revision.
    """

    def __init__(self) -> None:
        self._rounds: list[RoundRecord] = []

    @property
    def round_count(self) -> int:
        return len(self._rounds)

    def record_round(self, record: RoundRecord) -> None:
        self._rounds.append(record)

    def get_rounds(self) -> list[RoundRecord]:
        return list(self._rounds)

    def get_prior_concerns(self) -> list[str]:
        """All concerns raised across all completed rounds, deduplicated."""
        seen: set[str] = set()
        result: list[str] = []
        for rnd in self._rounds:
            for review in rnd.reviews:
                for concern in review.concerns:
                    if concern not in seen:
                        seen.add(concern)
                        result.append(concern)
        return result

    def format_prior_rounds(self) -> str:
        """Render debate history as a readable block for injection into review prompts."""
        if not self._rounds:
            return "(no prior rounds)"
        lines: list[str] = []
        for rnd in self._rounds:
            status = "CONSENSUS REACHED" if rnd.consensus_reached else "NO CONSENSUS"
            lines.append(f"--- Round {rnd.round_number} ({status}) ---")
            for review in rnd.reviews:
                agent_status = "APPROVED" if review.approved else "RAISED CONCERNS"
                lines.append(f"  {review.agent_name}: {agent_status}")
                for concern in review.concerns:
                    lines.append(f"    • {concern}")
                if review.suggested_revisions:
                    lines.append(f"    → Requested: {review.suggested_revisions}")
        return "\n".join(lines)
