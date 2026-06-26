"""Shared pytest fixtures for Role 2 tests.

Uses mocked interfaces so tests don't require:
- A running Gemini API key
- Role 3's Qdrant service
- Role 1's Calendar MCP
"""
from __future__ import annotations

import os

# Set required env vars before any Settings are instantiated.
# Tests never hit the real Gemini API — agents are mocked.
os.environ.setdefault("GOOGLE_API_KEY", "test-key-not-used-in-mocked-tests")
os.environ["DEMO_MODE"] = "false"

from datetime import datetime, timezone
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient

from orchestrator.agents.base import AgentReview
from orchestrator.api.schemas import (
    ActionItem,
    BlockType,
    CalendarSlot,
    EnrichedContext,
    InterceptedContext,
    MessageSource,
    ProcessRequest,
    ScheduledContext,
    TranslatedTask,
    UrgencyLevel,
)
from orchestrator.interfaces.memory_interface import CorporateContext, MemoryInterface, UserPreferences
from orchestrator.interfaces.mcp_interface import CalendarBlock, MCPInterface


# ── Sample data ───────────────────────────────────────────────────────────────

@pytest.fixture
def sample_request() -> ProcessRequest:
    return ProcessRequest(
        message_id="slack-test-001",
        source=MessageSource.SLACK,
        sender_name="Alice Johnson",
        sender_role="Engineering Manager",
        content="Hey, are we still on track for the thing? No rush.",
        timestamp=datetime(2026, 6, 25, 14, 30, tzinfo=timezone.utc),
        thread_context=["Alice: BTW the Q2 demo is on Friday"],
        user_id="user_789",
    )


@pytest.fixture
def sample_intercepted(sample_request) -> InterceptedContext:
    return InterceptedContext(
        raw_content=sample_request.content,
        sender_name=sample_request.sender_name,
        sender_role=sample_request.sender_role,
        source=sample_request.source,
        identified_vague_phrases=["the thing", "no rush"],
        implicit_signals=["Sender is manager — power dynamic applies"],
        key_references=["the thing"],
        initial_urgency_estimate=UrgencyLevel.MEDIUM,
        requires_calendar_check=True,
    )


@pytest.fixture
def sample_enriched(sample_intercepted) -> EnrichedContext:
    return EnrichedContext(
        intercepted=sample_intercepted,
        resolved_references={"the thing": "Q2 Customer Demo (due Friday June 28)"},
        decoded_urgency=UrgencyLevel.HIGH,
        inferred_deadline=datetime(2026, 6, 25, 17, 0, tzinfo=timezone.utc),
        sender_intent="Alice needs a status update on the Q2 demo before end of business today.",
        user_formatting_preference="bullet_points",
        user_working_hours=("09:00", "18:00"),
        corporate_context_summary="Q2 demo is the primary deliverable this week.",
    )


@pytest.fixture
def sample_calendar_slot() -> CalendarSlot:
    return CalendarSlot(
        suggested_start=datetime(2026, 6, 25, 15, 0, tzinfo=timezone.utc),
        suggested_end=datetime(2026, 6, 25, 15, 30, tzinfo=timezone.utc),
        duration_minutes=30,
        block_type=BlockType.SHALLOW_WORK,
        rationale="Next available 30-min window in your calendar.",
    )


@pytest.fixture
def sample_scheduled(sample_calendar_slot) -> ScheduledContext:
    return ScheduledContext(
        proposed_deadline=datetime(2026, 6, 25, 17, 0, tzinfo=timezone.utc),
        proposed_duration_minutes=30,
        calendar_slot=sample_calendar_slot,
        scheduling_rationale="30-minute shallow work block is appropriate for a status update.",
        deadline_rationale="HIGH urgency with Friday demo requires EOD response.",
    )


@pytest.fixture
def sample_translated_task() -> TranslatedTask:
    return TranslatedTask(
        title="Send Q2 Demo Status Update to Alice",
        description=(
            "Alice Johnson (Engineering Manager) is asking about Q2 demo progress. "
            "Despite saying 'no rush', the demo is on Friday — this needs a reply TODAY."
        ),
        action_items=[
            ActionItem(
                description="Send Alice a brief status update on Q2 demo readiness",
                is_time_sensitive=True,
            ),
            ActionItem(
                description="Confirm demo environment is ready",
                is_time_sensitive=True,
            ),
        ],
        urgency=UrgencyLevel.HIGH,
        inferred_deadline=datetime(2026, 6, 25, 17, 0, tzinfo=timezone.utc),
        explicit_deadline_given=False,
        decoded_subtext=(
            "'No rush' here means 'I need this by EOD today' — "
            "Alice's past messages follow this pattern and the Friday demo makes it time-sensitive."
        ),
    )


