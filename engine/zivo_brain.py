import os
from typing import List, Dict
from dotenv import load_dotenv
from agents import Agent, Runner, ModelSettings
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
        Run the agent with full conversation history.
        Returns a Runner result object with .final_output and .new_messages.
        """
        conversation = self._build_conversation(messages)
        return Runner.run_sync(self.agent, conversation)