# Available Agents in ZIVO-AI

ZIVO-AI ships a **multi-agent system** where each agent is a specialist that can call tools, reason across multiple steps, and retain conversation memory.  
All agents share a common `BaseAgent` base class (`agents/base-agent.ts`) and are coordinated by the `MultiAgentOrchestrator` (`lib/orchestrator.ts`).

---

## Agent Roster

| Agent | Role key | File | Specialty |
|-------|----------|------|-----------|
| **Architect** | `architect` | `agents/architect-agent.ts` | System design, technology selection, ADRs |
| **UI** | `ui` | `agents/ui-agent.ts` | React/Next.js components, Tailwind CSS, accessibility |
| **Backend** | `backend` | `agents/backend-agent.ts` | API routes, auth, business logic, validation |
| **Database** | `database` | `agents/database-agent.ts` | Schema design, Prisma/Drizzle, query optimisation |
| **Security** | `security` | `agents/security-agent.ts` | OWASP Top-10, vulnerability review, secure patterns |
| **Performance** | `performance` | `agents/performance-agent.ts` | Core Web Vitals, caching, bundle & query tuning |
| **DevOps** | `devops` | `agents/devops-agent.ts` | CI/CD, Docker, Terraform, deployment strategies |
| **Code Review** | `code-review` | `agents/code-review-agent.ts` | PR review, code quality, refactoring suggestions |

---

## Architecture

```
agents/
  base-agent.ts          – BaseAgent class: tool-calling, multi-step reasoning, memory
  architect-agent.ts
  ui-agent.ts
  backend-agent.ts
  database-agent.ts
  security-agent.ts
  performance-agent.ts
  devops-agent.ts
  code-review-agent.ts

lib/
  tools.ts               – Tool definitions: read_file, write_file, diff_code, analyze_code …
  memory.ts              – ProjectMemoryManager: per-project context, decisions, generated files
  orchestrator.ts        – MultiAgentOrchestrator: routing, pipelines, auto-role detection

app/api/agent/route.ts   – HTTP API (POST: run agent / pipeline, GET: list agents & memory)
```

---

## HTTP API – `POST /api/agent`

### Single task (auto-detects role if omitted)

```json
{
  "task": "Design a REST API for user authentication with JWT",
  "role": "backend",          // optional – omit for auto-detection
  "projectId": "my-project",  // optional – enables memory persistence
  "context": {}               // optional – extra key/value pairs
}
```

**Response**

```json
{
  "ok": true,
  "role": "backend",
  "content": "...",
  "toolCalls": [],
  "steps": 2,
  "projectId": "my-project",
  "memorySnapshot": { "decisions": [], "files": {}, "context": {} }
}
```

### Pipeline (multi-agent, sequential)

```json
{
  "projectId": "my-project",
  "pipeline": [
    { "task": "Design overall architecture for a SaaS dashboard", "role": "architect" },
    { "task": "Generate the main dashboard React component",      "role": "ui" },
    { "task": "Write the /api/dashboard data endpoint",          "role": "backend" }
  ]
}
```

**Response**

```json
{
  "ok": true,
  "projectId": "my-project",
  "results": [ { "role": "architect", "content": "..." }, ... ]
}
```

---

## HTTP API – `GET /api/agent`

List all registered agents and active project IDs:

```
GET /api/agent
```

Retrieve the memory snapshot for a specific project:

```
GET /api/agent?projectId=my-project
```

---

## Available Tools

| Tool | Description |
|------|-------------|
| `read_file` | Read a project file by relative path |
| `write_file` | Write / overwrite a file (creates parent dirs) |
| `list_files` | List files in a directory |
| `diff_code` | Line-by-line diff between two code strings |
| `analyze_code` | Structural metrics: lines, functions, imports, TODOs |
| `generate_structure` | Propose a file/folder skeleton for a project type |

---

## Using Agents Programmatically

```typescript
import { orchestrator } from "@/lib/orchestrator";

// Single agent call
const result = await orchestrator.route({
  task: "Review this code for security issues",
  role: "security",
  projectId: "proj-abc",
});

// Multi-agent pipeline
const pipeline = await orchestrator.runPipeline(
  [
    { task: "Design database schema for a blog", role: "database" },
    { task: "Review the schema for performance",  role: "performance" },
  ],
  "proj-abc"
);
```