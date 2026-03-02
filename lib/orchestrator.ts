import type { AgentResponse } from "../agents/base-agent";
import BaseAgent from "../agents/base-agent";
import ArchitectAgent from "../agents/architect-agent";
import UIAgent from "../agents/ui-agent";
import BackendAgent from "../agents/backend-agent";
import DatabaseAgent from "../agents/database-agent";
import SecurityAgent from "../agents/security-agent";
import PerformanceAgent from "../agents/performance-agent";
import DevOpsAgent from "../agents/devops-agent";
import CodeReviewAgent from "../agents/code-review-agent";
import { projectMemory } from "./memory";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AgentRole =
  | "architect"
  | "ui"
  | "backend"
  | "database"
  | "security"
  | "performance"
  | "devops"
  | "code-review";

export interface OrchestratorRequest {
  task: string;
  role?: AgentRole;
  projectId?: string;
  context?: Record<string, unknown>;
}

export interface OrchestratorResponse {
  role: string;
  content: string;
  toolCalls?: AgentResponse["toolCalls"];
  steps?: number;
  projectId?: string;
  memorySnapshot?: ReturnType<typeof projectMemory.snapshot>;
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export class MultiAgentOrchestrator {
  private agents: Map<AgentRole, BaseAgent>;

  constructor() {
    this.agents = new Map<AgentRole, BaseAgent>([
      ["architect", new ArchitectAgent()],
      ["ui", new UIAgent()],
      ["backend", new BackendAgent()],
      ["database", new DatabaseAgent()],
      ["security", new SecurityAgent()],
      ["performance", new PerformanceAgent()],
      ["devops", new DevOpsAgent()],
      ["code-review", new CodeReviewAgent()],
    ]);
  }

  /**
   * Route a single task to the appropriate agent (or auto-detect the role).
   */
  async route(req: OrchestratorRequest): Promise<OrchestratorResponse> {
    const role = req.role ?? this.detectRole(req.task);
    const agent = this.agents.get(role);

    if (!agent) {
      throw new Error(`Unknown agent role: ${role}`);
    }

    // Build context from project memory if a projectId is supplied
    let context = req.context ?? {};
    if (req.projectId) {
      const mem = projectMemory.snapshot(req.projectId);
      if (mem) {
        context = { ...context, projectMemory: mem };
      }
    }

    const result = await agent.run(req.task, context);

    // Persist any decisions extracted from the response back into memory
    if (req.projectId) {
      projectMemory.addDecision(
        req.projectId,
        `[${role}] ${req.task.slice(0, 120)}`
      );
    }

    return {
      role,
      content: result.content,
      toolCalls: result.toolCalls,
      steps: result.steps,
      projectId: req.projectId,
      memorySnapshot: req.projectId
        ? projectMemory.snapshot(req.projectId)
        : undefined,
    };
  }

  /**
   * Run a sequence of tasks, passing each agent's response as context for the next.
   */
  async runPipeline(
    tasks: Array<{ task: string; role: AgentRole }>,
    projectId: string
  ): Promise<OrchestratorResponse[]> {
    const results: OrchestratorResponse[] = [];
    let previousOutput = "";

    for (const step of tasks) {
      const context: Record<string, unknown> = {};
      if (previousOutput) {
        context.previousAgentOutput = previousOutput;
      }

      const result = await this.route({
        task: step.task,
        role: step.role,
        projectId,
        context,
      });

      results.push(result);
      previousOutput = result.content;
    }

    return results;
  }

  /**
   * Simple heuristic to pick the best agent for a task based on keywords.
   */
  private detectRole(task: string): AgentRole {
    const lower = task.toLowerCase();

    if (/(architect|system design|service|microservice|adr|stack selection)/.test(lower)) {
      return "architect";
    }
    if (/(ui|component|layout|css|tailwind|frontend|react|next\.?js page|html|design)/.test(lower)) {
      return "ui";
    }
    if (/(api|endpoint|route|server|auth|backend|middleware|controller|service layer)/.test(lower)) {
      return "backend";
    }
    if (/(database|schema|migration|sql|query|prisma|drizzle|mongo|postgres)/.test(lower)) {
      return "database";
    }
    if (/(security|vulnerability|owasp|injection|xss|csrf|auth|permission|secret)/.test(lower)) {
      return "security";
    }
    if (/(performance|optimis|bottleneck|cache|bundle|lazy load|vitals|speed)/.test(lower)) {
      return "performance";
    }
    if (/(deploy|docker|ci\/cd|github actions|pipeline|kubernetes|terraform|infra)/.test(lower)) {
      return "devops";
    }
    if (/(review|diff|code quality|refactor|best practice|clean code|test coverage)/.test(lower)) {
      return "code-review";
    }

    // Default to architect for ambiguous tasks
    return "architect";
  }

  /** Clear memory for a specific agent role. */
  clearAgentMemory(role: AgentRole): void {
    this.agents.get(role)?.clearMemory();
  }

  /** Clear memory for all agents. */
  clearAllMemory(): void {
    this.agents.forEach((agent) => agent.clearMemory());
  }

  /** Return names and roles of all registered agents. */
  listAgents(): Array<{ name: string; role: string }> {
    return Array.from(this.agents.values()).map((a) => ({
      name: a.name,
      role: a.role,
    }));
  }
}

/** Singleton orchestrator shared across requests within the same process */
export const orchestrator = new MultiAgentOrchestrator();
