"""FastAPI application factory for Role 2 — Multi-Agent Orchestrator.

Entry point: uvicorn orchestrator.main:app --host 0.0.0.0 --port 8000

The app uses a lifespan context to initialise the DebateEngine, MemoryInterface,
and MCPInterface once at startup — not on every request.
"""
from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from orchestrator.api.routes import router
from orchestrator.config.settings import get_settings
from orchestrator.debate.engine import create_debate_engine
from orchestrator.interfaces.memory_interface import MemoryInterface
from orchestrator.interfaces.mcp_interface import MCPInterface
from orchestrator.utils.logging_config import configure_logging, get_logger

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Initialise shared resources at startup; clean up at shutdown."""
    settings = get_settings()
    configure_logging(settings.log_level)

    logger.info(
        "startup",
        version=settings.app_version,
        environment=settings.environment,
        gemini_model=settings.gemini_model,
        memory_service_url=settings.memory_service_url,
        calendar_mcp_url=settings.mcp_calendar_url,
        mcp_transport=settings.mcp_transport,
        demo_mode=settings.demo_mode,
    )

    if settings.demo_mode:
        logger.warning(
            "demo_mode_active",
            hint="Requests matching trigger phrases return deterministic pre-baked responses.",
        )

    # ── Build interfaces ──────────────────────────────────────────────────────

    memory = MemoryInterface(
        base_url=settings.memory_service_url,
        timeout=settings.memory_service_timeout,
    )

    # Phase 2: transport adapter selected from settings; Scheduler never changes
    from orchestrator.interfaces.mcp_transport import create_transport
    transport = create_transport(
        transport_type=settings.mcp_transport,
        base_url=settings.mcp_calendar_url,
        timeout=settings.mcp_timeout,
        stdio_command=settings.mcp_stdio_command,
    )
    mcp = MCPInterface(
        calendar_url=settings.mcp_calendar_url,
        timeout=settings.mcp_timeout,
        transport=transport,
        email_url=settings.mcp_email_url,
        slack_url=settings.mcp_slack_url,
    )
    logger.info("mcp_transport_selected", transport=settings.mcp_transport)

    # ── Google ADK — Interceptor agent ───────────────────────────────────────
    # The Interceptor (Agent 1) runs through a Google ADK LlmAgent on every
    # request. Agents 2-4 continue to use LyzrBackend (or GoogleBackend).
    # GOOGLE_API_KEY must be in os.environ for ADK's internal genai client.

    os.environ.setdefault("GOOGLE_API_KEY", settings.google_api_key)

    adk_interceptor_runner = None
    try:
        from orchestrator.integrations.adk_integration import (
            ADK_AVAILABLE,
            create_interceptor_agent,
            create_runner,
        )
        from orchestrator.agents.interceptor import _PERSONA as _INTERCEPTOR_PERSONA
        if ADK_AVAILABLE:
            _adk_agent = create_interceptor_agent(settings.gemini_model, _INTERCEPTOR_PERSONA)
            adk_interceptor_runner = create_runner(_adk_agent, "workplace_proxy")
            logger.info(
                "adk_interceptor_ready",
                model=settings.gemini_model,
                hint="Agent 1 (Interceptor) will run through Google ADK LlmAgent",
            )
    except Exception as exc:
        logger.warning(
            "adk_interceptor_setup_failed",
            error=str(exc),
            hint="Interceptor will fall back to LyzrBackend",
        )

    # ── Select LLM backend ────────────────────────────────────────────────────

    from orchestrator.llm.backend import GoogleBackend, create_backend

    if settings.lyzr_enabled and not settings.lyzr_api_key:
        logger.warning(
            "lyzr_enabled_but_no_api_key",
            hint="Set LYZR_API_KEY to your key from studio.lyzr.ai",
        )

    active_backend_label = "GoogleBackend"

    # Per-agent Lyzr option — each agent gets its own Lyzr cloud instance
    if settings.lyzr_per_agent and settings.lyzr_enabled and settings.lyzr_api_key:
        from orchestrator.integrations.lyzr_integration import (
            LYZR_AVAILABLE,
            create_per_agent_lyzr_backends,
        )
        if LYZR_AVAILABLE:
            try:
                agent_backends = await create_per_agent_lyzr_backends(
                    api_key=settings.lyzr_api_key,
                    model=settings.gemini_model,
                )
                active_backend_label = "LyzrBackend (per-agent)"
                logger.info(
                    "lyzr_per_agent_backends_selected",
                    agents=list(agent_backends.keys()),
                )
                engine = create_debate_engine(
                    memory=memory,
                    mcp=mcp,
                    settings=settings,
                    agent_backends=agent_backends,
                    adk_interceptor_runner=adk_interceptor_runner,
                )
            except Exception as exc:
                logger.warning(
                    "lyzr_per_agent_fallback",
                    error=str(exc),
                    fallback="GoogleBackend",
                )
                backend = GoogleBackend(
                    api_key=settings.google_api_key,
                    model=settings.gemini_model,
                    retry_count=settings.llm_retry_count,
                    retry_delay_seconds=settings.llm_retry_delay_seconds,
                )
                engine = create_debate_engine(
                    memory=memory, mcp=mcp, settings=settings, backend=backend,
                    adk_interceptor_runner=adk_interceptor_runner,
                )
        else:
            logger.warning("lyzr_adk_not_available_falling_back_to_google")
            backend = GoogleBackend(
                api_key=settings.google_api_key,
                model=settings.gemini_model,
                retry_count=settings.llm_retry_count,
                retry_delay_seconds=settings.llm_retry_delay_seconds,
            )
            engine = create_debate_engine(
                memory=memory, mcp=mcp, settings=settings, backend=backend,
                adk_interceptor_runner=adk_interceptor_runner,
            )
    else:
        # Shared backend (Google or single Lyzr agent)
        try:
            backend = await create_backend(settings)
            active_backend_label = type(backend).__name__
            logger.info("llm_backend_selected", backend=active_backend_label)
        except Exception as exc:
            logger.warning(
                "llm_backend_fallback",
                error=str(exc),
                fallback="GoogleBackend",
            )
            backend = GoogleBackend(
                api_key=settings.google_api_key,
                model=settings.gemini_model,
                retry_count=settings.llm_retry_count,
                retry_delay_seconds=settings.llm_retry_delay_seconds,
            )
        engine = create_debate_engine(
            memory=memory,
            mcp=mcp,
            settings=settings,
            backend=backend,
            adk_interceptor_runner=adk_interceptor_runner,
        )

    # Store on app state so routes can access them via Depends
    app.state.engine = engine
    app.state.memory = memory
    app.state.mcp = mcp

    logger.info("startup_complete", backend=active_backend_label)
    yield

    logger.info("shutdown")


def create_app() -> FastAPI:
    """Build and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="Workplace Proxy — Role 2: Multi-Agent Orchestrator",
        description=(
            "The 'brain' of Workplace Proxy. "
            "Receives raw workplace messages from Role 1's frontend, "
            "runs them through a 4-agent debate pipeline powered by Gemini, "
            "and returns structured, neurodivergent-friendly task translations."
        ),
        version=settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # CORS — Role 1's Vercel frontend must be able to call us from the browser.
    # See DECISIONS.md and RISK_REGISTER.md RISK-I04.
    allowed_origins = settings.get_cors_origins_list()
    if "*" in allowed_origins:
        allowed_origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:8000",
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
        ]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )

    # Register API routes under /api/v1
    app.include_router(router, prefix="/api/v1")

    # Global exception handler — surfaces unhandled errors as clean JSON
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error(
            "unhandled_exception",
            path=str(request.url),
            error=str(exc),
            exc_info=True,
        )
        return JSONResponse(
            status_code=500,
            content={
                "detail": "An internal error occurred in the orchestration pipeline.",
                "type": type(exc).__name__,
            },
        )

    return app


# Module-level app instance for uvicorn
app = create_app()


if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "orchestrator.main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=settings.environment == "development",
        log_level=settings.log_level.lower(),
    )
