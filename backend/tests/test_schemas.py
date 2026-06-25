"""Tests for API schema validation and serialisation."""
from __future__ import annotations

from datetime import datetime, timezone

import pytest

from orchestrator.api.schemas import (
    ActionItem,
    BlockType,
    CalendarSlot,
    FeedbackRequest,
    MessageSource,
    ProcessRequest,
    ProcessResponse,
    TranslatedTask,
    UrgencyLevel,
)


class TestProcessRequest:
    def test_valid_slack_message(self):
        req = ProcessRequest(
            message_id="slack-001",
            source=MessageSource.SLACK,
            sender_name="Bob",
            content="Quick question whenever you get a chance",
            user_id="user_1",
        )
        assert req.source == MessageSource.SLACK
        assert req.sender_role is None
        assert req.thread_context == []

    def test_timestamp_defaults_to_now(self):
        req = ProcessRequest(
            message_id="x",
            source=MessageSource.EMAIL,
            sender_name="Bob",
            content="Hi",
            user_id="u1",
        )
        assert req.timestamp is not None
        assert req.timestamp.tzinfo is not None

    def test_extra_fields_ignored(self):
        """Role 1 may send extra fields — we must tolerate them (extra='ignore')."""
        req = ProcessRequest(
            message_id="x",
            source=MessageSource.SLACK,
            sender_name="Bob",
            content="Hi",
            user_id="u1",
            unknown_future_field="should be ignored",
        )
        assert not hasattr(req, "unknown_future_field")

    def test_invalid_source_raises(self):
        with pytest.raises(Exception):
            ProcessRequest(
                message_id="x",
                source="twitter",  # not in enum
                sender_name="Bob",
                content="Hi",
                user_id="u1",
            )


class TestFeedbackRequest:
    def test_valid_rating(self):
        fb = FeedbackRequest(
            request_id="3fa85f64-5717-4562-b3fc-2c963f66afa6",
            rating=4,
            user_id="user_1",
        )
        assert fb.rating == 4
        assert fb.notes is None

    def test_rating_bounds(self):
        with pytest.raises(Exception):
            FeedbackRequest(
                request_id="3fa85f64-5717-4562-b3fc-2c963f66afa6",
                rating=6,  # max is 5
                user_id="u1",
            )
        with pytest.raises(Exception):
            FeedbackRequest(
                request_id="3fa85f64-5717-4562-b3fc-2c963f66afa6",
                rating=0,  # min is 1
                user_id="u1",
            )


class TestTranslatedTask:
    def test_required_fields(self, sample_translated_task):
        assert sample_translated_task.title
        assert sample_translated_task.description
        assert sample_translated_task.urgency in UrgencyLevel

    def test_action_items_structure(self, sample_translated_task):
        for item in sample_translated_task.action_items:
            assert isinstance(item, ActionItem)
            assert isinstance(item.description, str)
            assert isinstance(item.is_time_sensitive, bool)


class TestProcessResponse:
    def test_serialises_to_dict(self, sample_translated_task, sample_calendar_slot):
        from orchestrator.api.schemas import AgentDebatePosition, DebateSummary

        response = ProcessResponse(
            original_message="Hey, no rush",
            translated_task=sample_translated_task,
            calendar_slot=sample_calendar_slot,
            debate_summary=DebateSummary(
                rounds_completed=1,
                consensus_reached=True,
                final_positions=[
                    AgentDebatePosition(agent_name="contextualizer", approved=True, summary="ok")
                ],
            ),
            confidence_score=0.9,
            processing_time_ms=1234,
        )
        data = response.model_dump()
        assert "request_id" in data
        assert "translated_task" in data
        assert data["confidence_score"] == 0.9

    def test_calendar_slot_optional(self, sample_translated_task):
        from orchestrator.api.schemas import DebateSummary

        response = ProcessResponse(
            original_message="x",
            translated_task=sample_translated_task,
            calendar_slot=None,
            debate_summary=DebateSummary(rounds_completed=0, consensus_reached=True),
            confidence_score=0.7,
            processing_time_ms=500,
        )
        assert response.calendar_slot is None
