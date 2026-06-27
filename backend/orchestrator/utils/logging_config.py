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


# ── stdlib fallback classes (always defined for testability) ──────────────────

class _FallbackLogger:
    """Fallback logger that mimics structlog's bound logger behavior."""

    def __init__(self, logger: logging.Logger, context: dict[str, Any] | None = None) -> None:
        self._logger = logger
        self._context = context or {}

    def bind(self, **kwargs: Any) -> _FallbackLogger:
        return _FallbackLogger(self._logger, {**self._context, **kwargs})

    def unbind(self, *keys: str) -> _FallbackLogger:
        new_context = {k: v for k, v in self._context.items() if k not in keys}
        return _FallbackLogger(self._logger, new_context)

    def _log(self, level: int, event: str, *args: Any, **kwargs: Any) -> None:
        std_kwargs = {}
        context = {**self._context}
        for k, v in kwargs.items():
            if k in ("exc_info", "stack_info", "stacklevel"):
                std_kwargs[k] = v
            else:
                context[k] = v
        std_kwargs["extra"] = {"_context": context}
        self._logger.log(level, event, *args, **std_kwargs)

    def debug(self, event: str, *args: Any, **kwargs: Any) -> None:
        self._log(logging.DEBUG, event, *args, **kwargs)

    def info(self, event: str, *args: Any, **kwargs: Any) -> None:
        self._log(logging.INFO, event, *args, **kwargs)

    def warning(self, event: str, *args: Any, **kwargs: Any) -> None:
        self._log(logging.WARNING, event, *args, **kwargs)

    def warn(self, event: str, *args: Any, **kwargs: Any) -> None:
        self._log(logging.WARNING, event, *args, **kwargs)

    def error(self, event: str, *args: Any, **kwargs: Any) -> None:
        self._log(logging.ERROR, event, *args, **kwargs)

    def critical(self, event: str, *args: Any, **kwargs: Any) -> None:
        self._log(logging.CRITICAL, event, *args, **kwargs)

    def exception(self, event: str, *args: Any, **kwargs: Any) -> None:
        kwargs.setdefault("exc_info", True)
        self._log(logging.ERROR, event, *args, **kwargs)


class _JSONFormatter(logging.Formatter):
    """Minimal JSON formatter for when structlog is not available."""

    def format(self, record: logging.LogRecord) -> str:
        data: dict[str, Any] = {
            "timestamp": datetime.now(tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        context = getattr(record, "_context", None)
        if context and isinstance(context, dict):
            for k, v in context.items():
                if k not in data:
                    data[k] = v
        if record.exc_info:
            data["exception"] = self.formatException(record.exc_info)
        return json.dumps(data)


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

    def configure_logging(log_level: str = "INFO") -> None:  # type: ignore[misc]
        level = getattr(logging, log_level.upper(), logging.INFO)
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(_JSONFormatter())
        logging.root.setLevel(level)
        logging.root.handlers = [handler]

    def get_logger(name: str) -> Any:  # type: ignore[misc]
        return _FallbackLogger(logging.getLogger(name))
