"""API contract schemas — the single source of truth for Role 1 ↔ Role 2 integration.

IMPORTANT: Any change here must be communicated to Role 1 (shrey) immediately.
Share this file's contents or the /docs OpenAPI output.
"""
from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field


# ── Enumerations ──────────────────────────────────────────────────────────────

class MessageSource(str, Enum):
    SLACK = "slack"
    EMAIL = "email"
    JIRA = "jira"
    TEAMS = "teams"


class UrgencyLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class BlockType(str, Enum):
    DEEP_WORK = "deep_work"
    SHALLOW_WORK = "shallow_work"
    MEETING = "meeting"
    ADMIN = "admin"


# ── Inbound (Role 1 → Role 2) ─────────────────────────────────────────────────

class ProcessRequest(BaseModel):
    """
    Sent by Role 1 to trigger the full multi-agent pipeline.

    PENDING CONFIRMATION: Role 1 (shrey) must confirm all field names and types
    match what their frontend sends. See INTEGRATION_NOTES.md Interface A.
    """
    model_config = ConfigDict(extra="ignore")  # tolerate extra fields from Role 1

    message_id: str = Field(
        ...,
        description="Unique ID of the message from the source system (Slack ts, email msgid, etc.)"
    )
    source: MessageSource = Field(..., description="Platform the message originated from")
    sender_name: str = Field(..., description="Human-readable name of the message sender")
    sender_role: str | None = Field(
        None,
        description="Sender's title or role in the organisation, if known"
    )
    content: str = Field(..., description="Raw text content of the message")
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(tz=timezone.utc),
        description="When the message was sent (ISO 8601). Defaults to now if omitted."
    )
    thread_context: list[str] = Field(
        default_factory=list,
        description="Prior messages in the thread, oldest first, for context"
    )
    user_id: str = Field(
        ...,
        description="ID of the neurodivergent user who received the message"
    )


class FeedbackRequest(BaseModel):
    """
    User's quality rating for a translation result.
    Role 1 collects this from the slider and sends it here.
    Role 2 forwards it to Role 3's memory service for Qdrant storage.
    """
    model_config = ConfigDict(extra="ignore")

    request_id: UUID = Field(..., description="request_id from the original ProcessResponse")
    rating: int = Field(..., ge=1, le=5, description="User rating: 1=poor, 5=excellent")
    user_id: str
    notes: str | None = Field(None, description="Optional free-text comment from the user")


# ── Sub-models for ProcessResponse ────────────────────────────────────────────

class ActionItem(BaseModel):
    """A single concrete action extracted from the translated task."""
    description: str
    is_time_sensitive: bool = False


class TranslatedTask(BaseModel):
    """The core output: the original vague message converted to a clear, explicit task."""
    title: str = Field(
        ...,
        description="Short, action-oriented task title (imperative verb + object)"
    )
    description: str = Field(
        ...,
        description="Full, unambiguous description in plain language tailored to user preferences"
    )
    action_items: list[ActionItem] = Field(
        default_factory=list,
        description="Discrete, actionable steps derived from the message"
    )
    urgency: UrgencyLevel
    inferred_deadline: datetime | None = Field(
        None,
        description="Deadline inferred from context when not stated explicitly"
    )
    explicit_deadline_given: bool = Field(
        False,
        description="True if the original message contained an explicit deadline"
    )
    decoded_subtext: str | None = Field(
        None,
        description="Plain-language explanation of what the sender really meant"
    )


class CalendarSlot(BaseModel):
    """A proposed calendar block for working on the translated task."""
    suggested_start: datetime
    suggested_end: datetime
    duration_minutes: int = Field(..., gt=0)
    block_type: BlockType
    rationale: str = Field(
        ...,
        description="Why this specific slot was chosen (deep-work window, buffer before deadline, etc.)"
    )


class AgentDebatePosition(BaseModel):
    """One agent's final position at the end of the debate."""
    agent_name: str
    approved: bool
    summary: str


