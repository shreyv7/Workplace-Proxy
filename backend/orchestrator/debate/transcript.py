"""DebateTranscript — full observability record for one debate pipeline run.

Accumulates every agent message, consensus decision, confidence data point,
and per-stage timing during a debate. Available via GET /api/v1/debug/transcript.

This is NOT part of the ProcessResponse schema — it is purely for debugging
and explainability. Role 1 does not need to consume it; it exists for developers
and judges to inspect how the multi-agent debate actually unfolded.

Phase 6 of the multi-agent intelligence enhancement (Session 4).
Phase 4 of hackathon optimisation (Session 5): added stage timing, fallback events.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any

from orchestrator.communication.protocol import AgentMessage

if TYPE_CHECKING:
    from orchestrator.consensus.engine import ConsensusResult


@dataclass
class ConfidencePoint:
    """Snapshot of confidence at one debate round."""
    round_number: int
    score: float
    approved_count: int
    reached_consensus: bool


@dataclass
class DebateTranscript:
    """Full audit trail for one debate pipeline run.

    Created at the start of run() and stored on the DebateEngine instance as
    last_transcript. The debug endpoint returns to_debug_dict().

    Fields:
        stage_latencies: wall-clock time in ms for each pipeline stage
                         (interceptor, contextualizer, scheduler, initial_translation,
                          round_1 … round_N, debate_total, total)
        total_processing_ms: end-to-end wall time for the full request
        fallback_events: plain-text record of every graceful degradation
                         (e.g. "calendar_mcp_unavailable", "memory_service_timeout")
    """
    request_id: str
    started_at: datetime = field(
        default_factory=lambda: datetime.now(tz=timezone.utc)
    )
    ended_at: datetime | None = None

    messages: list[AgentMessage] = field(default_factory=list)
    consensus_history: list[Any] = field(default_factory=list)    # list[ConsensusResult]
    confidence_history: list[ConfidencePoint] = field(default_factory=list)

    final_consensus: bool = False
    final_confidence: float = 0.0
    rounds_completed: int = 0

    # Phase 4 — observability
    stage_latencies: dict[str, int] = field(default_factory=dict)
    total_processing_ms: int = 0
    fallback_events: list[str] = field(default_factory=list)

    # ── Mutation helpers ──────────────────────────────────────────────────────

    def record_round(
        self,
        round_num: int,
        messages: list[AgentMessage],
        consensus_result: Any,
    ) -> None:
        """Append one round's messages and consensus outcome to the transcript."""
        self.messages.extend(messages)
        self.consensus_history.append(consensus_result)
        self.confidence_history.append(ConfidencePoint(
            round_number=round_num,
            score=0.0,    # Updated in finalise() once confidence is computed
            approved_count=consensus_result.approved_count,
            reached_consensus=consensus_result.reached,
        ))

    def record_stage(self, name: str, ms: int) -> None:
        """Record wall-clock time for one named pipeline stage."""
        self.stage_latencies[name] = ms

    def add_fallback_event(self, event: str) -> None:
        """Record a graceful degradation event (service unavailable, timeout, etc.)."""
        self.fallback_events.append(event)

    def finalise(
        self,
        consensus: bool,
        confidence: float,
        rounds: int,
    ) -> None:
        """Seal the transcript with final outcomes after the debate loop exits."""
        self.ended_at = datetime.now(tz=timezone.utc)
        self.final_consensus = consensus
        self.final_confidence = confidence
        self.rounds_completed = rounds
        for cp in self.confidence_history:
            if cp.reached_consensus:
                cp.score = confidence

    def to_debug_dict(self) -> dict[str, Any]:
        """Serialise the transcript to a JSON-safe dict for the debug endpoint."""
        duration_ms = None
        if self.ended_at:
            duration_ms = int(
                (self.ended_at - self.started_at).total_seconds() * 1000
            )
        return {
            "request_id": self.request_id,
            "started_at": self.started_at.isoformat(),
            "ended_at": self.ended_at.isoformat() if self.ended_at else None,
            "duration_ms": duration_ms,
            "rounds_completed": self.rounds_completed,
            "final_consensus": self.final_consensus,
            "final_confidence": self.final_confidence,
            "total_processing_ms": self.total_processing_ms,
            "stage_latencies": self.stage_latencies,
            "fallback_events": self.fallback_events,
            "consensus_history": [
                {
                    "round": cr.round_num,
                    "reached": cr.reached,
                    "approved_count": cr.approved_count,
                    "threshold": cr.threshold,
                    "concerns": cr.concerns,
                    "dominant_objection": cr.dominant_objection,
                    "conflicting_concerns": cr.conflicting_concerns,
                }
                for cr in self.consensus_history
            ],
            "confidence_history": [
                {
                    "round": cp.round_number,
                    "score": cp.score,
                    "approved_count": cp.approved_count,
                    "reached_consensus": cp.reached_consensus,
                }
                for cp in self.confidence_history
            ],
            "messages": [
                {
                    "sender": m.sender,
                    "recipient": m.recipient,
                    "type": m.message_type.value,
                    "confidence": m.confidence,
                    "reasoning": m.reasoning[:300],
                    "recommendations": m.recommendations[:5],
                    "timestamp": m.timestamp.isoformat(),
                }
                for m in self.messages
            ],
        }
