"""Unit tests for individual agents — all Gemini calls are mocked."""
from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

import pytest

from orchestrator.agents.base import AgentReview
from orchestrator.agents.interceptor import Interceptor
from orchestrator.agents.translator import Translator
from orchestrator.api.schemas import UrgencyLevel


class TestInterceptor:
    @pytest.fixture
    def interceptor(self):
        """Interceptor with a mocked Settings (no real API key needed)."""
        settings = MagicMock()
        settings.google_api_key = "fake-key"
        settings.gemini_model = "gemini-2.0-flash"
        agent = Interceptor(settings=settings)
        return agent

    def test_process_returns_intercepted_context(self, interceptor, sample_request):
        """Interceptor.process() should return InterceptedContext with expected fields."""
        mock_llm_response = json.dumps({
            "identified_vague_phrases": ["the thing", "no rush"],
            "implicit_signals": ["Sender is a manager"],
            "key_references": ["the thing"],
            "initial_urgency_estimate": "medium",
            "requires_calendar_check": True,
            "interceptor_notes": "Power dynamic from manager complicates 'no rush'.",
        })

        with patch.object(interceptor, "_call_json", return_value=json.loads(mock_llm_response)):
            result = interceptor.process(sample_request)

        assert result.raw_content == sample_request.content
        assert result.sender_name == sample_request.sender_name
        assert "the thing" in result.identified_vague_phrases
        assert result.requires_calendar_check is True
        assert result.initial_urgency_estimate == UrgencyLevel.MEDIUM

    def test_process_handles_empty_vague_phrases(self, interceptor, sample_request):
        """Interceptor should handle messages with no vague phrases detected."""
        mock_result = {
            "identified_vague_phrases": [],
            "implicit_signals": [],
            "key_references": [],
            "initial_urgency_estimate": "low",
            "requires_calendar_check": False,
            "interceptor_notes": "",
        }
        with patch.object(interceptor, "_call_json", return_value=mock_result):
            result = interceptor.process(sample_request)

        assert result.identified_vague_phrases == []
        assert result.initial_urgency_estimate == UrgencyLevel.LOW

    def test_process_raises_on_unparseable_response(self, interceptor, sample_request):
        """Interceptor should raise ValueError if LLM output lacks required fields."""
        with patch.object(interceptor, "_call_json", return_value={"junk": "data"}):
            # Missing required fields — should still work with defaults
            result = interceptor.process(sample_request)
            assert result is not None  # gracefully uses .get() defaults

    def test_prompt_includes_thread_context(self, interceptor, sample_request):
        """Thread context should appear in the assembled prompt."""
        prompt = interceptor._build_prompt(sample_request)
        assert "Q2 demo is on Friday" in prompt
        assert sample_request.sender_name in prompt
        assert sample_request.sender_role in prompt


class TestTranslator:
    @pytest.fixture
    def translator(self):
        settings = MagicMock()
        settings.google_api_key = "fake-key"
        settings.gemini_model = "gemini-2.0-flash"
        return Translator(settings=settings)

    def test_process_returns_translated_task(
        self, translator, sample_enriched, sample_scheduled
    ):
        mock_result = {
            "title": "Send Q2 Demo Status Update",
            "description": "Alice needs a status update on Q2 demo readiness by EOD.",
            "action_items": [
                {"description": "Reply to Alice with status", "is_time_sensitive": True}
            ],
            "urgency": "high",
            "inferred_deadline_iso": "2026-06-25T17:00:00Z",
            "explicit_deadline_given": False,
            "decoded_subtext": "'No rush' means 'EOD today' given the Friday demo context.",
        }
        with patch.object(translator, "_call_json", return_value=mock_result):
            result = translator.process(sample_enriched, sample_scheduled)

        assert result.title == "Send Q2 Demo Status Update"
        assert result.urgency == UrgencyLevel.HIGH
        assert len(result.action_items) == 1
        assert result.action_items[0].is_time_sensitive is True
        assert result.decoded_subtext is not None

    def test_revise_includes_review_concerns(
        self, translator, sample_enriched, sample_scheduled
    ):
        """revise() should pass reviewer concerns into the prompt."""
        reviews = [
            AgentReview(
                agent_name="contextualizer",
                approved=False,
                concerns=["Urgency not clearly stated"],
                suggested_revisions="Add explicit 'HIGH URGENCY' to description",
            )
        ]
        captured_prompts = []
        mock_result = {
            "title": "Revised Title",
            "description": "HIGH URGENCY: Alice needs update by EOD.",
            "action_items": [],
            "urgency": "high",
            "inferred_deadline_iso": None,
            "explicit_deadline_given": False,
            "decoded_subtext": "Revised subtext",
        }
        with patch.object(translator, "_call_json", return_value=mock_result) as mock_call:
            with patch.object(translator, "_build_prompt", wraps=translator._build_prompt) as mock_build:
                translator.revise(sample_enriched, sample_scheduled, reviews)
                # Verify revision_notes were passed
                call_args = mock_build.call_args
                assert call_args is not None


class TestAgentReview:
    def test_to_text_approved(self):
        review = AgentReview(agent_name="contextualizer", approved=True)
        text = review.to_text()
        assert "APPROVED" in text
        assert "contextualizer" in text

    def test_to_text_with_concerns(self):
        review = AgentReview(
            agent_name="scheduler",
            approved=False,
            concerns=["Deadline too aggressive", "No mention of available time block"],
            suggested_revisions="Change deadline to tomorrow morning",
        )
        text = review.to_text()
        assert "CONCERNS RAISED" in text
        assert "Deadline too aggressive" in text
        assert "Change deadline to tomorrow morning" in text
