import { runPass1Plan, type ProjectBlueprint } from "./passes/pass1-plan";
import { runPass2Generate } from "./passes/pass2-generate";
import { runPass3ValidateFix, type Pass3Result } from "./passes/pass3-validate-fix";
import type { AIOutput } from "./schema";

export interface MultiPassResult {
  blueprint: ProjectBlueprint;
  output: AIOutput;
  pass3Result: Pass3Result;
  totalFiles: number;
  passLog: string[];
}

/**
 * Orchestrates a 3-pass AI generation pipeline:
 *   Pass 1 (Plan)     — AI architect produces a ProjectBlueprint with pages, routes, components, and DB models.
 *   Pass 2 (Generate) — AI developer generates all files guided by the blueprint.
 *   Pass 3 (Validate) — Missing routes/files are detected and auto-generated; output is validated against min file count.
 *
 * @param prompt        The user's app description.
 * @param existingFiles Existing project files for iterative/update builds.
 * @param model         OpenAI model to use (defaults to "gpt-4o").
 * @returns             Blueprint, final AIOutput, pass-3 result metadata, total file count, and a progress log.
 */
export async function runMultiPassGeneration(
  prompt: string,
  existingFiles: { path: string; content: string }[] = [],
  model = "gpt-4o"
): Promise<MultiPassResult> {
  const passLog: string[] = [];

  // Pass 1: Plan
  passLog.push("Pass 1: Planning architecture...");
  const blueprint = await runPass1Plan(prompt, model);
  passLog.push(`Pass 1 complete: ${blueprint.pages.length} pages, ${blueprint.apiRoutes.length} API routes planned`);

  // Pass 2: Generate
  passLog.push("Pass 2: Generating files...");
  const output = await runPass2Generate(prompt, blueprint, existingFiles, model);
  passLog.push(`Pass 2 complete: ${output.files.length} files generated`);

  // Pass 3: Validate + Fix
  passLog.push("Pass 3: Validating and fixing...");
  const pass3Result = await runPass3ValidateFix(output, blueprint, prompt, model);
  passLog.push(`Pass 3 complete: ${pass3Result.fixesApplied.length} fixes applied`);

  return {
    blueprint,
    output: pass3Result.output,
    pass3Result,
    totalFiles: pass3Result.output.files.length,
    passLog,
  };
}
