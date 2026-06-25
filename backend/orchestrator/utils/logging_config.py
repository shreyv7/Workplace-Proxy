"""Structured logging setup for Role 2.

Uses structlog for JSON output in production and coloured console output in dev.
Falls back to stdlib logging with JSON formatting if structlog is not installed.
"""
from __future__ import annotations

import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any


# ── structlog integration (preferred) ────────────────────────────────────────

try:
    import structlog

    def configure_logging(log_level: str = "INFO") -> None:
        """Configure structlog for structured JSON output."""
        level = getattr(logging, log_level.upper(), logging.INFO)

        shared_processors: list[Any] = [
            structlog.contextvars.merge_contextvars,
            structlog.stdlib.add_log_level,
            structlog.processors.TimeStamper(fmt="iso", utc=True),
            structlog.processors.StackInfoRenderer(),
        ]

        if sys.stderr.isatty():
            # Human-readable in dev
            renderer: Any = structlog.dev.ConsoleRenderer()
        else:
            # JSON in CI / production
            renderer = structlog.processors.JSONRenderer()

        structlog.configure(
            processors=shared_processors + [renderer],
            wrapper_class=structlog.make_filtering_bound_logger(level),
            context_class=dict,
            logger_factory=structlog.PrintLoggerFactory(),
            cache_logger_on_first_use=True,
        )
        logging.basicConfig(level=level, stream=sys.stdout)

    def get_logger(name: str) -> Any:
        """Return a structlog bound logger for the given module name."""
        return structlog.get_logger().bind(logger=name)

    STRUCTLOG_AVAILABLE = True

except ImportError:
    STRUCTLOG_AVAILABLE = False

    # ── stdlib fallback ───────────────────────────────────────────────────────

    class _JSONFormatter(logging.Formatter):
        """Minimal JSON formatter for when structlog is not available."""

        def format(self, record: logging.LogRecord) -> str:
            data: dict[str, Any] = {
                "timestamp": datetime.now(tz=timezone.utc).isoformat(),
                "level": record.levelname,
                "logger": record.name,
                "message": record.getMessage(),
            }
            if record.exc_info:
                data["exception"] = self.formatException(record.exc_info)
            return json.dumps(data)

    def configure_logging(log_level: str = "INFO") -> None:  # type: ignore[misc]
        level = getattr(logging, log_level.upper(), logging.INFO)
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(_JSONFormatter())
        logging.root.setLevel(level)
        logging.root.handlers = [handler]

    def get_logger(name: str) -> logging.Logger:  # type: ignore[misc]
        return logging.getLogger(name)
