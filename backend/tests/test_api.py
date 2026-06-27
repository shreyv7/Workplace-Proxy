"""Integration tests for FastAPI route handlers.

Uses TestClient with all Gemini and interface calls mocked via conftest.py fixtures.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from orchestrator.api.schemas import (
    BlockType,
    CalendarSlot,
    MessageSource,
    ProcessRequest,
    TranslatedTask,
    UrgencyLevel,
)


class TestProcessEndpoint:
    def test_valid_request_returns_200(self, test_app, sample_request):
        """POST /api/v1/process with valid payload should return 200."""
        response = test_app.post(
            "/api/v1/process",
            json={
                "message_id": sample_request.message_id,
                "source": sample_request.source.value,
                "sender_name": sample_request.sender_name,
                "sender_role": sample_request.sender_role,
                "content": sample_request.content,
                "thread_context": sample_request.thread_context,
                "user_id": sample_request.user_id,
            },
        )
        assert response.status_code == 200

    def test_response_contains_required_fields(self, test_app, sample_request):
        """Response should contain all ProcessResponse fields."""
        response = test_app.post(
            "/api/v1/process",
            json={
                "message_id": "test-001",
                "source": "slack",
                "sender_name": "Alice",
                "content": "No rush, but can you check the thing?",
                "user_id": "user_1",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "request_id" in data
        assert "original_message" in data
        assert "translated_task" in data
        assert "debate_summary" in data
        assert "confidence_score" in data
        assert "processing_time_ms" in data
        assert "warnings" in data

    def test_translated_task_structure(self, test_app, sample_request):
        """translated_task in response should have all required sub-fields."""
        response = test_app.post(
            "/api/v1/process",
            json={
                "message_id": "test-002",
                "source": "slack",
                "sender_name": "Bob",
                "content": "Can you take a look whenever?",
                "user_id": "user_2",
            },
        )
        data = response.json()
        task = data["translated_task"]
        assert "title" in task
        assert "description" in task
        assert "action_items" in task
        assert "urgency" in task
        assert task["urgency"] in ["low", "medium", "high", "critical"]

    def test_missing_required_field_returns_422(self, test_app):
        """Missing required field should return 422 Unprocessable Entity."""
        response = test_app.post(
            "/api/v1/process",
            json={
                "message_id": "x",
                # missing: source, sender_name, content, user_id
            },
        )
        assert response.status_code == 422

    def test_invalid_source_returns_422(self, test_app):
        """Invalid enum value for source should return 422."""
        response = test_app.post(
            "/api/v1/process",
            json={
                "message_id": "x",
                "source": "twitter",  # not a valid MessageSource
                "sender_name": "Bob",
                "content": "Hi",
                "user_id": "u1",
            },
        )
        assert response.status_code == 422

    def test_extra_fields_tolerated(self, test_app):
        """Extra fields from Role 1 should not cause a 422 (extra='ignore')."""
        response = test_app.post(
            "/api/v1/process",
            json={
                "message_id": "x",
                "source": "slack",
                "sender_name": "Bob",
                "content": "Hi",
                "user_id": "u1",
                "future_field_from_role1": "ignored",
            },
        )
        assert response.status_code == 200


class TestFeedbackEndpoint:
    def test_valid_feedback_returns_200(self, test_app):
        """POST /api/v1/feedback with valid payload should return 200."""
        response = test_app.post(
            "/api/v1/feedback",
            json={
                "request_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                "rating": 4,
                "user_id": "user_1",
                "notes": "Very helpful!",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_feedback_rating_below_1_returns_422(self, test_app):
        response = test_app.post(
            "/api/v1/feedback",
            json={
                "request_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                "rating": 0,
                "user_id": "u1",
            },
        )
        assert response.status_code == 422

    def test_feedback_rating_above_5_returns_422(self, test_app):
        response = test_app.post(
            "/api/v1/feedback",
            json={
                "request_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                "rating": 6,
                "user_id": "u1",
            },
        )
        assert response.status_code == 422


class TestHealthEndpoint:
    def test_health_returns_200(self, test_app):
        """GET /health should always return 200 with status field."""
        response = test_app.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "version" in data
        assert "dependencies" in data

    def test_health_lists_dependencies(self, test_app):
        """Health response should list all expected dependency keys."""
        response = test_app.get("/api/v1/health")
        deps = response.json()["dependencies"]
        assert "gemini" in deps
        assert "memory_service" in deps
        assert "calendar_mcp" in deps
        assert "google_adk" in deps
        assert "lyzr" in deps


class TestDebugRuntimeEndpoint:
    def test_runtime_snapshot_returns_200(self, test_app):
        response = test_app.get("/api/v1/debug/runtime")
        assert response.status_code == 200

    def test_runtime_snapshot_contains_expected_fields(self, test_app):
        response = test_app.get("/api/v1/debug/runtime")
        data = response.json()

        assert data["backend_mode"] == "MockBackend"
        assert "lyzr_enabled" in data
        assert "lyzr_per_agent" in data
        assert "adk_interceptor_enabled" in data
        assert "mcp_transport" in data
        assert "consensus_threshold" in data
        assert "max_debate_rounds" in data
        assert "agents" in data
        assert "last_transcript_available" in data

    def test_runtime_snapshot_lists_four_agents(self, test_app):
        response = test_app.get("/api/v1/debug/runtime")
        agents = response.json()["agents"]

        assert len(agents) == 4
        agent_ids = {agent["id"] for agent in agents}
        assert agent_ids == {
            "interceptor",
            "contextualizer",
            "scheduler",
            "translator",
        }
