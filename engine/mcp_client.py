import logging
from typing import Optional

logger = logging.getLogger(__name__)


class MCPClientManager:
    """Manages connections to MCP servers defined in mcp_servers.json."""

    def __init__(self, config_path: str = "mcp_servers.json") -> None:
        self._servers: list = []
        self._tool_names: list[str] = []
        self._all_config: list[dict] = []  # all entries (enabled + disabled)
        self._load_config(config_path)

    def _load_config(self, config_path: str) -> None:
        """Load server definitions from the JSON config file (optional)."""
        import json
        import os

        if not os.path.exists(config_path):
            return

        try:
            with open(config_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self._all_config = data.get("servers", [])
        except Exception as exc:
            logger.warning("MCPClientManager: failed to read %s — %s", config_path, exc)

        for server_cfg in self._all_config:
            if server_cfg.get("enabled", False):
                self._init_server(server_cfg)

    def _init_server(self, cfg: dict) -> None:
        """Initialize a single MCP server instance and register it."""
        name = cfg.get("name", "<unnamed>")
        transport = cfg.get("transport", "stdio")
        try:
            if transport == "stdio":
                from agents.mcp import MCPServerStdio

                server = MCPServerStdio(
                    params={"command": cfg["command"], "args": cfg.get("args", [])}
                )
            elif transport == "sse":
                from agents.mcp import MCPServerSse

                server = MCPServerSse(params={"url": cfg["url"]})
            else:
                logger.warning("MCPClientManager: unknown transport %r for server %r", transport, name)
                return

            self._servers.append(server)
            self._tool_names.append(name)
            logger.info("MCPClientManager: registered server %r (%s)", name, transport)
        except Exception as exc:
            logger.warning("MCPClientManager: failed to initialize server %r — %s", name, exc)

    def get_servers(self) -> list:
        """Return list of MCPServer instances for use with Agent(mcp_servers=...)."""
        return list(self._servers)

    def list_tools(self) -> list[str]:
        """Return server/tool names for UI display."""
        return list(self._tool_names)

    def list_config(self) -> list[dict]:
        """Return all raw server config entries (enabled + disabled) for display."""
        return list(self._all_config)
