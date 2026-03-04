// lib/workflow-engine.ts — Workflow execution engine

// ─── Types ────────────────────────────────────────────────────────────────────

export type WorkflowStepType = "generate" | "validate" | "fix" | "test" | "deploy";

export interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  config: Record<string, unknown>;
}

export interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  trigger?: "manual" | "push" | "schedule";
}

export interface WorkflowInput {
  projectId?: string;
  files?: Array<{ path: string; content: string }>;
  prompt?: string;
  [key: string]: unknown;
}

export type WorkflowEventType = "step_start" | "step_complete" | "step_error" | "workflow_complete" | "workflow_error";

export interface WorkflowEvent {
  type: WorkflowEventType;
  stepId?: string;
  stepType?: WorkflowStepType;
  data?: unknown;
  error?: string;
  timestamp: string;
}

// ─── In-memory workflow store ─────────────────────────────────────────────────

const workflowStore = new Map<string, Workflow>();

/**
 * Persists a workflow definition in-memory.
 */
export function saveWorkflow(workflow: Workflow): void {
  workflowStore.set(workflow.id, workflow);
}

/**
 * Returns all stored workflows.
 */
export function listWorkflows(): Workflow[] {
  return Array.from(workflowStore.values());
}

/**
 * Returns a workflow by ID.
 */
export function getWorkflow(id: string): Workflow | undefined {
  return workflowStore.get(id);
}

// ─── Execution engine ─────────────────────────────────────────────────────────

/**
 * Executes a workflow step-by-step, yielding progress events as an async generator.
 */
export async function* executeWorkflow(
  workflow: Workflow,
  input: WorkflowInput
): AsyncGenerator<WorkflowEvent> {
  for (const step of workflow.steps) {
    yield {
      type: "step_start",
      stepId: step.id,
      stepType: step.type,
      timestamp: new Date().toISOString(),
    };

    try {
      const result = await executeStep(step, input);
      yield {
        type: "step_complete",
        stepId: step.id,
        stepType: step.type,
        data: result,
        timestamp: new Date().toISOString(),
      };
      // Pass step result as input to next step
      if (result && typeof result === "object") {
        Object.assign(input, result);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      yield {
        type: "step_error",
        stepId: step.id,
        stepType: step.type,
        error: errorMsg,
        timestamp: new Date().toISOString(),
      };
      yield {
        type: "workflow_error",
        error: `Step ${step.id} failed: ${errorMsg}`,
        timestamp: new Date().toISOString(),
      };
      return;
    }
  }

  yield {
    type: "workflow_complete",
    data: { stepsCompleted: workflow.steps.length },
    timestamp: new Date().toISOString(),
  };
}

async function executeStep(
  step: WorkflowStep,
  _input: WorkflowInput
): Promise<Record<string, unknown>> {
  // Simulated step execution — in production, each type dispatches to the appropriate service
  switch (step.type) {
    case "generate":
      return { status: "generated", files: [] };
    case "validate":
      return { status: "validated", valid: true, issues: [] };
    case "fix":
      return { status: "fixed", appliedFixes: [] };
    case "test":
      return { status: "tested", passed: 0, failed: 0 };
    case "deploy":
      return { status: "deployed", url: null };
    default:
      return { status: "skipped" };
  }
}
