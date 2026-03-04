# ZIVO-AI Agents

This document describes all available agents in the ZIVO-AI platform, their responsibilities, and how they interact.

---

## Architecture Overview

ZIVO-AI uses a **Planner-Executor** multi-agent swarm powered by the OpenAI Agents SDK. The `PlannerAgent` receives every user request and routes it to the most appropriate specialist via handoffs.

```
User Request
     │
     ▼
PlannerAgent  ──handoff──►  CodeBuilderAgent   (build apps from scratch)
                        ──►  WebResearchAgent   (research & lookup)
                        ──►  CodeExecutorAgent  (debug & explain code)
                        ──►  DataValidatorAgent (fact-check & validate)
```

For TypeScript-based generation, `OrchestratorV2` runs an autonomous plan → generate → validate → fix loop.

---

## Python Swarm Agents (`engine/swarm.py`)

### PlannerAgent
**Role**: Router/dispatcher — analyzes user intent and hands off to the correct specialist.

**Model**: GPT-4o (temperature: 0.3)

**Routing logic**:
- Build/create/generate request → `CodeBuilderAgent`
- Research/lookup/current events → `WebResearchAgent`
- Debug/explain existing code → `CodeExecutorAgent`
- Fact-check/validate data → `DataValidatorAgent`

**Prompt file**: `prompts/planner_v1.txt`

---

### CodeBuilderAgent
**Role**: Generates complete, multi-file full-stack projects from a single description.

**Model**: GPT-4o (temperature: 0.2)

**Capabilities**:
- Generates frontend + backend + database schema + auth in a single pass
- Produces `package.json`, `.env.example`, Prisma schema, API routes, and all UI components
- Uses Next.js 15 + TypeScript + TailwindCSS + ShadCN + Prisma + Supabase Auth as the default stack

**Tools**: `write_local_file`, `read_local_file`, `list_directory`

**Prompt file**: `prompts/code-builder-agent.txt`

---

### WebResearchAgent
**Role**: Answers questions that require up-to-date information from the web.

**Model**: GPT-4o (temperature: 0.5)

**Capabilities**:
- Current events and news lookup
- Technical documentation research
- Library/framework comparisons
- Fetching current datetime

**Tools**: `get_current_datetime`

**Prompt file**: `prompts/web_research_v1.txt`

---

### CodeExecutorAgent
**Role**: Debugs, explains, and modifies existing code snippets.

**Model**: GPT-4o (temperature: 0.5)

**Capabilities**:
- Reads and analyzes local files
- Debugs errors with step-by-step explanations
- Refactors and optimizes existing code
- Explains complex code patterns

**Tools**: `read_local_file`, `list_directory`

**Prompt file**: `prompts/code_executor_v1.txt`

---

### DataValidatorAgent
**Role**: Validates facts, data consistency, and detects errors in structured data.

**Model**: GPT-4o (temperature: 0.5)

**Capabilities**:
- Cross-checks factual claims
- Validates JSON/CSV/schema consistency
- Detects logical errors in data models
- Verifies API responses

**Tools**: `read_local_file`

**Prompt file**: `prompts/data_validator_v1.txt`

---

## TypeScript Agents (`agents/`)

### OrchestratorV2 (`orchestrator-v2.ts`)
**Role**: Autonomous full-stack builder with a self-correcting build loop.

**Loop**: plan → generate → validate → fix → repeat (up to 8 iterations)

**Key features**:
- Generates complete project files via GPT-4o
- Automatically creates `package.json` if missing from a TypeScript project
- Summarises existing files as context when `existingFiles` are provided
- Passes full project context to the code fixer for cross-file awareness
- Supports both synchronous (`runOrchestratorV2`) and streaming (`runOrchestratorV2Streamed`) modes

**Exports**:
```typescript
runOrchestratorV2(prompt, existingFiles?, maxIterations?): Promise<AgentV2Result>
runOrchestratorV2Streamed(prompt, existingFiles?, maxIterations?): AsyncGenerator<AgentV2Step | { type: "result"; result: AgentV2Result }, void, unknown>
```

---

### ValidatorAgent (`validator.ts`)
**Role**: Static analysis of generated TypeScript/TSX files without a full compiler.

**Checks performed**:
- Missing `package.json` in TypeScript/JavaScript projects
- Missing `app/layout.tsx` for Next.js App Router projects
- Missing `app/page.tsx` (root page)
- Prisma schema without corresponding API routes
- Supabase client usage without environment variable checks
- `useRouter` imported from `next/router` instead of `next/navigation` (App Router)
- Missing imports for `NextResponse`, React hooks
- Implicit `any` types
- `console.log` in production code
- Missing return type annotations on exported functions
- Unresolved TODO/FIXME comments

**Export**:
```typescript
validateFiles(files: Array<{ path: string; content: string }>): ValidationResult
```

---

### CodeFixerAgent (`code-fixer.ts`)
**Role**: Auto-fixes TypeScript/ESLint errors in generated code using GPT-4o.

**Fixes applied**:
- Missing type annotations
- Missing import statements
- React hook dependency arrays
- Async/await patterns
- Unused variable prefixing
- Missing return type annotations
- Removing/replacing `console.log`

**Accepts optional `projectContext`** for cross-file fix awareness.

**Exports**:
```typescript
fixFile(request: FixRequest): Promise<FixResult>
fixFiles(requests: FixRequest[]): Promise<FixResult[]>
```

---

## Prompt Files (`prompts/`)

| File | Used By | Purpose |
|------|---------|---------|
| `system_v1.txt` | `ZivoBrain` (single-agent mode) | Main system identity and stack overview |
| `planner_v1.txt` | `PlannerAgent` | Routing logic for the swarm |
| `code-builder-agent.txt` | `CodeBuilderAgent` | Full-stack project generation |
| `code_executor_v1.txt` | `CodeExecutorAgent` | Code debugging and explanation |
| `data_validator_v1.txt` | `DataValidatorAgent` | Data fact-checking and validation |
| `web_research_v1.txt` | `WebResearchAgent` | Web research and information retrieval |
| `code-builder.ts` | TypeScript UI layer | `CODE_BUILDER_SYSTEM_PROMPT` + plan prompt |
| `website-builder.ts` | TypeScript UI layer | Website builder (SaaS, e-commerce, dashboard, portfolio) |
| `full-stack-builder.ts` | TypeScript UI layer | Full-stack SaaS with tRPC + Supabase |
| `3d-builder.ts` | TypeScript UI layer | Three.js / React Three Fiber 3D scenes |
| `mobile-builder.ts` | TypeScript UI layer | Flutter / React Native / SwiftUI / Compose |
| `update-site.ts` | TypeScript UI layer | Site update/modification prompt |

---

## How to Add a New Agent

1. Create a prompt file in `prompts/` (e.g., `prompts/my-agent-v1.txt`)
2. Instantiate the agent in `engine/swarm.py`:
   ```python
   self.my_agent = Agent(
       name="MyAgent",
       instructions=_load_prompt("prompts/my-agent-v1.txt", "fallback"),
       model="gpt-4o",
       model_settings=ModelSettings(temperature=0.3),
       tools=[CONNECTOR_REGISTRY["read_local_file"]],
   )
   ```
3. Add it to `self.planner_agent`'s `handoffs` list
4. Update `prompts/planner_v1.txt` to describe when to route to the new agent
5. Document it in this README
