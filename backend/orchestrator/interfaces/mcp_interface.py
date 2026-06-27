"""Interface to Role 1's MCP (Model Context Protocol) servers.

Role 1 (shrey) builds and runs the MCP servers for Slack, Email, and Calendar.
Role 2's Scheduler agent calls the Calendar MCP to find available deep-work blocks.

STATUS: HTTP transport active. SSE and stdio adapters are stubs.

Transport selection:
    MCPInterface delegates all network I/O to an MCPTransportAdapter.
    The active transport is selected from settings at startup (mcp_transport).
    The Scheduler code is completely unaware of which transport is in use.

IMPORTANT — MCP TRANSPORT WARNING:
Standard MCP servers use stdio transport, NOT HTTP. If Role 1's Calendar MCP
uses stdio, set MCP_TRANSPORT=stdio and MCP_STDIO_COMMAND=<launch command>.
See RISK_REGISTER.md RISK-I03 and interfaces/mcp_transport.py.

Pending Role 1 confirmation: Calendar MCP transport type, endpoint path, and
authentication. See INTEGRATION_NOTES.md Interface E.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING, Literal

from pydantic import BaseModel

from orchestrator.utils.logging_config import get_logger

if TYPE_CHECKING:
    from orchestrator.interfaces.mcp_transport import MCPTransportAdapter

logger = get_logger(__name__)

try:
    import httpx
    _HTTPX_AVAILABLE = True
except ImportError:
    _HTTPX_AVAILABLE = False


# ── Data models ───────────────────────────────────────────────────────────────

class CalendarBlock(BaseModel):
    """A time block in the user's calendar."""
    start: datetime
    end: datetime
    block_type: Literal["deep_work", "shallow_work", "meeting", "admin", "free"]
    is_available: bool = True
    title: str | None = None


class SlotRequest(BaseModel):
    """Parameters for finding the next available calendar slot."""
    user_id: str
    duration_minutes: int = 30
    preferred_after: datetime | None = None
    preferred_block_type: str = "shallow_work"


# ── Interface class ───────────────────────────────────────────────────────────

