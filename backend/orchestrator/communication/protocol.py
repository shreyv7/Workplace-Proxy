"""Structured A2A message protocol for inter-agent communication.

AgentMessage is the canonical unit of communication between agents in the debate.
The DebateEngine wraps all AgentReview results in AgentMessages before recording
them in the DebateTranscript. Agents never construct AgentMessages themselves.

Phase 2 of the multi-agent intelligence enhancement (Session 4).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any


class MessageType(str, Enum):
    PROPOSAL = "proposal"    # Initial evaluation / draft submission
    CRITIQUE = "critique"    # Cross-review of another agent's output
    REVISION = "revision"    # Translator's revised draft after concerns raised
    CONSENSUS = "consensus"  # Approval signal — reviewer accepts the draft
    DISSENT = "dissent"      # Disapproval signal — reviewer raises concerns


@dataclass
class AgentMessage:
    """Structured unit of agent-to-agent communication during a debate round.

    Wraps an AgentReview with routing metadata (sender, recipient, type) and a
    normalised confidence score so the DebateTranscript has a uniform event log.
    """
    sender: str
    recipient: str
    message_type: MessageType
    confidence: float                            # 0.0–1.0
    reasoning: str
    recommendations: list[str] = field(default_factory=list)
    payload: Any = None                          # Source AgentReview or TranslatedTask
    timestamp: datetime = field(
        default_factory=lambda: datetime.now(tz=timezone.utc)
    )
