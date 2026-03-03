import os
from typing import List, Dict, AsyncIterator
from dotenv import load_dotenv
from agents import Agent, Runner, ModelSettings, RunEvent
from engine.tools import ALL_TOOLS

load_dotenv()


class ZivoBrain:
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
        """Format full chat history into a single prompt string."""
        return "\n".join(
            f"{m['role'].upper()}: {m['content']}" for m in messages
        )

    def run(self, messages: List[Dict[str, str]]):
        """
        Run the agent synchronously with full conversation history.
        Returns a Runner result object with .final_output.
        """
        conversation = self._build_conversation(messages)
        return Runner.run_sync(self.agent, conversation)

    async def run_streamed(self, messages: List[Dict[str, str]]) -> AsyncIterator[str]:
        """
        Run the agent and yield streamed text delta chunks.
        Use this for real-time output in Streamlit via st.write_stream.
        """
        conversation = self._build_conversation(messages)
        result = Runner.run_streamed(self.agent, conversation)
        async for event in result.stream_events():
            if event.type == "raw_response_event":
                delta = getattr(event.data, "delta", None)
                if delta:
                    yield delta
