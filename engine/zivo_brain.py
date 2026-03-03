import os
from typing import List, Dict
from dotenv import load_dotenv
from agents import Agent, Runner, ModelSettings, handoff

from engine.tools import PLANNER_TOOLS, EXECUTOR_TOOLS, VALIDATOR_TOOLS

load_dotenv()


# ---------------------------------------------------------------------------
# System prompts for each role
# ---------------------------------------------------------------------------

PLANNER_PROMPT = """You are the ZIVO Planner Agent.
Your ONLY job is to analyze the user's request and produce a structured action plan.
Output a numbered list of steps the Executor should take to fulfill the request.
Be specific about which tools (web_search, deep_research, read_local_file, list_directory, get_current_datetime) to call and why.
Do NOT attempt to answer the user directly. Do NOT call tools yourself (except list_directory or get_current_datetime for context).
After producing the plan, hand off to the Executor Agent.
"""

EXECUTOR_PROMPT = """You are the ZIVO Executor Agent.
You receive a numbered action plan from the Planner.
Execute each step in order using the available tools.
Call web_search for current facts, deep_research for comprehensive analysis, read_local_file for disk files, etc.
Collect all results and compile a comprehensive, well-structured response.
After completing all steps, hand off to the Validator Agent with your compiled response.
"""

VALIDATOR_PROMPT = """You are the ZIVO Validator Agent.
You receive a compiled response from the Executor.
Your job is to:
1. Check for factual inconsistencies or contradictions in the response.
2. Ensure the response fully addresses the original user request.
3. Flag any uncertain claims with "[Unverified]" markers.
4. Remove redundant content and improve clarity.
5. Add a brief confidence assessment at the end: HIGH / MEDIUM / LOW.
Return the final, polished response to the user. Do NOT hand off further.
"""

ORCHESTRATOR_PROMPT = """You are ZIVO-AI, a high-performance multi-agent personal assistant built for the 2026 tech stack.
You coordinate a team of specialized agents: Planner, Executor, and Validator.

For SIMPLE requests (greetings, quick facts, basic questions), answer directly without routing.
For COMPLEX requests (research, analysis, multi-step tasks, file operations), route to the Planner first.

Always be concise, accurate, and agent-first in your responses.
"""


# ---------------------------------------------------------------------------
# Build the agent network
# ---------------------------------------------------------------------------

def _build_agent_network() -> Agent:
    """
    Build and wire the multi-agent network using OpenAI Agents SDK handoffs.
    Returns the Orchestrator (entry-point) agent.
    """

    # 1. Validator — terminal node, no handoffs out
    validator = Agent(
        name="ZIVO-Validator",
        instructions=VALIDATOR_PROMPT,
        model="gpt-4o",
        model_settings=ModelSettings(temperature=0.3),
        tools=VALIDATOR_TOOLS,
    )

    # 2. Executor — hands off to Validator when done
    executor = Agent(
        name="ZIVO-Executor",
        instructions=EXECUTOR_PROMPT,
        model="gpt-4o",
        model_settings=ModelSettings(temperature=0.5),
        tools=EXECUTOR_TOOLS,
        handoffs=[handoff(validator)],
    )

    # 3. Planner — hands off to Executor after planning
    planner = Agent(
        name="ZIVO-Planner",
        instructions=PLANNER_PROMPT,
        model="gpt-4o",
        model_settings=ModelSettings(temperature=0.2),
        tools=PLANNER_TOOLS,
        handoffs=[handoff(executor)],
    )

    # 4. Orchestrator — entry point, routes simple vs complex
    orchestrator = Agent(
        name="ZIVO-AI",
        instructions=ORCHESTRATOR_PROMPT,
        model="gpt-4o",
        model_settings=ModelSettings(temperature=0.7),
        tools=[],  # Orchestrator itself uses no tools — it delegates
        handoffs=[handoff(planner), handoff(executor)],
    )

    return orchestrator


# ---------------------------------------------------------------------------
# ZivoBrain — public interface
# ---------------------------------------------------------------------------

class ZivoBrain:
    def __init__(self):
        self.orchestrator = _build_agent_network()

    def _build_conversation(self, messages: List[Dict[str, str]]) -> str:
        """Format full chat history into a single prompt string."""
        return "\n".join(
            f"{m['role'].upper()}: {m['content']}" for m in messages
        )

    def run(self, messages: List[Dict[str, str]]):
        """
        Run the multi-agent pipeline with the full conversation history.
        Returns a Runner result object with .final_output and .new_messages.
        The pipeline: Orchestrator → [Planner →] Executor → Validator
        """
        conversation = self._build_conversation(messages)
        return Runner.run_sync(self.orchestrator, conversation)
