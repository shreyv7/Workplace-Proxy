"""MCP transport adapter — isolates the Scheduler from transport mechanics.

The Model Context Protocol supports three transports:
  - HTTP REST    (current default, used while Role 1 confirms their setup)
  - SSE          (Server-Sent Events, common for streaming MCP servers)
  - stdio        (subprocess stdin/stdout, the MCP spec default)

The Scheduler calls MCPInterface methods; MCPInterface delegates to whichever
transport adapter is active. Transport is selected from settings at startup.
No Scheduler code changes when Role 1 switches transports.

Extension: implement SSETransportAdapter and StdioTransportAdapter fully
once Role 1 confirms their Calendar MCP server configuration.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class MCPTransportAdapter(ABC):
    """Abstract MCP transport. MCPInterface delegates HTTP calls here."""

    @abstractmethod
    async def post(self, path: str, json: dict[str, Any]) -> Any:
        """POST to the MCP server and return the parsed response body."""
        ...

    @abstractmethod
    async def get(self, path: str, params: dict[str, Any]) -> Any:
        """GET from the MCP server and return the parsed response body."""
        ...

    @abstractmethod
    async def ping(self) -> bool:
        """Check reachability. Return True if the server responds."""
        ...


class HTTPTransportAdapter(MCPTransportAdapter):
    """HTTP REST transport — wraps httpx. Current default."""

    def __init__(self, base_url: str, timeout: float) -> None:
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout

    async def post(self, path: str, json: dict[str, Any]) -> Any:
        import httpx
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.post(f"{self._base_url}{path}", json=json)
            response.raise_for_status()
            return response.json()

    async def get(self, path: str, params: dict[str, Any]) -> Any:
        import httpx
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.get(f"{self._base_url}{path}", params=params)
            response.raise_for_status()
            return response.json()

    async def ping(self) -> bool:
        try:
            import httpx
            async with httpx.AsyncClient(timeout=3.0) as client:
                response = await client.get(f"{self._base_url}/health")
                return response.status_code < 500
        except Exception:
            return False


class SSETransportAdapter(MCPTransportAdapter):
    """SSE transport stub — implement when Role 1 confirms SSE Calendar MCP.

    SSE MCP servers stream events over a persistent HTTP connection.
    Use the `httpx-sse` package or `aiohttp` for the implementation.
    See RISK_REGISTER.md RISK-I03.
    """

    async def post(self, path: str, json: dict[str, Any]) -> Any:
        raise NotImplementedError(
            "SSE MCP transport not yet implemented. "
            "Confirm Calendar MCP transport with Role 1, then implement here."
        )

    async def get(self, path: str, params: dict[str, Any]) -> Any:
        raise NotImplementedError("SSE MCP transport not yet implemented.")

    async def ping(self) -> bool:
        return False


class StdioTransportAdapter(MCPTransportAdapter):
    """stdio transport stub — implement when Role 1 confirms stdio Calendar MCP.

    stdio MCP servers communicate via subprocess stdin/stdout.
    Launch with `mcp_stdio_command` from Settings; use asyncio.create_subprocess_exec.
    See RISK_REGISTER.md RISK-I03.
    """

    def __init__(self, command: str) -> None:
        self._command = command

    async def post(self, path: str, json: dict[str, Any]) -> Any:
        raise NotImplementedError(
            f"stdio MCP transport not yet implemented. "
            f"Command would be: {self._command!r}. "
            "Confirm Calendar MCP transport with Role 1, then implement here."
        )

    async def get(self, path: str, params: dict[str, Any]) -> Any:
        raise NotImplementedError("stdio MCP transport not yet implemented.")

    async def ping(self) -> bool:
        return False


def create_transport(
    transport_type: str,
    base_url: str,
    timeout: float,
    stdio_command: str = "",
) -> MCPTransportAdapter:
    """Factory: return the transport adapter matching the configured transport type."""
    if transport_type == "http":
        return HTTPTransportAdapter(base_url=base_url, timeout=timeout)
    if transport_type == "sse":
        return SSETransportAdapter()
    if transport_type == "stdio":
        return StdioTransportAdapter(command=stdio_command)
    raise ValueError(
        f"Unknown MCP transport type: {transport_type!r}. "
        "Valid options: 'http', 'sse', 'stdio'."
    )