class MCPInterface:
    """
    Transport-agnostic client for Role 1's MCP servers (Calendar, Gmail, Slack).

    Calendar methods use the pluggable MCPTransportAdapter (HTTP/SSE/stdio).
    Gmail and Slack methods use direct httpx calls to their respective servers.

    All methods degrade gracefully — unavailable services return empty data or defaults.
    """

    def __init__(
        self,
        calendar_url: str,
        timeout: float = 10.0,
        transport: MCPTransportAdapter | None = None,
        email_url: str = "http://localhost:3001",
        slack_url: str = "http://localhost:3000",
    ) -> None:
        self._calendar_url = calendar_url.rstrip("/")
        self._email_url = email_url.rstrip("/")
        self._slack_url = slack_url.rstrip("/")
        self._timeout = timeout
        # When no transport is provided, default to HTTP for backward compatibility.
        if transport is not None:
            self._transport: MCPTransportAdapter = transport
        else:
            from orchestrator.interfaces.mcp_transport import HTTPTransportAdapter
            self._transport = HTTPTransportAdapter(
                base_url=self._calendar_url,
                timeout=self._timeout,
            )

    async def find_available_slot(
        self,
        request: SlotRequest,
        access_token: str | None = None,
    ) -> tuple[CalendarBlock, str | None]:
        """
        Find the next available time slot in the user's calendar.

        access_token is forwarded as Authorization: Bearer to the Calendar MCP server.
        When provided, the server uses the user's real Google Calendar; otherwise demo data.

        Returns (slot, warning_message). warning_message is None on success.
        """
        if not _HTTPX_AVAILABLE:
            return self._fallback_slot(request), "httpx not installed"

        try:
            preferred_after_str = (
                request.preferred_after.isoformat()
                if request.preferred_after
                else None
            )
            headers = {"Authorization": f"Bearer {access_token}"} if access_token else {}
            data = await self._transport.post(
                "/calendar/find-slot",
                json={
                    "user_id": request.user_id,
                    "duration_minutes": request.duration_minutes,
                    "preferred_after": preferred_after_str,
                    "block_type": request.preferred_block_type,
                },
                headers=headers,
            )
            block = CalendarBlock(**data)
            logger.debug("calendar_slot_found", start=block.start.isoformat(), authenticated=bool(access_token))
            return block, None

        except Exception as exc:
            warning = f"Calendar MCP unavailable: {type(exc).__name__}. Using fallback slot."
            logger.warning("calendar_mcp_error", endpoint="find_available_slot", error=str(exc))
            return self._fallback_slot(request), warning

    async def get_todays_blocks(
        self,
        user_id: str,
        access_token: str | None = None,
    ) -> tuple[list[CalendarBlock], str | None]:
        """
        Retrieve all calendar blocks for today to inform the Scheduler's reasoning.

        access_token is forwarded as Authorization: Bearer to the Calendar MCP server.
        When provided, the server reads the user's real Google Calendar; otherwise demo data.

        Returns (blocks, warning_message). Returns empty list on failure.
        """
        if not _HTTPX_AVAILABLE:
            return [], "httpx not installed"

        try:
            headers = {"Authorization": f"Bearer {access_token}"} if access_token else {}
            blocks_data = await self._transport.get(
                "/calendar/today",
                params={"user_id": user_id},
                headers=headers,
            )
            blocks = [CalendarBlock(**b) for b in blocks_data]
            logger.debug("calendar_blocks_fetched", count=len(blocks), authenticated=bool(access_token))
            return blocks, None

        except Exception as exc:
            warning = f"Calendar MCP unavailable: {type(exc).__name__}"
            logger.warning("calendar_mcp_error", endpoint="get_todays_blocks", error=str(exc))
            return [], warning

    async def ping(self) -> bool:
        """Check if the Calendar MCP server is reachable. Used by health check."""
        return await self._transport.ping()

    async def get_gmail_threads(
        self,
        user_id: str,
        access_token: str | None = None,
        max_results: int = 10,
    ) -> tuple[list[dict], str | None]:
        """
        Fetch email threads from the Gmail MCP server.

        Returns (threads, warning). Threads is [] on failure.
        access_token is forwarded as Authorization header when provided;
        otherwise the Gmail MCP server uses its GOOGLE_ACCESS_TOKEN env var
        or falls back to demo mode.
        """
        if not _HTTPX_AVAILABLE:
            return [], "httpx not installed — Gmail MCP unavailable"

        try:
            import httpx
            headers: dict[str, str] = {}
            if access_token:
                headers["Authorization"] = f"Bearer {access_token}"
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                resp = await client.get(
                    f"{self._email_url}/gmail/threads",
                    params={"user_id": user_id, "max_results": max_results},
                    headers=headers,
                )
                resp.raise_for_status()
                threads = resp.json()
                logger.debug("gmail_threads_fetched", count=len(threads))
                return threads, None
        except Exception as exc:
            warning = f"Gmail MCP unavailable: {type(exc).__name__}"
            logger.warning("gmail_mcp_error", error=str(exc))
            return [], warning

    async def get_slack_messages(
        self,
        channel: str = "general",
        user_id: str = "",
        limit: int = 20,
    ) -> tuple[list[dict], str | None]:
        """
        Fetch recent messages from a Slack channel via the Slack MCP server.

        Returns (messages, warning). Messages is [] on failure.
        The Slack MCP server uses its runtime bot token (from OAuth flow or env var)
        or falls back to demo mode.
        """
        if not _HTTPX_AVAILABLE:
            return [], "httpx not installed — Slack MCP unavailable"

        try:
            import httpx
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                resp = await client.get(
                    f"{self._slack_url}/slack/messages",
                    params={"channel": channel, "limit": limit},
                )
                resp.raise_for_status()
                messages = resp.json()
                logger.debug("slack_messages_fetched", count=len(messages), channel=channel)
                return messages, None
        except Exception as exc:
            warning = f"Slack MCP unavailable: {type(exc).__name__}"
            logger.warning("slack_mcp_error", error=str(exc))
            return [], warning

    def _fallback_slot(self, request: SlotRequest) -> CalendarBlock:
        """Default slot when the Calendar MCP is unavailable: next morning at 09:00."""
        now = datetime.now(tz=timezone.utc)
        base = request.preferred_after or now
        candidate = base.replace(hour=9, minute=0, second=0, microsecond=0)
        if candidate <= now:
            candidate += timedelta(days=1)
        end = candidate + timedelta(minutes=request.duration_minutes)
        logger.info("using_fallback_calendar_slot", start=candidate.isoformat())
        return CalendarBlock(
            start=candidate,
            end=end,
            block_type="shallow_work",
            is_available=True,
            title="[Fallback slot — calendar unavailable]",
        )
