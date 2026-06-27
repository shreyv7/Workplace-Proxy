"""FastAPI route handlers for Role 2.

Route handlers are intentionally thin — they delegate all logic to the DebateEngine
and MemoryInterface. No business logic lives in this file.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse

from orchestrator.agents.base import AgentIdentity
from orchestrator.api.schemas import (
    FeedbackRequest,
    FeedbackResponse,
    HealthResponse,
    ProcessRequest,
    ProcessResponse,
    GenerateReplyRequest,
    GenerateReplyResponse,
    ReplyDraft,
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


def _build_runtime_snapshot(request: Request) -> dict[str, object]:
    """Summarise the active swarm runtime for internal diagnostics screens."""
    engine = _get_engine(request)
    settings = engine._settings
    adk_interceptor_enabled = bool(
        getattr(request.app.state, "adk_interceptor_enabled", False)
    )
    backend_mode = getattr(
        request.app.state,
        "runtime_backend_label",
        type(engine._translator._backend).__name__,
    )

    agent_definitions = [
        ("interceptor", "Interceptor Agent", engine._interceptor),
        ("contextualizer", "Context Agent", engine._contextualizer),
        ("scheduler", "Scheduler Agent", engine._scheduler),
        ("translator", "Translator Agent", engine._translator),
    ]

    agents: list[dict[str, object]] = []
    for agent_key, display_name, agent in agent_definitions:
        identity = agent.get_identity()
        if not isinstance(identity, AgentIdentity):
            identity = None
        llm_backend = type(agent._backend).__name__

        primary_runtime = llm_backend
        if agent_key == "interceptor" and adk_interceptor_enabled:
            primary_runtime = "Google ADK Interceptor"

        dependency = "Gemini / Lyzr runtime"
        if agent_key == "contextualizer":
            dependency = "Role 3 memory service (Qdrant context)"
        elif agent_key == "scheduler":
            dependency = "Role 1 Calendar MCP"

        fallback_chain: list[str] = []
        if agent_key == "interceptor" and adk_interceptor_enabled:
            fallback_chain.append(llm_backend)
        if agent_key == "contextualizer":
            fallback_chain.append("Default memory context when Role 3 is unavailable")
        if agent_key == "scheduler":
            fallback_chain.append("Deterministic calendar slot when MCP is unavailable")
        if agent_key == "translator":
            fallback_chain.append("Emergency translation if the debate pipeline errors")

        agents.append(
            {
                "id": agent_key,
                "display_name": display_name,
                "name": identity.name if identity else agent.name,
                "role": identity.role if identity else agent.name,
                "primary_runtime": primary_runtime,
                "llm_backend": llm_backend,
                "dependency": dependency,
                "fallback_chain": fallback_chain,
                "confidence_baseline": (
                    identity.confidence_baseline if identity else None
                ),
                "expertise": identity.expertise if identity else [],
                "limitations": identity.limitations if identity else [],
            }
        )

    return {
        "backend_mode": backend_mode,
        "lyzr_enabled": bool(getattr(settings, "lyzr_enabled", False)),
        "lyzr_per_agent": bool(getattr(settings, "lyzr_per_agent", False)),
        "adk_interceptor_enabled": adk_interceptor_enabled,
        "mcp_transport": getattr(settings, "mcp_transport", "http"),
        "consensus_threshold": getattr(settings, "debate_consensus_threshold", 2),
        "max_debate_rounds": getattr(settings, "max_debate_rounds", 3),
        "agents": agents,
        "last_transcript_available": engine.last_transcript is not None,
    }


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


@router.post(
    "/generate-reply",
    response_model=GenerateReplyResponse,
    summary="Generate reply draft options for a message",
)
async def generate_reply(
    payload: GenerateReplyRequest,
    request: Request,
) -> GenerateReplyResponse:
    """Generate 3 reply options based on tone (casual, professional, concise)."""
    engine = _get_engine(request)
    backend = engine._translator._backend
    
    prompt = f"""
    You are an AI assistant helping a neurodivergent professional draft replies to workplace messages.
    Generate exactly three reply drafts for the following inbound message:
    
    Sender Name: {payload.sender_name}
    Message Content: {payload.original_content}
    Tone Preference requested by user: {payload.tone.value}
    
    Additional Context from user (if any): {payload.additional_context or "None"}
    
    Provide three distinct drafts:
    1. A CASUAL draft (friendly, open, collaborative).
    2. A PROFESSIONAL draft (structured, polite, corporate-appropriate).
    3. A CONCISE draft (short, direct, to the point, minimal fluff).
    
    Format the output as a JSON object matching this schema:
    {{
        "drafts": [
            {{
                "text": "The Casual draft text",
                "tone": "casual",
                "word_count": 12
            }},
            {{
                "text": "The Professional draft text",
                "tone": "professional",
                "word_count": 15
            }},
            {{
                "text": "The Concise draft text",
                "tone": "concise",
                "word_count": 8
            }}
        ]
    }}
    """
    
    try:
        system_prompt = "You are a professional communication draft generator. You must output valid JSON matching the requested schema."
        result = backend.call_json(prompt=prompt, system_prompt=system_prompt, temperature=0.5)
        
        drafts = []
        if isinstance(result, dict) and "drafts" in result:
            for item in result["drafts"]:
                drafts.append(ReplyDraft(
                    text=item.get("text", ""),
                    tone=item.get("tone", "professional"),
                    word_count=item.get("word_count", len(item.get("text", "").split()))
                ))
        
        if not drafts:
            raise ValueError("Empty or malformed drafts returned by LLM")
            
        return GenerateReplyResponse(success=True, drafts=drafts)
        
    except Exception as exc:
        logger.error("generate_reply_failed", error=str(exc), exc_info=True)
        # Fallback to template-based drafts if API fails or offline
        fallback_drafts = [
            ReplyDraft(
                text=f"Hey {payload.sender_name}, got your message about '{payload.original_content[:30]}...'. Let me check my calendar and get back to you shortly!",
                tone="casual",
                word_count=21
            ),
            ReplyDraft(
                text=f"Dear {payload.sender_name},\n\nThank you for reaching out. I have received your message regarding '{payload.original_content[:30]}...' and am currently reviewing it. I will provide a detailed update shortly.\n\nBest regards,",
                tone="professional",
                word_count=32
            ),
            ReplyDraft(
                text=f"Got it. Let me look into this and reply soon.",
                tone="concise",
                word_count=10
            )
        ]
        return GenerateReplyResponse(success=True, drafts=fallback_drafts)


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
    "/debug/runtime",
    summary="Internal runtime snapshot",
    description=(
        "Returns the currently active agent roster, backend mode, ADK/Lyzr posture, "
        "and fallback paths. For internal diagnostics and demo UI only."
    ),
)
async def get_runtime_snapshot(request: Request) -> JSONResponse:
    """Debug endpoint — returns the current swarm runtime configuration."""
    return JSONResponse(content=_build_runtime_snapshot(request))


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


@router.post(
    "/debug/settings",
    summary="Update internal debate settings dynamically",
)
async def update_settings(
    payload: dict,
    request: Request,
) -> JSONResponse:
    """Debug endpoint — updates the current debate threshold and max rounds."""
    engine = _get_engine(request)
    settings = engine._settings
    
    if "debate_consensus_threshold" in payload:
        val = int(payload["debate_consensus_threshold"])
        settings.debate_consensus_threshold = val
        engine._consensus_threshold = val
        if hasattr(engine, "_consensus_engine") and engine._consensus_engine:
            engine._consensus_engine._threshold = val
        
    if "max_debate_rounds" in payload:
        val = int(payload["max_debate_rounds"])
        settings.max_debate_rounds = val
        engine._max_rounds = val
        if hasattr(engine, "_consensus_engine") and engine._consensus_engine:
            engine._consensus_engine._max_rounds = val

    logger.info(
        "debate_settings_updated",
        debate_consensus_threshold=settings.debate_consensus_threshold,
        max_debate_rounds=settings.max_debate_rounds,
    )

    return JSONResponse(
        content={
            "status": "success",
            "debate_consensus_threshold": settings.debate_consensus_threshold,
            "max_debate_rounds": settings.max_debate_rounds,
        }
    )


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
