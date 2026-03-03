"""
engine/mcp_client.py
--------------------
MCPClientManager: loads MCP server configurations from ``mcp_servers.json``
and returns ready-to-use server instances for the OpenAI Agents SDK.

All connections are optional — if a server is missing or offline the
manager logs a warning and continues so the rest of the app is unaffected.
"""

import json
import logging
import os
from typing import Any

from agents.mcp import MCPServerSse, MCPServerSseParams, MCPServerStdio, MCPServerStdioParams

logger = logging.getLogger(__name__)

# Default config file location (repo root)
_DEFAULT_CONFIG = os.path.join(os.path.dirname(__file__), "..", "mcp_servers.json")


class MCPClientManager:
    """Manages connections to one or more MCP servers.

    Configuration is read from ``mcp_servers.json`` in the repo root.
    Each entry in the JSON array must have at minimum:
    - ``name``  (str)        — human-readable label
    - ``transport`` (str)    — ``"stdio"`` or ``"sse"``
    - ``command`` / ``url``  — transport-specific connection details

    Example entry (stdio)::

        {
          "name": "filesystem",
          "transport": "stdio",
          "command": "npx",
          "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
        }

    Example entry (SSE)::

        {
          "name": "github",
          "transport": "sse",
          "url": "http://localhost:8811/sse"
        }
    """

    def __init__(self, config_path: str = _DEFAULT_CONFIG) -> None:
        self._config_path = config_path
        self._server_configs: list[dict[str, Any]] = self._load_config()
        self._servers: list[Any] = []
        self._build_servers()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _load_config(self) -> list[dict[str, Any]]:
        """Load server list from JSON config; return [] on any error."""
        if not os.path.exists(self._config_path):
            logger.debug("mcp_servers.json not found at %s — MCP disabled.", self._config_path)
            return []
        try:
            with open(self._config_path, "r", encoding="utf-8") as fh:
                data = json.load(fh)
            if not isinstance(data, list):
                logger.warning("mcp_servers.json must be a JSON array; MCP disabled.")
                return []
            return data
        except (json.JSONDecodeError, OSError, ValueError) as exc:
            logger.warning("Failed to parse mcp_servers.json: %s", exc)
            return []

    def _build_servers(self) -> None:
        """Instantiate server objects from loaded configs; skip on error."""
        for cfg in self._server_configs:
            try:
                server = self._make_server(cfg)
                if server is not None:
                    self._servers.append(server)
            except (KeyError, TypeError, ValueError) as exc:
                name = cfg.get("name", "<unnamed>")
                logger.warning("Skipping MCP server %r: %s", name, exc)

    def _make_server(self, cfg: dict[str, Any]) -> Any:
        """Create a single MCP server instance from a config dict."""
        transport = cfg.get("transport", "stdio").lower()
        name: str = cfg.get("name", "mcp-server")

        if transport == "stdio":
            command: str = cfg["command"]
            args: list[str] = cfg.get("args", [])
            env: dict[str, str] | None = cfg.get("env")
            params = MCPServerStdioParams(command=command, args=args, env=env)
            return MCPServerStdio(params=params, name=name, cache_tools_list=True)

        if transport == "sse":
            url: str = cfg["url"]
            headers: dict[str, str] | None = cfg.get("headers")
            params = MCPServerSseParams(url=url, headers=headers)
            return MCPServerSse(params=params, name=name, cache_tools_list=True)

        logger.warning("Unknown MCP transport %r for server %r; skipping.", transport, name)
        return None

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def get_servers(self) -> list[Any]:
        """Return the list of configured MCP server instances.

        These can be passed directly to ``Agent(mcp_servers=...)``.
        """
        return list(self._servers)

    def list_tools(self) -> list[str]:
        """Return tool names available across all connected MCP servers.

        Uses the cached tools list when available; skips unreachable servers.
        """
        tool_names: list[str] = []
        for server in self._servers:
            try:
                import asyncio

                async def _fetch(srv: Any) -> list[str]:
                    async with srv:
                        tools = await srv.list_tools()
                        return [t.name for t in tools]

                names = asyncio.run(_fetch(server))
                tool_names.extend(names)
            except (asyncio.TimeoutError, ConnectionError, OSError) as exc:
                logger.warning("Could not list tools from %r: %s", getattr(server, "name", server), exc)
            except Exception as exc:  # noqa: BLE001 — MCP transport errors are not typed
                logger.warning("Unexpected error listing tools from %r: %s", getattr(server, "name", server), exc)
        return tool_names

    def server_statuses(self) -> list[dict[str, str]]:
        """Return a list of ``{name, transport, status}`` dicts for the UI."""
        statuses: list[dict[str, str]] = []
        for cfg in self._server_configs:
            statuses.append(
                {
                    "name": cfg.get("name", "unknown"),
                    "transport": cfg.get("transport", "stdio"),
                    "status": "configured",
                }
            )
        return statuses
