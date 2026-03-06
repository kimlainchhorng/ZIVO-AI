"""Tests for python-ai/main.py using httpx.AsyncClient + pytest-asyncio."""

import sys
import os
import types
import unittest.mock

import pytest

# ---------------------------------------------------------------------------
# Ensure the python-ai directory is on sys.path so `main` can be imported.
# ---------------------------------------------------------------------------

_PYTHON_AI_DIR = os.path.join(os.path.dirname(__file__), "..", "python-ai")
if _PYTHON_AI_DIR not in sys.path:
    sys.path.insert(0, os.path.abspath(_PYTHON_AI_DIR))

# ---------------------------------------------------------------------------
# Stub heavy optional dependencies before importing main.
# ---------------------------------------------------------------------------

for _mod in ("dotenv",):
    if _mod not in sys.modules:
        stub = types.ModuleType(_mod)
        stub.load_dotenv = lambda: None  # type: ignore[attr-defined]
        sys.modules[_mod] = stub

# Now import the FastAPI app.
import importlib  # noqa: E402

with unittest.mock.patch("dotenv.load_dotenv", lambda: None):
    import main as _main_module  # noqa: E402

app = _main_module.app

from httpx import AsyncClient, ASGITransport  # noqa: E402


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_completion_mock(content: str = "hello", total_tokens: int = 5):
    """Return a mock that looks like an openai ChatCompletion response."""
    choice = unittest.mock.MagicMock()
    choice.message.content = content
    usage = unittest.mock.MagicMock()
    usage.total_tokens = total_tokens
    completion = unittest.mock.MagicMock()
    completion.choices = [choice]
    completion.usage = usage
    return completion


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_health_endpoint() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok", "version": "2.0"}


@pytest.mark.asyncio
async def test_generate_missing_api_key() -> None:
    env_without_key = {k: v for k, v in os.environ.items() if k != "OPENAI_API_KEY"}
    with unittest.mock.patch.dict(os.environ, env_without_key, clear=True):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post("/generate", json={"prompt": "hello"})
    assert resp.status_code == 500
    assert "OPENAI_API_KEY" in resp.text


@pytest.mark.asyncio
async def test_generate_prompt_too_long() -> None:
    long_prompt = "x" * 33_000
    with unittest.mock.patch.dict(os.environ, {"OPENAI_API_KEY": "sk-test"}):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.post("/generate", json={"prompt": long_prompt})
    assert resp.status_code == 422
