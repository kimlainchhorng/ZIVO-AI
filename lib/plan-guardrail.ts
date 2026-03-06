/**
 * lib/plan-guardrail.ts
 *
 * Centralized guardrail that validates a list of files being modified
 * against the planned_files declared in an approved change plan.
 *
 * Usage:
 *   const result = checkFilesAgainstPlan(changedFiles, plan.plan_json.planned_files);
 *   if (!result.allowed) { ... reject ... }
 */

export interface GuardrailResult {
  /** True when every changed file is within the planned scope. */
  allowed: boolean;
  /** Files that were not declared in planned_files. */
  unplanned: string[];
  /** Human-readable error message when allowed === false. */
  message: string;
}

/**
 * Checks whether all files in `changedFiles` are declared in `plannedFiles`.
 *
 * @param changedFiles  - File paths that an AI patch wants to touch.
 * @param plannedFiles  - File paths declared in the approved plan.
 * @returns GuardrailResult
 */
export function checkFilesAgainstPlan(
  changedFiles: string[],
  plannedFiles: string[]
): GuardrailResult {
  const planned = new Set(plannedFiles.map((p) => normalizePath(p)));
  const unplanned = changedFiles
    .map((f) => normalizePath(f))
    .filter((f) => !planned.has(f));

  if (unplanned.length === 0) {
    return { allowed: true, unplanned: [], message: "" };
  }

  const list = unplanned.map((f) => `  • ${f}`).join("\n");
  return {
    allowed: false,
    unplanned,
    message:
      `The following files are outside the approved plan scope and cannot be modified:\n${list}\n\n` +
      `Please generate a new plan that includes these files and obtain approval before applying changes.`,
  };
}

/** Normalize a file path to a canonical form for comparison. */
function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+$/, "");
}
