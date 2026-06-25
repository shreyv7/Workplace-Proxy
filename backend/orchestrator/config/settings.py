"""Environment-variable driven configuration for Role 2.

All runtime configuration must come from here — never hardcoded values elsewhere.
"""
from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # ── Google Gemini ────────────────────────────────────────────
    google_api_key: str
    gemini_model: str = "gemini-2.0-flash"

    # ── Lyzr (optional) ──────────────────────────────────────────
    lyzr_api_key: str = ""
    lyzr_enabled: bool = False
    lyzr_per_agent: bool = False    # True → each of the 4 agents gets its own Lyzr cloud agent

    # ── FastAPI server ────────────────────────────────────────────
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    log_level: str = "INFO"
    cors_origins: str = "*"

    # ── Role 3: Memory / Qdrant service ──────────────────────────
    memory_service_url: str = "http://localhost:8001"
    memory_service_timeout: float = 10.0

    # ── Role 1: MCP servers ───────────────────────────────────────
    mcp_calendar_url: str = "http://localhost:3002"
    mcp_slack_url: str = "http://localhost:3000"
    mcp_email_url: str = "http://localhost:3001"
    mcp_timeout: float = 10.0

    # ── Debate engine ─────────────────────────────────────────────
    max_debate_rounds: int = 3
    debate_consensus_threshold: int = 2

    # ── LLM resilience ────────────────────────────────────────────
    llm_retry_count: int = 2                  # retries on transient Gemini failures
    llm_retry_delay_seconds: float = 1.0      # base delay; doubles on each retry

    # ── MCP transport ─────────────────────────────────────────────
    mcp_transport: Literal["http", "sse", "stdio"] = "http"
    mcp_stdio_command: str = ""               # e.g. "node path/to/mcp-server.js" for stdio

    # ── Demo mode ─────────────────────────────────────────────────
    demo_mode: bool = False                   # DEMO_MODE=true → deterministic responses

    # ── Observability ─────────────────────────────────────────────
    max_transcript_events: int = 500          # cap on events stored in one DebateTranscript

    # ── Environment ───────────────────────────────────────────────
    environment: Literal["development", "staging", "production"] = "development"
    app_version: str = "0.1.0"

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        allowed = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
        upper = v.upper()
        if upper not in allowed:
            raise ValueError(f"log_level must be one of {allowed}")
        return upper

    def get_cors_origins_list(self) -> list[str]:
        """Parse comma-separated CORS origins into a list."""
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the singleton Settings instance (cached after first call)."""
    return Settings()
