import type { WorkflowRun } from "./execute/route";

// Shared in-memory store for workflow runs (max 50 entries)
export const workflowRuns: WorkflowRun[] = [];

export function addRun(run: WorkflowRun): void {
  workflowRuns.unshift(run);
  if (workflowRuns.length > 50) {
    workflowRuns.splice(50);
  }
}
