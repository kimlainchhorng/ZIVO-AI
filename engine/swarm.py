import logging
import os
from typing import Optional

from agents import Agent, ModelSettings, Runner, handoff
from engine.tools import CONNECTOR_REGISTRY

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Prompt loader helper
# ---------------------------------------------------------------------------

def _load_prompt(path: str, fallback: str = "") -> str:
    """Read a prompt file, returning *fallback* if the file is absent."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        logger.warning("ZIVOSwarm: prompt file %r not found; using fallback.", path)
        return fallback


# ---------------------------------------------------------------------------
# ZIVOSwarm — Planner-Executor multi-agent swarm
# ---------------------------------------------------------------------------

class ZIVOSwarm:
    """Planner-Executor swarm using OpenAI Agents SDK handoffs.

    The Planner agent receives the full conversation and immediately hands off
    to the most appropriate specialist (WebResearchAgent, CodeExecutorAgent,
    or DataValidatorAgent).
    """

    def __init__(self, mcp_servers: Optional[list] = None) -> None:
        mcp_servers = mcp_servers or []

        # ── Executor: Web Research ──────────────────────────────────────────
        web_prompt = _load_prompt(
            "prompts/web_research_v1.txt",
            "You are ZIVO-AI's Web Research specialist.",
        )
        self.web_research_agent = Agent(
            name="WebResearchAgent",
            instructions=web_prompt,
            model="gpt-4o",
            model_settings=ModelSettings(temperature=0.5),
            tools=[
                CONNECTOR_REGISTRY["get_current_datetime"],
            ],
            mcp_servers=mcp_servers,
        )

        # ── Executor: Code Builder ──────────────────────────────────────────
        code_builder_prompt = _load_prompt(
            "prompts/code-builder-agent.txt",
            "You are ZIVO-AI's CodeBuilder specialist for generating complete full-stack projects.",
        )
        self.code_builder_agent = Agent(
            name="CodeBuilderAgent",
            instructions=code_builder_prompt,
            model="gpt-4o",
            model_settings=ModelSettings(temperature=0.2),
            tools=[
                CONNECTOR_REGISTRY["write_local_file"],
                CONNECTOR_REGISTRY["read_local_file"],
                CONNECTOR_REGISTRY["list_directory"],
            ],
        )

        # ── Executor: Code ──────────────────────────────────────────────────
        code_prompt = _load_prompt(
            "prompts/code_executor_v1.txt",
            "You are ZIVO-AI's Code specialist.",
        )
        self.code_executor_agent = Agent(
            name="CodeExecutorAgent",
            instructions=code_prompt,
            model="gpt-4o",
            model_settings=ModelSettings(temperature=0.5),
            tools=[
                CONNECTOR_REGISTRY["read_local_file"],
                CONNECTOR_REGISTRY["list_directory"],
            ],
        )

        # ── Executor: Data Validator ────────────────────────────────────────
        validator_prompt = _load_prompt(
            "prompts/data_validator_v1.txt",
            "You are ZIVO-AI's Data Validator specialist.",
        )
        self.data_validator_agent = Agent(
            name="DataValidatorAgent",
            instructions=validator_prompt,
            model="gpt-4o",
            model_settings=ModelSettings(temperature=0.5),
            tools=[
                CONNECTOR_REGISTRY["read_local_file"],
            ],
        )

        # ── Planner ─────────────────────────────────────────────────────────
        planner_prompt = _load_prompt(
            "prompts/planner_v1.txt",
            "You are ZIVO-AI's Planner. Route requests to the correct specialist.",
        )
        self.planner_agent = Agent(
            name="PlannerAgent",
            instructions=planner_prompt,
            model="gpt-4o",
            model_settings=ModelSettings(temperature=0.3),
            handoffs=[
                self.web_research_agent,
                self.code_builder_agent,
                self.code_executor_agent,
                self.data_validator_agent,
            ],
        )

    def run(self, messages: list[dict]) -> "RunResult":
        """Run the swarm synchronously.

        Args:
            messages: Chat history as a list of dicts with 'role' and 'content' keys.

        Returns:
            A RunResult object from the OpenAI Agents SDK with `.final_output`.
        """
        conversation = "\n".join(
            f"{m['role'].upper()}: {m['content']}" for m in messages
        )
        return Runner.run_sync(self.planner_agent, conversation)
