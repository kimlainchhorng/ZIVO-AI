import os
from typing import List, Dict, AsyncIterator
from dotenv import load_dotenv
from agents import Agent, Runner, ModelSettings, RunEvent
from engine.tools import ALL_TOOLS

load_dotenv()


class ZivoBrain:
    """
    ZIVO Agent Brain using the OpenAI Agents SDK Agent Loop.

    The Agent Loop handles:
      - Iterative tool calling until the task is complete
      - Automatic result analysis between tool calls
      - Graceful termination when the agent produces a final answer
    """

    def __init__(self, prompt_path: str = "prompts/system_v1.txt"):
        with open(prompt_path, "r") as f:
            system_prompt = f.read()

        self.agent = Agent(
            name="ZIVO-AI",
            instructions=system_prompt,
            model="gpt-4o",
            model_settings=ModelSettings(temperature=0.7),
            tools=ALL_TOOLS,
        )

    def _build_conversation(self, messages: List[Dict[str, str]]) -> str:
        """Convert chat history to a single conversation string for the agent."""
        return "\n".join(
            f"{m['role'].upper()}: {m['content']}" for m in messages
        )

    def run(self, messages: List[Dict[str, str]]):
        """
        Run the agent loop synchronously.
        Returns a RunResult with .final_output and .new_messages.
        """
        conversation = self._build_conversation(messages)
        return Runner.run_sync(self.agent, conversation)

    async def run_streamed(self, messages: List[Dict[str, str]]) -> AsyncIterator[RunEvent]:
        """
        Run the agent loop with streaming events.
        Yields RunEvent objects so the UI can display real-time tool traces.
        """
        conversation = self._build_conversation(messages)
        async for event in Runner.run_streamed(self.agent, conversation):
            yield event