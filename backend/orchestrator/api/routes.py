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
    GCPTestRequest,
    GCPTestResponse,
    HealthResponse,
    MCPServiceResult,
    ProcessRequest,
    ProcessResponse,
    GenerateReplyRequest,
    GenerateReplyResponse,
    ReplyDraft,
    NormalizedEvent,
    PriorityTask,
    DailyClarityResponse,
    NotesSaveRequest,
    RescheduleRequest,
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

    # Update telemetry persistently in Supabase
    try:
        import requests
        from datetime import date
        SUPABASE_URL = "https://xpihsdeapqxqexcqjvmw.supabase.co"
        SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwaWhzZGVhcHF4cWV4Y3Fqdm13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDM4MjMsImV4cCI6MjA5Nzk3OTgyM30.Ixons1qO4sIh2Ah1ac6ph0pSdEnuSzKSn8XwMt9iUu4"
        today_str = date.today().isoformat()
        
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            "Content-Type": "application/json"
        }
        
        get_today_url = f"{SUPABASE_URL}/rest/v1/telemetry_history?date=eq.{today_str}"
        today_res = requests.get(get_today_url, headers=headers)
        
        if today_res.status_code == 200 and today_res.json():
            today_data = today_res.json()[0]
            updated_fields = {
                "hours_saved": float(today_data.get("hours_saved") or 0) + 0.75,
                "context_switches_prevented": int(today_data.get("context_switches_prevented") or 0) + 1,
                "clarity_score": min(100, int(today_data.get("clarity_score") or 95) + 1)
            }
            requests.patch(f"{SUPABASE_URL}/rest/v1/telemetry_history?date=eq.{today_str}", json=updated_fields, headers=headers)
        else:
            new_telemetry = {
                "date": today_str,
                "hours_saved": 0.75,
                "cognitive_friction": 18,
                "focus_hours_protected": 4.5,
                "clarity_score": 96,
                "context_switches_prevented": 1
            }
            requests.post(f"{SUPABASE_URL}/rest/v1/telemetry_history", json=new_telemetry, headers=headers)
    except Exception as tel_err:
        logger.warning("telemetry_update_failed", error=str(tel_err))

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


