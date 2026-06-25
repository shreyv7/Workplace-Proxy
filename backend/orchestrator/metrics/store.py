"""Internal metrics store — lightweight in-process counters.

Collects operational signals during the request lifecycle.
Exposed at GET /api/v1/debug/metrics (debug/demo only — not part of the public API).

Design: plain dataclass singleton. Thread-safety is not a concern for a single-worker
FastAPI process running demo traffic. If deployed with multiple workers, each worker
maintains its own counters (acceptable for a hackathon scope).

Metrics recorded per request:
  - messages_processed    total requests handled
  - total_latency_ms      cumulative processing time (for average calculation)
  - consensus_reached     requests where debate reached consensus
  - total_debate_rounds   cumulative rounds across all debates
  - fallback_events       times a dependency fell back to defaults
  - demo_mode_hits        requests served from the deterministic demo cache
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class Metrics:
    """All internal counters. Never reset between requests."""
    messages_processed: int = 0
    total_latency_ms: int = 0
    consensus_reached: int = 0
    total_debate_rounds: int = 0
    fallback_events: int = 0
    demo_mode_hits: int = 0

    @property
    def average_latency_ms(self) -> float:
        if self.messages_processed == 0:
            return 0.0
        return round(self.total_latency_ms / self.messages_processed, 1)

    @property
    def consensus_rate(self) -> float:
        if self.messages_processed == 0:
            return 0.0
        return round(self.consensus_reached / self.messages_processed, 3)

    @property
    def average_debate_rounds(self) -> float:
        processed = self.messages_processed - self.demo_mode_hits
        if processed == 0:
            return 0.0
        return round(self.total_debate_rounds / processed, 2)

    @property
    def fallback_rate(self) -> float:
        if self.messages_processed == 0:
            return 0.0
        return round(self.fallback_events / self.messages_processed, 3)

    def to_dict(self) -> dict:
        return {
            "messages_processed": self.messages_processed,
            "total_latency_ms": self.total_latency_ms,
            "average_latency_ms": self.average_latency_ms,
            "consensus_reached": self.consensus_reached,
            "consensus_rate": self.consensus_rate,
            "total_debate_rounds": self.total_debate_rounds,
            "average_debate_rounds": self.average_debate_rounds,
            "fallback_events": self.fallback_events,
            "fallback_rate": self.fallback_rate,
            "demo_mode_hits": self.demo_mode_hits,
        }


_store: Metrics | None = None


def get_metrics() -> Metrics:
    """Return the singleton Metrics instance, creating it on first call."""
    global _store
    if _store is None:
        _store = Metrics()
    return _store


def record_request(
    latency_ms: int,
    consensus: bool,
    rounds: int,
    demo_hit: bool = False,
    fallback_count: int = 0,
) -> None:
    """Record one completed request into the metrics store."""
    m = get_metrics()
    m.messages_processed += 1
    m.total_latency_ms += latency_ms
    if consensus:
        m.consensus_reached += 1
    m.total_debate_rounds += rounds
    if demo_hit:
        m.demo_mode_hits += 1
    m.fallback_events += fallback_count
