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
    Transport-agnostic client for Role 1's Calendar MCP server.

    All public methods (find_available_slot, get_todays_blocks, ping) are identical
    regardless of which transport adapter is active — the Scheduler never needs to
    change when Role 1 switches from HTTP to SSE or stdio.

    All methods degrade gracefully: unavailable calendar returns a sensible default slot.
    """

    def __init__(
        self,
        calendar_url: str,
        timeout: float = 10.0,
        transport: MCPTransportAdapter | None = None,
    ) -> None:
        self._calendar_url = calendar_url.rstrip("/")
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

    async def find_available_slot(self, request: SlotRequest) -> tuple[CalendarBlock, str | None]:
        """
        Find the next available time slot in the user's calendar.

        Returns (slot, warning_message). warning_message is None on success.

        Endpoint assumed: POST /calendar/find-slot (pending Role 1 confirmation).
        """
        if not _HTTPX_AVAILABLE:
            return self._fallback_slot(request), "httpx not installed"

        try:
            preferred_after_str = (
                request.preferred_after.isoformat()
                if request.preferred_after
                else None
            )
            data = await self._transport.post(
                "/calendar/find-slot",
                json={
                    "user_id": request.user_id,
                    "duration_minutes": request.duration_minutes,
                    "preferred_after": preferred_after_str,
                    "block_type": request.preferred_block_type,
                },
            )
            block = CalendarBlock(**data)
            logger.debug("calendar_slot_found", start=block.start.isoformat())
            return block, None

        except Exception as exc:
            warning = f"Calendar MCP unavailable: {type(exc).__name__}. Using fallback slot."
            logger.warning("calendar_mcp_error", endpoint="find_available_slot", error=str(exc))
            return self._fallback_slot(request), warning

    async def get_todays_blocks(self, user_id: str) -> tuple[list[CalendarBlock], str | None]:
        """
        Retrieve all calendar blocks for today to inform the Scheduler's reasoning.

        Returns (blocks, warning_message). Returns empty list on failure.

        Endpoint assumed: GET /calendar/today?user_id= (pending Role 1 confirmation).
        """
        if not _HTTPX_AVAILABLE:
            return [], "httpx not installed"

        try:
            blocks_data = await self._transport.get(
                "/calendar/today",
                params={"user_id": user_id},
            )
            blocks = [CalendarBlock(**b) for b in blocks_data]
            logger.debug("calendar_blocks_fetched", count=len(blocks))
            return blocks, None

        except Exception as exc:
            warning = f"Calendar MCP unavailable: {type(exc).__name__}"
            logger.warning("calendar_mcp_error", endpoint="get_todays_blocks", error=str(exc))
            return [], warning

    async def ping(self) -> bool:
        """Check if the Calendar MCP server is reachable. Used by health check."""
        return await self._transport.ping()

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