# ── Mock interfaces ───────────────────────────────────────────────────────────

@pytest.fixture
def mock_memory() -> MagicMock:
    """MemoryInterface mock that returns sensible defaults."""
    memory = MagicMock(spec=MemoryInterface)
    memory.get_user_preferences = AsyncMock(return_value=(
        UserPreferences(
            user_id="user_789",
            formatting_style="bullet_points",
            preferred_urgency_language="explicit_deadlines",
            working_hours_start="09:00",
            working_hours_end="18:00",
        ),
        None,  # no warning
    ))
    memory.get_corporate_context = AsyncMock(return_value=(
        CorporateContext(
            relevant_projects=["Q2 Demo"],
            jargon_decoded={"the thing": "Q2 Customer Demo"},
            sender_history=["Alice understates urgency"],
        ),
        None,
    ))
    memory.store_feedback = AsyncMock(return_value=True)
    return memory


@pytest.fixture
def mock_mcp() -> MagicMock:
    """MCPInterface mock that returns a sensible calendar slot."""
    mcp = MagicMock(spec=MCPInterface)
    mcp.get_todays_blocks = AsyncMock(return_value=([], None))
    mcp.find_available_slot = AsyncMock(return_value=(
        CalendarBlock(
            start=datetime(2026, 6, 25, 15, 0, tzinfo=timezone.utc),
            end=datetime(2026, 6, 25, 15, 30, tzinfo=timezone.utc),
            block_type="shallow_work",
            is_available=True,
        ),
        None,
    ))
    mcp.ping = AsyncMock(return_value=False)
    return mcp


# ── Mock agents ───────────────────────────────────────────────────────────────

@pytest.fixture
def mock_interceptor(sample_intercepted):
    """Interceptor that returns a fixed InterceptedContext without calling Gemini."""
    interceptor = MagicMock()
    interceptor.name = "interceptor"
    interceptor.process = MagicMock(return_value=sample_intercepted)
    return interceptor


@pytest.fixture
def mock_contextualizer(sample_enriched):
    """Contextualizer that returns a fixed EnrichedContext without calling Gemini."""
    ctx = MagicMock()
    ctx.name = "contextualizer"
    ctx.process = AsyncMock(return_value=(sample_enriched, []))
    ctx.review_draft = AsyncMock(return_value=AgentReview(
        agent_name="contextualizer",
        approved=True,
        concerns=[],
    ))
    return ctx


@pytest.fixture
def mock_scheduler(sample_scheduled):
    """Scheduler that returns a fixed ScheduledContext without calling MCP."""
    sch = MagicMock()
    sch.name = "scheduler"
    sch.process = AsyncMock(return_value=(sample_scheduled, []))
    sch.review_draft = AsyncMock(return_value=AgentReview(
        agent_name="scheduler",
        approved=True,
        concerns=[],
    ))
    return sch


@pytest.fixture
def mock_translator(sample_translated_task):
    """Translator that returns a fixed TranslatedTask without calling Gemini."""
    trans = MagicMock()
    trans.name = "translator"
    trans.process = MagicMock(return_value=sample_translated_task)
    trans.revise = MagicMock(return_value=sample_translated_task)
    return trans


# ── FastAPI test client ───────────────────────────────────────────────────────

@pytest.fixture
def test_app(mock_memory, mock_mcp, mock_interceptor, mock_contextualizer,
             mock_scheduler, mock_translator):
    """FastAPI TestClient with all Gemini/interface calls mocked out."""
    from orchestrator.config.settings import get_settings
    from orchestrator.debate.engine import DebateEngine
    from orchestrator.main import create_app

    # Clear settings cache so test env vars take effect cleanly
    get_settings.cache_clear()

    app = create_app()

    # Provide a mock settings so DebateEngine doesn't try to load the real Settings
    mock_settings = MagicMock()
    mock_settings.google_api_key = "test-key"
    mock_settings.gemini_model = "gemini-2.0-flash"
    mock_settings.max_debate_rounds = 3
    mock_settings.debate_consensus_threshold = 2

    engine = DebateEngine(
        interceptor=mock_interceptor,
        contextualizer=mock_contextualizer,
        scheduler=mock_scheduler,
        translator=mock_translator,
        settings=mock_settings,
    )
    # Inject mocks directly into app state (lifespan does not run without context manager)
    app.state.engine = engine
    app.state.memory = mock_memory
    app.state.mcp = mock_mcp

    return TestClient(app, raise_server_exceptions=True)
