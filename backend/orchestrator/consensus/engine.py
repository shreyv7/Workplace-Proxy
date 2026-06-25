"""ConsensusEngine — evaluates agent reviews to determine debate consensus.

Separated from DebateEngine so consensus logic can evolve independently.
DebateEngine coordinates the pipeline; ConsensusEngine decides outcome per round.

Phase 4 of the multi-agent intelligence enhancement (Session 4).
"""
from __future__ import annotations

from dataclasses import dataclass, field

from orchestrator.agents.base import AgentReview
from orchestrator.utils.logging_config import get_logger

logger = get_logger(__name__)


@dataclass
class ConsensusResult:
    """Structured outcome of evaluating one debate round's reviews."""
    reached: bool
    approved_count: int
    threshold: int
    round_num: int
    concerns: list[str] = field(default_factory=list)
    conflicting_concerns: list[str] = field(default_factory=list)
    dominant_objection: str | None = None


class ConsensusEngine:
    """
    Evaluates a round's AgentReviews and surfaces structured consensus outcome.

    Responsibilities:
    - Determine whether approved_count meets the threshold
    - Collect and rank all concerns from dissenting reviewers
    - Detect conflicting concerns across reviewers (opposing signals)
    - Surface a dominant objection for the Translator to prioritise

    DebateEngine reads `ConsensusResult.reached` to decide whether to continue.
    """

    def __init__(self, threshold: int, max_rounds: int) -> None:
        self._threshold = threshold
        self._max_rounds = max_rounds

    def evaluate_round(
        self,
        reviews: list[AgentReview],
        round_num: int,
    ) -> ConsensusResult:
        """
        Evaluate one round of reviews, returning a structured ConsensusResult.

        Consensus is reached when approved_count >= threshold. Concerns are
        collected from all dissenting reviewers; the most prominent is surfaced
        as dominant_objection for the Translator to address first.
        """
        approved_count = sum(1 for r in reviews if r.approved)
        reached = approved_count >= self._threshold

        all_concerns: list[str] = []
        for review in reviews:
            if not review.approved:
                all_concerns.extend(review.concerns)

        conflicting = self._detect_conflicts(reviews)
        dominant = all_concerns[0] if all_concerns else None

        logger.debug(
            "consensus_evaluated",
            round=round_num,
            approved=approved_count,
            threshold=self._threshold,
            reached=reached,
            concern_count=len(all_concerns),
            conflicts=len(conflicting),
        )

        return ConsensusResult(
            reached=reached,
            approved_count=approved_count,
            threshold=self._threshold,
            round_num=round_num,
            concerns=all_concerns,
            conflicting_concerns=conflicting,
            dominant_objection=dominant,
        )

    def _detect_conflicts(self, reviews: list[AgentReview]) -> list[str]:
        """
        Identify concerns that may conflict across reviewers.

        A conflict is flagged when a concern prefix appears in more than one
        reviewer's output — indicating they noticed the same issue independently,
        which amplifies its importance.
        """
        concern_sets = [r.concerns for r in reviews if not r.approved]
        if len(concern_sets) < 2:
            return []

        seen: set[str] = set()
        conflicts: list[str] = []
        for concern_list in concern_sets:
            for c in concern_list:
                key = c[:40].lower()
                if key in seen:
                    conflicts.append(c)
                else:
                    seen.add(key)
        return conflicts