@router.post(
    "/test-gcp",
    response_model=GCPTestResponse,
    summary="End-to-end Google OAuth integration test",
    description=(
        "Accepts a Google OAuth access token (session.provider_token from Supabase), "
        "forwards it as Authorization: Bearer to both the Calendar MCP (port 3002) and "
        "Gmail MCP (port 3001), and returns a structured report. "
        "Use this to confirm that real Google APIs are being reached rather than demo/mock data. "
        "Does NOT touch the /process pipeline."
    ),
)
async def test_gcp_integration(
    payload: GCPTestRequest,
    request: Request,
) -> GCPTestResponse:
    """Diagnostic: verify Calendar + Gmail MCP connectivity with a live Google OAuth token."""
    from datetime import datetime, timezone

    mcp = getattr(request.app.state, "mcp", None)
    if mcp is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MCP interface not initialised — check server startup logs.",
        )

    token: str | None = payload.google_access_token.strip() or None
    user_id = payload.user_id

    logger.info("test_gcp_started", user_id=user_id, token_provided=bool(token))

    # ── Calendar MCP ──────────────────────────────────────────────────────────

    cal_reachable = False
    cal_error: str | None = None
    cal_blocks: list[dict] = []

    try:
        logger.info("test_gcp_calendar_call", token_forwarded=bool(token))
        blocks, warning = await mcp.get_todays_blocks(user_id=user_id, access_token=token)
        cal_reachable = True
        cal_blocks = [b.model_dump(mode="json") for b in blocks]
        if warning:
            cal_error = warning
            logger.warning("test_gcp_calendar_warning", warning=warning)
        logger.info("test_gcp_calendar_ok", count=len(cal_blocks))
    except Exception as exc:
        cal_error = f"{type(exc).__name__}: {exc}"
        logger.error("test_gcp_calendar_error", error=cal_error)

    # Demo-mode heuristic: real Calendar API only returns block_type="meeting".
    # Demo data also contains "deep_work" and "free" blocks.
    cal_demo = (not token) or any(
        b.get("block_type") in ("deep_work", "free") for b in cal_blocks
    )

    # ── Gmail MCP ─────────────────────────────────────────────────────────────

    gmail_reachable = False
    gmail_error: str | None = None
    gmail_threads: list[dict] = []

    try:
        logger.info("test_gcp_gmail_call", token_forwarded=bool(token))
        threads, warning = await mcp.get_gmail_threads(
            user_id=user_id, access_token=token, max_results=5
        )
        gmail_reachable = True
        gmail_threads = [t if isinstance(t, dict) else dict(t) for t in threads]
        if warning:
            gmail_error = warning
            logger.warning("test_gcp_gmail_warning", warning=warning)
        logger.info("test_gcp_gmail_ok", count=len(gmail_threads))
    except Exception as exc:
        gmail_error = f"{type(exc).__name__}: {exc}"
        logger.error("test_gcp_gmail_error", error=gmail_error)

    # Demo-mode heuristic: demo Gmail thread IDs start with "demo_thread_".
    gmail_demo = (not token) or any(
        str(t.get("thread_id", "")).startswith("demo_thread_") for t in gmail_threads
    )

    logger.info(
        "test_gcp_complete",
        calendar_reachable=cal_reachable,
        gmail_reachable=gmail_reachable,
        calendar_demo=cal_demo,
        gmail_demo=gmail_demo,
    )

    return GCPTestResponse(
        token_provided=bool(token),
        tested_at=datetime.now(tz=timezone.utc).isoformat(),
        calendar=MCPServiceResult(
            reachable=cal_reachable,
            token_forwarded=bool(token),
            demo_mode=cal_demo,
            data_count=len(cal_blocks),
            sample=cal_blocks[:3],
            error=cal_error,
        ),
        gmail=MCPServiceResult(
            reachable=gmail_reachable,
            token_forwarded=bool(token),
            demo_mode=gmail_demo,
            data_count=len(gmail_threads),
            sample=gmail_threads[:3],
            error=gmail_error,
        ),
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


@router.get(
    "/telemetry",
    summary="Get weekly or monthly telemetry history",
)
async def get_telemetry(range: str = "weekly"):
    try:
        import requests
        limit = 7 if range == "weekly" else 30
        
        SUPABASE_URL = "https://xpihsdeapqxqexcqjvmw.supabase.co"
        SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwaWhzZGVhcHF4cWV4Y3Fqdm13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDM4MjMsImV4cCI6MjA5Nzk3OTgyM30.Ixons1qO4sIh2Ah1ac6ph0pSdEnuSzKSn8XwMt9iUu4"
        
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
        }
        
        url = f"{SUPABASE_URL}/rest/v1/telemetry_history?order=date.desc&limit={limit}"
        res = requests.get(url, headers=headers)
        res.raise_for_status()
        data = res.json()
        
        # Reverse to return chronological order
        data.reverse()
        return JSONResponse(content={"status": "success", "data": data})
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Telemetry retrieval failed: {str(e)}"
        )