class DebateSummary(BaseModel):
    """High-level record of what happened in the A2A debate."""
    rounds_completed: int = Field(..., ge=0)
    consensus_reached: bool
    final_positions: list[AgentDebatePosition] = Field(default_factory=list)
    dissenting_concerns: list[str] = Field(
        default_factory=list,
        description="Any concerns that were NOT resolved before consensus"
    )


# ── Outbound (Role 2 → Role 1) ────────────────────────────────────────────────

class ProcessResponse(BaseModel):
    """
    Full response from Role 2 back to Role 1's frontend.

    PENDING CONFIRMATION: Role 1 (shrey) must confirm these fields are sufficient
    for their side-by-side dashboard. See INTEGRATION_NOTES.md Interface B.
    """
    request_id: UUID = Field(
        default_factory=uuid4,
        description="Unique ID for this processing run; referenced by FeedbackRequest"
    )
    original_message: str = Field(..., description="Verbatim original message content")
    translated_task: TranslatedTask
    calendar_slot: CalendarSlot | None = Field(
        None,
        description="None if the Calendar MCP server was unavailable during processing"
    )
    debate_summary: DebateSummary
    confidence_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Composite confidence: how certain the system is about the translation"
    )
    processing_time_ms: int = Field(..., ge=0)
    warnings: list[str] = Field(
        default_factory=list,
        description="Non-fatal issues during processing (e.g. 'calendar unavailable, using fallback')"
    )


class FeedbackResponse(BaseModel):
    """Acknowledgement returned after storing user feedback."""
    success: bool
    message: str


class HealthResponse(BaseModel):
    """Simple health check response for Role 1 to use before sending messages."""
    status: str
    version: str
    dependencies: dict[str, str] = Field(
        default_factory=dict,
        description="Status of each downstream dependency: 'ok' or 'unavailable'"
    )


class ToneType(str, Enum):
    PROFESSIONAL = "professional"
    CASUAL = "casual"
    CONCISE = "concise"


class ReplyDraft(BaseModel):
    text: str
    tone: ToneType
    word_count: int


class GenerateReplyRequest(BaseModel):
    message_id: str
    original_content: str
    sender_name: str
    tone: ToneType | None = ToneType.PROFESSIONAL
    additional_context: str | None = None


class GenerateReplyResponse(BaseModel):
    success: bool
    drafts: list[ReplyDraft]


# ── Internal pipeline models (not exposed via API) ────────────────────────────

class InterceptedContext(BaseModel):
    """Output of Agent 1 (Interceptor) — structured analysis of the raw message."""
    raw_content: str
    sender_name: str
    sender_role: str | None
    source: MessageSource
    identified_vague_phrases: list[str] = Field(
        default_factory=list,
        description="Phrases that are ambiguous and need decoding (e.g. 'the thing', 'no rush')"
    )
    implicit_signals: list[str] = Field(
        default_factory=list,
        description="Unstated implications (e.g. sender is a senior manager, deadline is implicit)"
    )
    key_references: list[str] = Field(
        default_factory=list,
        description="Named entities that need resolution from context (project names, people, docs)"
    )
    initial_urgency_estimate: UrgencyLevel = UrgencyLevel.MEDIUM
    requires_calendar_check: bool = True
    metadata: dict[str, Any] = Field(default_factory=dict)


class EnrichedContext(BaseModel):
    """Output of Agent 2 (Contextualizer) — intercepted context + Qdrant knowledge."""
    intercepted: InterceptedContext
    resolved_references: dict[str, str] = Field(
        default_factory=dict,
        description="Mapping of vague reference → resolved meaning (e.g. 'the thing' → 'Q2 demo')"
    )
    decoded_urgency: UrgencyLevel
    inferred_deadline: datetime | None
    sender_intent: str = Field(..., description="Plain-language statement of what the sender wants")
    user_formatting_preference: str = Field(default="bullet_points")
    user_working_hours: tuple[str, str] = Field(default=("09:00", "18:00"))
    corporate_context_summary: str = ""


class ScheduledContext(BaseModel):
    """Output of Agent 3 (Scheduler) — proposed timeline and calendar block."""
    proposed_deadline: datetime | None
    proposed_duration_minutes: int = 30
    calendar_slot: CalendarSlot | None
    scheduling_rationale: str
    deadline_rationale: str
