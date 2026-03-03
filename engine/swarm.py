"""
engine/swarm.py
---------------
ZIVOSwarm: a multi-agent "swarm" built on the OpenAI Agents SDK.

Architecture
~~~~~~~~~~~~
- PlannerAgent (gpt-4o)     — decomposes the user request and hands off to the
                               right specialist via SDK handoffs.
- WebResearchAgent (gpt-4o) — web research, summarisation, citations.
- CodeExecutorAgent (gpt-4o)— code generation and explanation.
- DataValidatorAgent (gpt-4o)— fact-checking, data validation, error flagging.

MCP server tools from MCPClientManager are passed to every agent so they all
have access to external integrations.  If MCP connections fail the swarm still
runs in pure tool-only mode.
"""

import logging
import os
from typing import Any

from agents import Agent, ModelSettings, Runner, handoff
from engine.mcp_client import MCPClientManager
from engine.tools import ALL_TOOLS

logger = logging.getLogger(__name__)

_PROMPTS_DIR = os.path.join(os.path.dirname(__file__), "..", "prompts")

# Tools available to the WebResearchAgent (information-retrieval focused)
_WEB_RESEARCH_TOOL_NAMES: frozenset[str] = frozenset({"get_current_datetime"})


def _read_prompt(filename: str) -> str:
    """Read a prompt file; return a fallback string if missing."""
    path = os.path.join(_PROMPTS_DIR, filename)
    try:
        with open(path, "r", encoding="utf-8") as fh:
            return fh.read()
    except FileNotFoundError:
        logger.warning("Prompt file not found: %s", path)
        return f"You are a helpful AI assistant specialising in {filename.replace('_v1.txt', '')}."


class ZIVOSwarm:
    """Federated multi-agent swarm for ZIVO-AI.

    Parameters
    ----------
    mcp_manager:
        Optional ``MCPClientManager`` instance.  If *None* a fresh one is
        created; if MCP is unconfigured the swarm still works via built-in
        tools only.
    """

    def __init__(self, mcp_manager: MCPClientManager | None = None) -> None:
        if mcp_manager is None:
            try:
                mcp_manager = MCPClientManager()
            except Exception as exc:  # noqa: BLE001
                logger.warning("MCPClientManager init failed (%s); running without MCP.", exc)
                mcp_manager = None

        mcp_servers: list[Any] = mcp_manager.get_servers() if mcp_manager else []

        # ── Executor agents ────────────────────────────────────────────
        self.web_research_agent = Agent(
            name="WebResearchAgent",
            instructions=_read_prompt("web_research_v1.txt"),
            model="gpt-4o",
            model_settings=ModelSettings(temperature=0.3),
            tools=[t for t in ALL_TOOLS if getattr(t, "__name__", "") in _WEB_RESEARCH_TOOL_NAMES],
            mcp_servers=mcp_servers,
        )

        self.code_executor_agent = Agent(
            name="CodeExecutorAgent",
            instructions=_read_prompt("code_executor_v1.txt"),
            model="gpt-4o",
            model_settings=ModelSettings(temperature=0.2),
            tools=ALL_TOOLS,
            mcp_servers=mcp_servers,
        )

        self.data_validator_agent = Agent(
            name="DataValidatorAgent",
            instructions=_read_prompt("data_validator_v1.txt"),
            model="gpt-4o",
            model_settings=ModelSettings(temperature=0.1),
            tools=ALL_TOOLS,
            mcp_servers=mcp_servers,
        )

        # ── Planner agent (routes via handoffs) ────────────────────────
        self.planner_agent = Agent(
            name="PlannerAgent",
            instructions=_read_prompt("planner_v1.txt"),
            model="gpt-4o",
            model_settings=ModelSettings(temperature=0.5),
            tools=ALL_TOOLS,
            mcp_servers=mcp_servers,
            handoffs=[
                handoff(self.web_research_agent),
                handoff(self.code_executor_agent),
                handoff(self.data_validator_agent),
            ],
        )

    # ------------------------------------------------------------------

    @property
    def agent_graph(self) -> dict[str, Any]:
        """Return a static description of the swarm for the debug panel."""
        return {
            "PlannerAgent": {
                "model": "gpt-4o",
                "handoffs": ["WebResearchAgent", "CodeExecutorAgent", "DataValidatorAgent"],
                "tools": [getattr(t, "__name__", str(t)) for t in (self.planner_agent.tools or [])],
            },
            "WebResearchAgent": {
                "model": "gpt-4o",
                "tools": [getattr(t, "__name__", str(t)) for t in (self.web_research_agent.tools or [])],
            },
            "CodeExecutorAgent": {
                "model": "gpt-4o",
                "tools": [getattr(t, "__name__", str(t)) for t in (self.code_executor_agent.tools or [])],
            },
            "DataValidatorAgent": {
                "model": "gpt-4o",
                "tools": [getattr(t, "__name__", str(t)) for t in (self.data_validator_agent.tools or [])],
            },
        }

    def run(self, messages: list[dict[str, str]]) -> Any:
        """Run the planner with full conversation history.

        Returns a ``RunResult`` with ``.final_output`` and ``.last_agent``.
        Falls back to direct single-agent mode if the planner fails.
        """
        conversation = "\n".join(
            f"{m['role'].upper()}: {m['content']}" for m in messages
        )
        try:
            return Runner.run_sync(self.planner_agent, conversation)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Swarm planner failed (%s); falling back to single-agent.", exc)
            from engine.tools import ALL_TOOLS as _tools
            fallback = Agent(
                name="ZIVO-AI",
                instructions="You are ZIVO-AI, a helpful assistant.",
                model="gpt-4o",
                tools=_tools,
            )
            return Runner.run_sync(fallback, conversation)
