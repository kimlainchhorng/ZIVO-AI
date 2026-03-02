import { ArchitectAgent } from "./architect-agent";
import { UIAgent } from "./ui-agent";
import { BackendAgent } from "./backend-agent";
import { QAAgent } from "./qa-agent";
import { DevOpsAgent } from "./devops-agent";
import type { AgentMessage, AgentTask, AgentType } from "../lib/types";

export class AgentCoordinator {
  private agents: Record<AgentType, ArchitectAgent | UIAgent | BackendAgent | QAAgent | DevOpsAgent>;

  constructor() {
    this.agents = {
      architect: new ArchitectAgent(),
      ui: new UIAgent(),
      backend: new BackendAgent(),
      qa: new QAAgent(),
      devops: new DevOpsAgent(),
    };
  }

  async runAgent(
    type: AgentType,
    prompt: string,
    context?: Record<string, unknown>
  ): Promise<AgentMessage> {
    const agent = this.agents[type];
    return agent.run(prompt, context);
  }

  /** Run multiple agents in parallel and synthesize results */
  async runMultiAgent(
    tasks: Array<{ type: AgentType; prompt: string; context?: Record<string, unknown> }>
  ): Promise<AgentMessage[]> {
    return Promise.all(
      tasks.map(({ type, prompt, context }) => this.runAgent(type, prompt, context))
    );
  }

  /** Run a full project build: architect plans, others execute */
  async buildProject(description: string, projectContext?: Record<string, unknown>): Promise<{
    plan: AgentMessage;
    ui: AgentMessage;
    backend: AgentMessage;
    tests: AgentMessage;
    devops: AgentMessage;
  }> {
    // Step 1: Architect creates the plan
    const plan = await this.agents.architect.run(
      `Create a detailed architecture plan for:\n${description}`,
      projectContext
    );

    const sharedContext = {
      ...projectContext,
      architectPlan: plan.content,
    };

    // Step 2: Run UI, Backend, QA, DevOps in parallel
    const [ui, backend, tests, devops] = await Promise.all([
      this.agents.ui.run(`Based on the architecture plan, generate the key UI components:\n${plan.content}`, sharedContext),
      this.agents.backend.run(`Based on the architecture plan, generate API routes and DB schema:\n${plan.content}`, sharedContext),
      this.agents.qa.run(`Based on the architecture plan, generate a testing strategy:\n${plan.content}`, sharedContext),
      this.agents.devops.run(`Based on the architecture plan, set up CI/CD and deployment:\n${plan.content}`, sharedContext),
    ]);

    return { plan, ui, backend, tests, devops };
  }

  buildTask(
    type: AgentType,
    prompt: string,
    projectId: string,
    context: Record<string, unknown> = {}
  ): Omit<AgentTask, "result"> {
    return {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      project_id: projectId,
      type,
      prompt,
      context,
      status: "pending",
      created_at: new Date().toISOString(),
    };
  }
}
