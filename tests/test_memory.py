"""Tests for engine/memory.py."""

import sys
import types

# Stub agents + dotenv (required by engine/__init__.py)
for _mod in ("agents", "dotenv"):
    if _mod not in sys.modules:
        stub = types.ModuleType(_mod)
        stub.function_tool = lambda fn: fn  # type: ignore
        stub.Agent = object  # type: ignore
        stub.Runner = object  # type: ignore
        stub.ModelSettings = object  # type: ignore
        stub.handoff = lambda *a, **kw: None  # type: ignore
        stub.load_dotenv = lambda: None  # type: ignore
        sys.modules[_mod] = stub
sys.modules.setdefault("agents.mcp", types.ModuleType("agents.mcp"))

from engine.memory import ConversationMemory  # noqa: E402


def test_add_and_get_messages():
    mem = ConversationMemory(window=5)
    mem.add("user", "Hello")
    mem.add("assistant", "Hi there!")
    msgs = mem.get_messages()
    assert len(msgs) == 2
    assert msgs[0]["role"] == "user"
    assert msgs[1]["content"] == "Hi there!"


def test_window_truncation():
    mem = ConversationMemory(window=3)
    for i in range(5):
        mem.add("user", f"msg {i}")
    msgs = mem.get_messages()
    assert len(msgs) == 3
    assert msgs[0]["content"] == "msg 2"


def test_summary_prepended():
    mem = ConversationMemory()
    mem.set_summary("Earlier we discussed Python basics.")
    mem.add("user", "Tell me more.")
    msgs = mem.get_messages()
    assert msgs[0]["role"] == "system"
    assert "Earlier we discussed" in msgs[0]["content"]
    assert msgs[1]["role"] == "user"


def test_clear():
    mem = ConversationMemory()
    mem.add("user", "test")
    mem.set_summary("summary")
    mem.clear()
    assert mem.get_messages() == []
    assert mem._summary is None


def test_token_estimate():
    mem = ConversationMemory()
    mem.add("user", "x" * 400)  # ~100 tokens
    assert mem.token_estimate > 0


def test_serialisation_round_trip():
    mem = ConversationMemory(window=10)
    mem.add("user", "Hello")
    mem.set_summary("context")
    json_str = mem.to_json()
    mem2 = ConversationMemory.from_json(json_str, window=10)
    assert mem2.get_messages() == mem.get_messages()
    assert mem2._summary == mem._summary