@router.get(
    "/daily-clarity",
    response_model=DailyClarityResponse,
    summary="Get unified Daily Clarity view",
)
async def get_daily_clarity(
    date: str,
    user_id: str,
    google_access_token: str | None = None,
    request: Request = None,
) -> DailyClarityResponse:
    import requests
    import sqlite3
    from datetime import datetime, timezone
    from uuid import uuid4
    
    SUPABASE_URL = "https://xpihsdeapqxqexcqjvmw.supabase.co"
    SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwaWhzZGVhcHF4cWV4Y3Fqdm13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDM4MjMsImV4cCI6MjA5Nzk3OTgyM30.Ixons1qO4sIh2Ah1ac6ph0pSdEnuSzKSn8XwMt9iUu4"

    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
    }

    # 1. Fetch daily_notes from SQLite local storage (binds to mounted host volume)
    notes_content = ""
    try:
        conn = sqlite3.connect("/app/daily_notes.db")
        cursor = conn.cursor()
        cursor.execute("CREATE TABLE IF NOT EXISTS daily_notes (user_id TEXT, date TEXT, content TEXT, PRIMARY KEY (user_id, date))")
        cursor.execute("SELECT content FROM daily_notes WHERE user_id = ? AND date = ?", (user_id, date))
        row = cursor.fetchone()
        conn.close()
        if row:
            notes_content = row[0]
    except Exception as e:
        logger.warning(f"Error fetching notes from SQLite: {e}")

    # 2. Fetch messages
    db_messages = []
    try:
        url_msgs = f"{SUPABASE_URL}/rest/v1/messages?user_id=eq.{user_id}"
        res = requests.get(url_msgs, headers=headers)
        if res.status_code == 200:
            db_messages = res.json()
    except Exception as e:
        logger.warning(f"Error fetching messages: {e}")

    # 3. Fetch calendar blocks
    db_calendar = []
    try:
        url_cal = f"{SUPABASE_URL}/rest/v1/calendar_blocks?user_id=eq.{user_id}"
        res = requests.get(url_cal, headers=headers)
        if res.status_code == 200:
            db_calendar = res.json()
    except Exception as e:
        logger.warning(f"Error fetching calendar blocks: {e}")

    # 4. Fetch live calendar blocks from MCP Interface
    mcp_blocks = []
    mcp = getattr(request.app.state, "mcp", None) if request else None
    if mcp:
        try:
            mcp_blocks, warning = await mcp.get_todays_blocks(user_id=user_id, access_token=google_access_token)
        except Exception as e:
            logger.warning(f"Error fetching live calendar from MCP: {e}")

    # 5. Combine blocks and normalize events
    normalized_blocks = []
    
    # Process DB calendar blocks
    for b in db_calendar:
        normalized_blocks.append(
            NormalizedEvent(
                id=b.get("id") or str(b.get("calendar_block_id", uuid4())),
                title=b.get("title") or "Focus Block",
                start=b.get("start"),
                end=b.get("end"),
                block_type=b.get("type") or "shallow_work",
                can_reschedule=b.get("can_reschedule", True),
                source="database",
                conflict_level="low",
                prep_required=False,
                is_all_day=False,
                importance_score=3,
            )
        )

    # Process MCP calendar blocks (if any) and avoid duplication
    for mb in mcp_blocks:
        is_dup = False
        start_iso = mb.start.isoformat()
        end_iso = mb.end.isoformat()
        for nb in normalized_blocks:
            if nb.start == start_iso and nb.title == mb.title:
                is_dup = True
                break
        if not is_dup:
            normalized_blocks.append(
                NormalizedEvent(
                    id=f"mcp_{mb.title}_{start_iso}",
                    title=mb.title or "Calendar Event",
                    start=start_iso,
                    end=end_iso,
                    block_type=mb.block_type or "meeting",
                    can_reschedule=True,
                    source="google",
                    conflict_level="low",
                    prep_required=mb.block_type == "meeting",
                    is_all_day=False,
                    importance_score=3,
                )
            )

    # Fallback to rich demonstration layout if no blocks exist
    if not normalized_blocks:
        normalized_blocks = [
            NormalizedEvent(
                id="mock_focus_1",
                title="Morning Focus Block",
                start=f"{date}T09:00:00Z",
                end=f"{date}T11:30:00Z",
                block_type="deep_work",
                can_reschedule=True,
                source="fallback",
                conflict_level="low"
            ),
            NormalizedEvent(
                id="mock_meeting_1",
                title="Sprint Alignment Sync",
                start=f"{date}T13:30:00Z",
                end=f"{date}T14:15:00Z",
                block_type="meeting",
                can_reschedule=False,
                source="fallback",
                conflict_level="medium",
                prep_required=True,
                prep_notes="Review Figma onboarding mockups and design issues."
            ),
            NormalizedEvent(
                id="mock_focus_2",
                title="Afternoon Focus Block",
                start=f"{date}T14:30:00Z",
                end=f"{date}T16:30:00Z",
                block_type="deep_work",
                can_reschedule=True,
                source="fallback",
                conflict_level="low"
            ),
        ]

    # Calculate statistics
    meetings_count = sum(1 for b in normalized_blocks if b.block_type == "meeting")
    focus_count = sum(1 for b in normalized_blocks if b.block_type in ("deep_work", "focus"))
    conflict_count = sum(1 for b in normalized_blocks if b.conflict_level in ("medium", "high"))
    
    # Sort blocks chronologically
    normalized_blocks.sort(key=lambda x: x.start)

    # Next up meeting calculation
    next_meeting = None
    now_iso = datetime.now(tz=timezone.utc).isoformat()
    for b in normalized_blocks:
        if b.block_type == "meeting" and b.start >= now_iso:
            next_meeting = b
            break
    if not next_meeting:
        meetings = [b for b in normalized_blocks if b.block_type == "meeting"]
        if meetings:
            next_meeting = meetings[0]

    next_up_str = next_meeting.start.split("T")[-1][:5] if next_meeting else "No more meetings"

    # Meeting insights mapping
    insights = {}
    for b in normalized_blocks:
        if b.block_type == "meeting":
            if "Sprint" in b.title or "Standup" in b.title or "onboarding" in b.title.lower():
                insights[b.id] = "Weekly onboarding flow sync. Make sure to open v3 onboarding Figma files beforehand and check the saturation issues raised by design team."
            elif "Roadmap" in b.title or "Client" in b.title:
                insights[b.id] = "Review Northwind Roadmap presentation files and accept invitations protecting your focus slot."
            else:
                insights[b.id] = f"No prep required for this event. Safe to shorten or delegate if needed."

    # Parse priorities from unacknowledged database messages
    priorities = []
    active_priorities = [m for m in db_messages if not m.get("acknowledged", False)]
    
    def urgency_weight(m):
        urg = m.get("importance", "low").lower()
        if urg == "critical": return 4
        if urg == "high": return 3
        if urg == "medium": return 2
        return 1

    active_priorities.sort(key=urgency_weight, reverse=True)
    
    for idx, m in enumerate(active_priorities[:3]):
        importance = m.get("importance", "medium")
        status_val = "Do now" if importance == "high" else ("Before meeting" if importance == "medium" else "Can wait")
        priorities.append(
            PriorityTask(
                id=m.get("message_id"),
                title=m.get("action") or m.get("original_text", "")[:35] + "...",
                importance=importance,
                expected_duration=m.get("expected_duration") or "30 mins",
                recommended_time=m.get("suggested_start_time") or "14:00",
                why_important=m.get("reasoning") or "Identified by swarm consensus.",
                status=status_val
            )
        )

    # Fallback priorities if db has none
    if not priorities:
        priorities = [
            PriorityTask(
                id="task_fb_1",
                title="Verify staging server config",
                importance="high",
                expected_duration="45 mins",
                recommended_time="14:00",
                why_important="Tom requested staging branch verification for release window.",
                status="Do now"
            ),
            PriorityTask(
                id="task_fb_2",
                title="Accept roadmap alignment sync",
                importance="medium",
                expected_duration="30 mins",
                recommended_time="15:00",
                why_important="Protect your peak morning focus blocks.",
                status="Before meeting"
            )
        ]

    # Generate summary headlines
    summary_sentence = f"You have {meetings_count} meetings today, {focus_count} protected focus blocks, and {conflict_count} schedule conflicts."
    if conflict_count > 0:
        summary_sentence += " Re-allocate focus windows to clear conflicts before afternoon syncs."
    else:
        summary_sentence += " Morning focus peaks are protected."

    return DailyClarityResponse(
        date=date,
        timezone="UTC",
        headline="Planner-first cognitive reset",
        summary=summary_sentence,
        stats={
            "meetings": meetings_count,
            "focusBlocks": focus_count,
            "conflicts": conflict_count,
            "nextUp": next_up_str
        },
        schedule_blocks=normalized_blocks,
        top_priorities=priorities,
        next_meeting=next_meeting,
        meeting_insights=insights,
        warnings=["Overlap detected in afternoon syncs" if conflict_count > 0 else "Schedule optimal"],
        notes=notes_content
    )


