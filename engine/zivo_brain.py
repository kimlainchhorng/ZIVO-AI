import os
from typing import AsyncIterator, Optional

from dotenv import load_dotenv

from agents import Agent, Runner, ModelSettings
from engine.tools import ALL_TOOLS
from engine.mcp_client import MCPClientManager

load_dotenv()

class ZivoBrain:
    def __init__(self,
        prompt_path: str = "prompts/system_v1.txt",
        use_swarm: bool = False,
        agent_mode: bool = False,
    ) -> None:
        """Initialise ZivoBrain.

        Args:
            prompt_path: Path to the system prompt file used in single-agent mode.
            use_swarm: When True, delegates execution to ZIVOSwarm (multi-agent).
            agent_mode: When True, extends the system prompt with autonomous Agent
                Mode instructions. The agent will explore the codebase, search the
                web for solutions, debug errors proactively, and document each
                reasoning step. Has no effect when *use_swarm* is True.
        """
        self._use_swarm = use_swarm
        self._agent_mode = agent_mode
        self._swarm = None

        if use_swarm:
            from engine.swarm import ZIVOSwarm
            mcp = MCPClientManager()
            self._swarm = ZIVOSwarm(mcp_servers=mcp.get_servers())
            return

        # ── Single-agent mode (default, backward-compatible) ─────────────
        with open(prompt_path, "r") as f:
            system_prompt = f.read()

        if agent_mode:
            system_prompt = self._build_agent_mode_prompt(system_prompt)

        mcp = MCPClientManager()
        self.agent = Agent(
            name="ZIVO-AI",
            instructions=system_prompt,
            model="gpt-4o",
            model_settings=ModelSettings(temperature=0.7),
            tools=ALL_TOOLS,
            mcp_servers=mcp.get_servers(),
        )

    @property
    def agent_mode(self) -> bool:
        return self._agent_mode

    @staticmethod
    def _build_agent_mode_prompt(base_prompt: str) -> str:
        """Extend the base system prompt with agentic behaviour instructions."""
        agent_extension = (
            "\n\n## Agent Mode\n"
            "You are operating in autonomous Agent Mode. In this mode you should:\n"
            "1. Explore the existing codebase by listing and reading relevant files before making changes.\n"
            "2. Search the web for up-to-date solutions when needed using the WebSearchTool.\n"
            "3. Proactively debug TypeScript/build errors discovered in generated code.\n"
            "4. Coordinate changes across multiple files in a single response.\n"
            "5. Explain each reasoning step you take in a `steps` array in your JSON response.\n"
        )
        return base_prompt + agent_extension

    def _build_conversation(self, messages: list[dict[str, str]]) -> str:
        """Format full chat history into a single prompt string."""
        return "\n".join(
            f"{m['role'].upper()}: {m['content']}" for m in messages
        )

    def run(self, messages: list[dict[str, str]]):
        """
        Run the agent synchronously with full conversation history.
        Returns a Runner result object with .final_output.
        """
        if self._use_swarm and self._swarm is not None:
            return self._swarm.run(messages)
        conversation = self._build_conversation(messages)
        return Runner.run_sync(self.agent, conversation)

    async def run_streamed(self, messages: list[dict[str, str]]) -> AsyncIterator[str]:
        """
        Run the agent and yield streamed text delta chunks.
        In swarm mode, falls back to a blocking run and yields the full output as one chunk.
        """
        if self._use_swarm and self._swarm is not None:
            result = self._swarm.run(messages)
            yield result.final_output or ""
            return

        conversation = self._build_conversation(messages)
        result = Runner.run_streamed(self.agent, conversation)
        async for event in result.stream_events():
            if event.type == "raw_response_event":
                delta = getattr(event.data, "delta", None)
                if delta:
                    yield delta
