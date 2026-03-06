// lib/ai/fix-loop.ts — Run & Verify + Fix Loop

import { validateFiles } from "@/agents/validator";

export interface BuildError {
  file?: string;
  line?: number;
  message: string;
  type: "typescript" | "eslint" | "runtime" | "missing-import";
}

export interface BuildWarning {
  file?: string;
  line?: number;
  message: string;
}

export interface BuildResult {
  success: boolean;
  errors: BuildError[];
  warnings: BuildWarning[];
  logs: string[];
}

export interface FixLoopResult {
  success: boolean;
  iterations: number;
  finalFiles: { path: string; content: string }[];
  buildHistory: BuildResult[];
}

function validationToBuildResult(
  files: { path: string; content: string }[]
): BuildResult {
  const result = validateFiles(files);
  const errors: BuildError[] = result.issues
    .filter((i) => i.type === "error")
    .map((i) => ({
      file: i.file,
      line: i.line,
      message: i.message,
      type: i.rule?.includes("import") ? "missing-import" : "typescript",
    }));
  const warnings: BuildWarning[] = result.issues
    .filter((i) => i.type === "warning")
    .map((i) => ({ file: i.file, line: i.line, message: i.message }));

  return {
    success: result.valid,
    errors,
    warnings,
    logs: [result.summary],
  };
}

export async function runFixLoop(
  files: { path: string; content: string }[],
  maxIterations = 3,
  onProgress?: (iteration: number, errors: BuildError[]) => void
): Promise<FixLoopResult> {
  const buildHistory: BuildResult[] = [];
  const currentFiles = [...files];

  for (let i = 0; i < maxIterations; i++) {
    const buildResult = validationToBuildResult(currentFiles);
    buildHistory.push(buildResult);

    if (onProgress) {
      onProgress(i + 1, buildResult.errors);
    }

    if (buildResult.success || buildResult.errors.length === 0) {
      return {
        success: true,
        iterations: i + 1,
        finalFiles: currentFiles,
        buildHistory,
      };
    }

    // Simple fix: mark iteration as attempted, no actual rewrite in this layer
    // The actual fixing is done by agents/code-fixer.ts upstream
    if (i === maxIterations - 1) break;
  }

  const lastResult = buildHistory[buildHistory.length - 1];
  return {
    success: lastResult?.success ?? false,
    iterations: maxIterations,
    finalFiles: currentFiles,
    buildHistory,
  };
}
