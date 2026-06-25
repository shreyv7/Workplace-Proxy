"""FastAPI route handlers for Role 2.

Route handlers are intentionally thin — they delegate all logic to the DebateEngine
and MemoryInterface. No business logic lives in this file.
"""
from __future__ import annotations

import time

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse

from orchestrator.api.schemas import (
    FeedbackRequest,
    FeedbackResponse,
    HealthResponse,
    ProcessRequest,
    ProcessResponse,
)
from orchestrator.config.settings import Settings, get_settings
from orchestrator.utils.logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter()


# ── Dependency helpers ────────────────────────────────────────────────────────

def _get_engine(request: Request):
    """Retrieve the DebateEngine from app state (set during lifespan startup)."""
    engine = getattr(request.app.state, "engine", None)
    if engine is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Orchestration engine not initialised. Check server startup logs.",
        )
    return engine


def _get_memory(request: Request):
    """Retrieve the MemoryInterface from app state."""
    memory = getattr(request.app.state, "memory", None)
    if memory is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Memory interface not initialised.",
        )
    return memory


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post(
    "/process",
    response_model=ProcessResponse,
    summary="Process a workplace message through the multi-agent pipeline",
    description=(
        "Accepts a raw Slack/Email message from Role 1, runs it through the "
        "Interceptor → Contextualizer → Scheduler → Translator pipeline with "
        "an A2A debate, and returns the translated task and calendar slot."
    ),
)
async def process_message(
    payload: ProcessRequest,
    engine=Depends(_get_engine),
) -> ProcessResponse:
    """Primary endpoint — Role 1 sends raw messages here."""
    logger.info(
        "process_request_received",
        message_id=payload.message_id,
        source=payload.source,
        user_id=payload.user_id,
    )

    try:
        response = await engine.run(payload)
    except Exception as exc:
        logger.error("process_request_failed", error=str(exc), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pipeline failed: {type(exc).__name__}: {exc}",
        )

    logger.info(
        "process_request_complete",
        request_id=str(response.request_id),
        processing_time_ms=response.processing_time_ms,
        confidence=response.confidence_score,
        warnings=len(response.warnings),
    )
    return response


@router.post(
    "/feedback",
    response_model=FeedbackResponse,
    summary="Submit user feedback on a translation",
    description=(
        "Accepts a 1–5 rating from the user's feedback slider. "
        "Forwards it to Role 3's memory service for storage in Qdrant, "
        "which improves future translations for this user."
    ),
)
async def submit_feedback(
    payload: FeedbackRequest,
    memory=Depends(_get_memory),
) -> FeedbackResponse:
    """Feedback endpoint — Role 1 sends user slider ratings here."""
    logger.info(
        "feedback_received",
        request_id=str(payload.request_id),
        user_id=payload.user_id,
        rating=payload.rating,
    )

    success = await memory.store_feedback(
        request_id=str(payload.request_id),
        user_id=payload.user_id,
        rating=payload.rating,
        original_message="",
        translated_output="",
        notes=payload.notes,
    )

    if success:
        return FeedbackResponse(success=True, message="Feedback stored successfully.")
    return FeedbackResponse(
        success=False,
        message="Feedback received but could not be stored (memory service unavailable).",
    )


@router.get(
    "/debug/transcript",
    summary="Retrieve the most recent debate transcript",
    description=(
        "Returns the full DebateTranscript for the last processed request — "
        "every AgentMessage, consensus decision, and confidence data point. "
        "For debugging and hackathon demo only. Not part of the production API contract."
    ),
)
async def get_debug_transcript(request: Request) -> JSONResponse:
    """Debug endpoint — returns the last debate transcript from the DebateEngine."""
    engine = getattr(request.app.state, "engine", None)
    if engine is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Engine not initialised.",
        )
    transcript = getattr(engine, "last_transcript", None)
    if transcript is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No transcript available — send a /process request first.",
        )
    return JSONResponse(content=transcript.to_debug_dict())


@router.get(
    "/debug/metrics",
    summary="Internal metrics snapshot",
    description=(
        "Returns operational counters collected since server startup: "
        "messages processed, average latency, consensus rate, fallback rate, etc. "
        "For debugging and hackathon demo only. Not part of the public API contract."
    ),
)
async def get_metrics(request: Request) -> JSONResponse:
    """Debug endpoint — returns the in-process metrics store snapshot."""
    from orchestrator.metrics.store import get_metrics as _get_metrics
    return JSONResponse(content=_get_metrics().to_dict())


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description="Used by Role 1 to verify the Role 2 server is running before sending messages.",
)
async def health_check(
    request: Request,
    settings: Settings = Depends(get_settings),
) -> HealthResponse:
    """Health check — Role 1 can poll this before the demo."""
    dependencies: dict[str, str] = {}

    # Check memory service (Role 3)
    memory = getattr(request.app.state, "memory", None)
    if memory:
        try:
            import httpx
            async with httpx.AsyncClient(timeout=2.0) as client:
                r = await client.get(f"{settings.memory_service_url}/health")
                dependencies["memory_service"] = "ok" if r.status_code < 500 else "degraded"
        except Exception:
            dependencies["memory_service"] = "unavailable"
    else:
        dependencies["memory_service"] = "not_initialised"

    # Check calendar MCP (Role 1)
    mcp = getattr(request.app.state, "mcp", None)
    if mcp:
        reachable = await mcp.ping()
        dependencies["calendar_mcp"] = "ok" if reachable else "unavailable"
    else:
        dependencies["calendar_mcp"] = "not_initialised"

    # Check Gemini (basic key presence check — not a live API call)
    dependencies["gemini"] = "configured" if settings.google_api_key else "missing_api_key"

    # Check ADK/Lyzr availability
    from orchestrator.integrations.adk_integration import ADK_AVAILABLE
    from orchestrator.integrations.lyzr_integration import LYZR_AVAILABLE
    dependencies["google_adk"] = "available" if ADK_AVAILABLE else "not_installed"
    dependencies["lyzr"] = "available" if LYZR_AVAILABLE else "not_installed"

    overall = "ok" if dependencies.get("gemini") == "configured" else "degraded"

    return HealthResponse(
        status=overall,
        version=settings.app_version,
        dependencies=dependencies,
    )
