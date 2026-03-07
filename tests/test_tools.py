"""Tests for engine/tools.py.

Because engine/tools.py imports from the `agents` SDK at module load-time
(via `from agents import function_tool`), we stub out the `agents` module
before importing anything from the engine package.
"""

import json
import os
import sys
import tempfile
import types
import unittest.mock

# ---------------------------------------------------------------------------
# Stub the `agents` package (and sub-modules) so the engine package can be
# imported without the real openai-agents SDK installed in the test
# environment.  We must do this before any engine.* import.
# ---------------------------------------------------------------------------

_agents_stub = types.ModuleType("agents")
_agents_stub.function_tool = lambda fn: fn  # identity decorator
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

# Now it is safe to import from the engine package.
from engine.tools import (  # noqa: E402
    get_current_datetime,
    list_directory,
    read_local_file,
    write_local_file,
)


# ---------------------------------------------------------------------------
# get_current_datetime
# ---------------------------------------------------------------------------


def test_get_current_datetime_returns_string() -> None:
    result = get_current_datetime()
    assert isinstance(result, str)
    assert len(result) > 0


# ---------------------------------------------------------------------------
# read_local_file
# ---------------------------------------------------------------------------


def test_read_local_file_not_found() -> None:
    result = read_local_file("this_file_does_not_exist_xyz.txt")
    assert "[Error: File 'this_file_does_not_exist_xyz.txt' not found]" in result


def test_read_local_file_success() -> None:
    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as tmp:
        tmp.write("hello world")
        tmp_path = tmp.name
    try:
        # Use just the basename to stay within the working directory
        rel_path = os.path.basename(tmp_path)
        orig_dir = os.getcwd()
        os.chdir(os.path.dirname(tmp_path))
        try:
            result = read_local_file(rel_path)
            assert result == "hello world"
        finally:
            os.chdir(orig_dir)
    finally:
        os.unlink(tmp_path)


def test_read_local_file_unsafe_path() -> None:
    result = read_local_file("../etc/passwd")
    assert "[Guardrail blocked]" in result


# ---------------------------------------------------------------------------
# list_directory
# ---------------------------------------------------------------------------


def test_list_directory_success() -> None:
    result = list_directory(".")
    data = json.loads(result)
    assert "files" in data
    assert "directories" in data


def test_list_directory_unsafe_path() -> None:
    result = list_directory("../secret")
    assert "[Guardrail blocked]" in result


# ---------------------------------------------------------------------------
# write_local_file
# ---------------------------------------------------------------------------


def test_write_local_file_success() -> None:
    with tempfile.TemporaryDirectory() as tmp_dir:
        rel_path = os.path.basename(tmp_dir) + "_out.txt"
        abs_path = os.path.join(tmp_dir, rel_path)
        orig_dir = os.getcwd()
        os.chdir(tmp_dir)
        try:
            result = write_local_file(rel_path, "test content")
            assert "Success" in result
            with open(abs_path, "r", encoding="utf-8") as f:
                assert f.read() == "test content"
        finally:
            os.chdir(orig_dir)


def test_write_local_file_unsafe_path() -> None:
    result = write_local_file("/etc/passwd", "bad")
    assert "[Guardrail blocked]" in result
