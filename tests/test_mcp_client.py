"""Tests for engine/mcp_client.py.

The `agents.mcp` sub-module is only imported lazily inside MCPClientManager
methods, so we can test the public API without the real SDK by ensuring those
code paths are not exercised (i.e. config file absent or no enabled servers).
"""

import sys
import types

# ---------------------------------------------------------------------------
# Stub the top-level `agents` package and `agents.mcp` sub-module so that
# any import inside mcp_client.py (and engine/__init__.py) succeeds without
# the real SDK.
# ---------------------------------------------------------------------------

_agents_stub = types.ModuleType("agents")
_agents_stub.function_tool = lambda fn: fn  # type: ignore[attr-defined]
_agents_stub.Agent = object  # type: ignore[attr-defined]
_agents_stub.Runner = object  # type: ignore[attr-defined]
_agents_stub.ModelSettings = object  # type: ignore[attr-defined]
_agents_stub.handoff = lambda *a, **kw: None  # type: ignore[attr-defined]

_agents_mcp_stub = types.ModuleType("agents.mcp")
_agents_mcp_stub.MCPServerStdio = object  # type: ignore[attr-defined]
_agents_mcp_stub.MCPServerSse = object  # type: ignore[attr-defined]

sys.modules.setdefault("agents", _agents_stub)
sys.modules.setdefault("agents.mcp", _agents_mcp_stub)

# Stub dotenv so ZivoBrain's load_dotenv() call doesn't fail.
_dotenv_stub = types.ModuleType("dotenv")
_dotenv_stub.load_dotenv = lambda: None  # type: ignore[attr-defined]
sys.modules.setdefault("dotenv", _dotenv_stub)

from engine.mcp_client import MCPClientManager  # noqa: E402


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


def test_list_config_empty_when_no_file() -> None:
    manager = MCPClientManager("nonexistent.json")
    assert manager.list_config() == []


def test_get_servers_empty_when_no_file() -> None:
    manager = MCPClientManager("nonexistent.json")
    assert manager.get_servers() == []


def test_list_tools_empty_when_no_file() -> None:
    manager = MCPClientManager("nonexistent.json")
    assert manager.list_tools() == []
