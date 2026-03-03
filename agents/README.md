# ZIVO-AI Agent Architecture

This document describes the multi-agent system powering ZIVO-AI's backend.

## Agent Roles

### 1. ZIVO-AI (Orchestrator)
- **Entry point** for all user requests.
- Handles simple requests (greetings, quick facts) directly.
- Routes complex requests (research, analysis, multi-step tasks, file operations) to the **Planner**.
- Can also route directly to the **Executor** for tasks that don't need planning.
- Tools: none (delegates entirely to specialist agents).

### 2. ZIVO-Planner
- Receives complex requests from the Orchestrator.
- Produces a **numbered action plan** — which tools to call, in which order, and why.
- Does NOT answer the user directly.
- Prompt file: `prompts/planner_v1.txt`
- Tools: `get_current_datetime`, `list_directory` (lightweight context only).
- Hands off to → **ZIVO-Executor**.

### 3. ZIVO-Executor
- Receives the action plan from the Planner.
- Executes each step using all available tools:
  - `web_search` — DuckDuckGo Instant Answers for current facts.
  - `deep_research` — multi-angle deep research with cross-referenced sources.
  - `read_local_file` / `list_directory` — local filesystem access.
  - `get_current_datetime` — temporal context.
- Compiles a comprehensive, structured response.
- Prompt file: `prompts/executor_v1.txt`
- Hands off to → **ZIVO-Validator**.

### 4. ZIVO-Validator
- Receives the compiled response from the Executor.
- Checks for factual inconsistencies, completeness, and clarity.
- Marks uncertain claims with `[Unverified]`.
- Appends a confidence rating: **HIGH / MEDIUM / LOW**.
- Returns the final polished response to the user.
- Prompt file: `prompts/validator_v1.txt`
- Terminal node — no further handoffs.

## Handoff Graph

```
User Input
    │
    ▼
ZIVO-AI (Orchestrator)
    │
    ├──► (simple) ─── Answer directly
    │
    └──► (complex) ──► ZIVO-Planner
                            │
                            ▼
                       ZIVO-Executor
                            │
                            ▼
                       ZIVO-Validator
                            │
                            ▼
                       Final Response
```

## Extending the System

To add a new specialist agent:

1. Define a new `Agent(...)` instance in `engine/zivo_brain.py` inside `_build_agent_network()`.
2. Add the appropriate tools from `engine/tools.py` (or register new tools there).
3. Wire it into the graph with `handoffs=[handoff(<next_agent>)]`.
4. Add the new agent as a handoff target on the Orchestrator or an existing agent.
5. Optionally create a prompt file in `prompts/` for runtime swapping.

## Tool Registry

All tools are defined in `engine/tools.py`:

| Tool | Description | Used by |
|------|-------------|---------|
| `get_current_datetime` | Returns current date/time | Planner, Validator |
| `list_directory` | Lists files in a directory | Planner, Executor |
| `read_local_file` | Reads a local file | Executor, Validator |
| `web_search` | DuckDuckGo Instant Answer search | Executor |
| `deep_research` | Multi-angle research with cross-referencing | Executor |
