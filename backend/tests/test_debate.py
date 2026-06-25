"""Tests for the A2A DebateEngine orchestration logic."""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest
import pytest_asyncio

from orchestrator.agents.base import AgentReview
from orchestrator.api.schemas import ProcessResponse
from orchestrator.debate.engine import DebateEngine


class TestDebateEngineHappyPath:
    @pytest.fixture
    def engine(
        self,
        mock_interceptor,
        mock_contextualizer,
        mock_scheduler,
        mock_translator,
    ):
        return DebateEngine(
            interceptor=mock_interceptor,
            contextualizer=mock_contextualizer,
            scheduler=mock_scheduler,
            translator=mock_translator,
        )

    @pytest.mark.asyncio
    async def test_run_returns_process_response(self, engine, sample_request):
        """Happy path: all agents succeed, first debate round reaches consensus."""
        response = await engine.run(sample_request)
        assert isinstance(response, ProcessResponse)
        assert response.original_message == sample_request.content
        assert response.translated_task is not None
        assert response.processing_time_ms >= 0

    @pytest.mark.asyncio
    async def test_consensus_on_first_round(self, engine, sample_request):
        """If both reviewers approve immediately, debate should complete in 1 round."""
        response = await engine.run(sample_request)
        assert response.debate_summary.consensus_reached is True
        assert response.debate_summary.rounds_completed == 1

    @pytest.mark.asyncio
    async def test_warnings_propagated(
        self,
        mock_interceptor,
        mock_contextualizer,
        mock_scheduler,
        mock_translator,
        sample_request,
    ):
        """Warnings from interfaces should appear in the response."""
        mock_contextualizer.process = AsyncMock(return_value=(
            mock_contextualizer.process.return_value[0],
            ["Memory service unavailable — using defaults"],
        ))
        engine = DebateEngine(
            interceptor=mock_interceptor,
            contextualizer=mock_contextualizer,
            scheduler=mock_scheduler,
            translator=mock_translator,
        )
        response = await engine.run(sample_request)
        assert any("Memory service" in w for w in response.warnings)

    @pytest.mark.asyncio
    async def test_confidence_decremented_by_warnings(
        self,
        mock_interceptor,
        mock_contextualizer,
        mock_scheduler,
        mock_translator,
        sample_request,
    ):
        """Multiple warnings should reduce confidence score."""
        mock_contextualizer.process = AsyncMock(return_value=(
            mock_contextualizer.process.return_value[0],
            ["Warning 1", "Warning 2"],
        ))
        engine = DebateEngine(
            interceptor=mock_interceptor,
            contextualizer=mock_contextualizer,
            scheduler=mock_scheduler,
            translator=mock_translator,
        )
        response = await engine.run(sample_request)
        assert response.confidence_score < 1.0


class TestDebateLoop:
    @pytest.mark.asyncio
    async def test_revise_called_when_no_consensus(
        self,
        mock_interceptor,
        mock_contextualizer,
        mock_scheduler,
        mock_translator,
        sample_request,
        sample_enriched,
        sample_scheduled,
        sample_translated_task,
    ):
        """When reviewers raise concerns, Translator.revise() should be called."""
        # First review round: both agents reject
        # Second review round: both agents approve
        approve_review_ctx = AgentReview(agent_name="contextualizer", approved=True)
        approve_review_sch = AgentReview(agent_name="scheduler", approved=True)
        reject_review_ctx = AgentReview(
            agent_name="contextualizer",
            approved=False,
            concerns=["Urgency not clear"],
        )
        reject_review_sch = AgentReview(
            agent_name="scheduler",
            approved=False,
            concerns=["Deadline missing"],
        )

        # Round 1: reject; Round 2: approve
        mock_contextualizer.review_draft = AsyncMock(
            side_effect=[reject_review_ctx, approve_review_ctx]
        )
        mock_scheduler.review_draft = AsyncMock(
            side_effect=[reject_review_sch, approve_review_sch]
        )
        mock_contextualizer.process = AsyncMock(return_value=(sample_enriched, []))
        mock_scheduler.process = AsyncMock(return_value=(sample_scheduled, []))

        engine = DebateEngine(
            interceptor=mock_interceptor,
            contextualizer=mock_contextualizer,
            scheduler=mock_scheduler,
            translator=mock_translator,
        )

        response = await engine.run(sample_request)
        mock_translator.revise.assert_called_once()
        assert response.debate_summary.rounds_completed == 2
        assert response.debate_summary.consensus_reached is True

    @pytest.mark.asyncio
    async def test_max_rounds_respected(
        self,
        mock_interceptor,
        mock_contextualizer,
        mock_scheduler,
        mock_translator,
        sample_request,
        sample_enriched,
        sample_scheduled,
    ):
        """Debate should stop at max_rounds even without consensus."""
        from orchestrator.config.settings import Settings

        settings = MagicMock(spec=Settings)
        settings.google_api_key = "fake"
        settings.gemini_model = "gemini-2.0-flash"
        settings.max_debate_rounds = 2
        settings.debate_consensus_threshold = 2

        # Reviewers always reject
        always_reject = AgentReview(agent_name="x", approved=False, concerns=["nope"])
        mock_contextualizer.review_draft = AsyncMock(return_value=always_reject)
        mock_scheduler.review_draft = AsyncMock(return_value=always_reject)
        mock_contextualizer.process = AsyncMock(return_value=(sample_enriched, []))
        mock_scheduler.process = AsyncMock(return_value=(sample_scheduled, []))

        engine = DebateEngine(
            interceptor=mock_interceptor,
            contextualizer=mock_contextualizer,
            scheduler=mock_scheduler,
            translator=mock_translator,
            settings=settings,
        )

        response = await engine.run(sample_request)
        # Should still return a response despite no consensus
        assert response is not None
        assert response.debate_summary.rounds_completed == 2
        assert response.debate_summary.consensus_reached is False


class TestDebateEngineErrorHandling:
    @pytest.mark.asyncio
    async def test_interceptor_error_returns_emergency_response(
        self,
        mock_interceptor,
        mock_contextualizer,
        mock_scheduler,
        mock_translator,
        sample_request,
    ):
        """If the Interceptor raises, the engine should return a graceful response."""
        mock_interceptor.process = MagicMock(side_effect=ValueError("LLM failed"))
        engine = DebateEngine(
            interceptor=mock_interceptor,
            contextualizer=mock_contextualizer,
            scheduler=mock_scheduler,
            translator=mock_translator,
        )
        response = await engine.run(sample_request)
        assert response is not None
        assert any("Pipeline error" in w for w in response.warnings)