@router.post(
    "/daily-clarity/notes",
    summary="Save Daily Clarity notes",
)
async def save_daily_notes(payload: NotesSaveRequest) -> JSONResponse:
    import sqlite3
    
    try:
        conn = sqlite3.connect("/app/daily_notes.db")
        cursor = conn.cursor()
        cursor.execute("CREATE TABLE IF NOT EXISTS daily_notes (user_id TEXT, date TEXT, content TEXT, PRIMARY KEY (user_id, date))")
        cursor.execute("""
            INSERT INTO daily_notes (user_id, date, content)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id, date) DO UPDATE SET content = excluded.content
        """, (payload.user_id, payload.date, payload.content))
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Error saving notes to SQLite: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Notes persistence failed: {str(e)}"
        )

    return JSONResponse(content={"status": "success", "message": "Notes saved successfully"})


@router.post(
    "/daily-clarity/reschedule",
    summary="Accept a reschedule block",
)
async def reschedule_block(payload: RescheduleRequest) -> JSONResponse:
    import requests
    
    SUPABASE_URL = "https://xpihsdeapqxqexcqjvmw.supabase.co"
    SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwaWhzZGVhcHF4cWV4Y3Fqdm13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDM4MjMsImV4cCI6MjA5Nzk3OTgyM30.Ixons1qO4sIh2Ah1ac6ph0pSdEnuSzKSn8XwMt9iUu4"

    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json"
    }

    update_url = f"{SUPABASE_URL}/rest/v1/calendar_blocks?id=eq.{payload.block_id}"
    update_data = {
        "start": payload.new_start,
        "end": payload.new_end,
        "acknowledged": True
    }
    requests.patch(update_url, json=update_data, headers=headers)

    return JSONResponse(content={"status": "success", "message": "Rescheduled successfully"})

