// Multi-step reasoning chain for complex generation tasks.
// Provides dependency graph, validation, rollback, and progress tracking.

export type StepStatus = "pending" | "in_progress" | "completed" | "failed" | "skipped";

export interface ReasoningStep {
  id: string;
  name: string;
  description: string;
  dependsOn: string[]; // ids of prerequisite steps
  status: StepStatus;
  result?: unknown;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  alternatives?: string[];
}

export interface ReasoningChain {
  id: string;
  projectId: string;
  goal: string;
  steps: ReasoningStep[];
  currentStepId?: string;
  overallStatus: "pending" | "in_progress" | "completed" | "failed";
  createdAt: string;
  updatedAt: string;
}

// ── In-memory store ──────────────────────────────────────────────────────────

const chains = new Map<string, ReasoningChain>();

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── Create a reasoning chain ─────────────────────────────────────────────────

export function createReasoningChain(
  projectId: string,
  goal: string,
  steps: Omit<ReasoningStep, "status">[]
): ReasoningChain {
  const id = generateId();
  const now = new Date().toISOString();
  const chain: ReasoningChain = {
    id,
    projectId,
    goal,
    steps: steps.map((s, idx) => ({
      ...s,
      id: s.id ?? `step-${idx}`,
      status: "pending",
    })),
    overallStatus: "pending",
    createdAt: now,
    updatedAt: now,
  };
  chains.set(id, chain);
  return chain;
}

// ── Progress tracking ────────────────────────────────────────────────────────

export function getReasoningChain(id: string): ReasoningChain | undefined {
  return chains.get(id);
}

export function listReasoningChains(projectId: string): ReasoningChain[] {
  return [...chains.values()].filter((c) => c.projectId === projectId);
}

export function startStep(chainId: string, stepId: string): ReasoningChain | null {
  const chain = chains.get(chainId);
  if (!chain) return null;

  const step = chain.steps.find((s) => s.id === stepId);
  if (!step) return null;

  // Verify all dependencies are completed
  const unmet = step.dependsOn.filter((depId) => {
    const dep = chain.steps.find((s) => s.id === depId);
    return !dep || dep.status !== "completed";
  });

  if (unmet.length > 0) {
    step.status = "failed";
    step.error = `Unmet dependencies: ${unmet.join(", ")}`;
  } else {
    step.status = "in_progress";
    step.startedAt = new Date().toISOString();
    chain.currentStepId = stepId;
    chain.overallStatus = "in_progress";
  }

  chain.updatedAt = new Date().toISOString();
  chains.set(chainId, chain);
  return chain;
}

export function completeStep(
  chainId: string,
  stepId: string,
  result: unknown
): ReasoningChain | null {
  const chain = chains.get(chainId);
  if (!chain) return null;

  const step = chain.steps.find((s) => s.id === stepId);
  if (!step) return null;

  step.status = "completed";
  step.result = result;
  step.completedAt = new Date().toISOString();

  const allDone = chain.steps.every((s) => s.status === "completed" || s.status === "skipped");
  const anyFailed = chain.steps.some((s) => s.status === "failed");
  chain.overallStatus = anyFailed ? "failed" : allDone ? "completed" : "in_progress";
  chain.updatedAt = new Date().toISOString();

  chains.set(chainId, chain);
  return chain;
}

export function failStep(
  chainId: string,
  stepId: string,
  error: string
): ReasoningChain | null {
  const chain = chains.get(chainId);
  if (!chain) return null;

  const step = chain.steps.find((s) => s.id === stepId);
  if (!step) return null;

  step.status = "failed";
  step.error = error;
  step.completedAt = new Date().toISOString();
  chain.overallStatus = "failed";
  chain.updatedAt = new Date().toISOString();

  chains.set(chainId, chain);
  return chain;
}

// ── Rollback ─────────────────────────────────────────────────────────────────

export function rollbackChain(chainId: string): ReasoningChain | null {
  const chain = chains.get(chainId);
  if (!chain) return null;

  chain.steps.forEach((step) => {
    step.status = "pending";
    delete step.result;
    delete step.error;
    delete step.startedAt;
    delete step.completedAt;
  });
  chain.overallStatus = "pending";
  chain.currentStepId = undefined;
  chain.updatedAt = new Date().toISOString();

  chains.set(chainId, chain);
  return chain;
}

// ── Build reasoning chain from a high-level goal ─────────────────────────────

export function buildDefaultChain(projectId: string, goal: string): ReasoningChain {
  return createReasoningChain(projectId, goal, [
    {
      id: "analyze",
      name: "Analyse requirements",
      description: "Parse the goal and identify required components",
      dependsOn: [],
      alternatives: ["Ask for clarification", "Use defaults"],
    },
    {
      id: "architect",
      name: "Design architecture",
      description: "Choose tech stack and design system structure",
      dependsOn: ["analyze"],
    },
    {
      id: "database",
      name: "Design database schema",
      description: "Create tables, relationships, and RLS policies",
      dependsOn: ["architect"],
    },
    {
      id: "backend",
      name: "Generate backend/API",
      description: "Create API routes and business logic",
      dependsOn: ["database"],
    },
    {
      id: "frontend",
      name: "Generate frontend",
      description: "Create React components and pages",
      dependsOn: ["backend"],
    },
    {
      id: "security",
      name: "Security review",
      description: "Audit generated code for vulnerabilities",
      dependsOn: ["backend", "frontend"],
    },
    {
      id: "review",
      name: "Code review",
      description: "Check code quality and best practices",
      dependsOn: ["frontend", "backend"],
    },
  ]);
}
