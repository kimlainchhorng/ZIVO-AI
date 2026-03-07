import { validateFiles, type ValidationResult } from "@/agents/validator";
import { parseBuildErrors, groupErrorsByFile, type ParsedBuildError } from "./error-parser";
import { autoFixFiles } from "./auto-fix";

export interface BuildRunResult {
  success: boolean;
  errors: ParsedBuildError[];
  warnings: ParsedBuildError[];
  logs: string[];
  duration: number;
  iteration: number;
}

export interface BuildLoopResult {
  success: boolean;
  finalFiles: { path: string; content: string }[];
  iterations: BuildRunResult[];
  totalFixes: number;
  usedBroadFix: boolean;
}

function validationToBuildErrors(result: ValidationResult): ParsedBuildError[] {
  return result.issues.map(issue => ({
    file: issue.file,
    line: issue.line,
    message: issue.message,
    rule: issue.rule,
    source: issue.rule?.includes("import") ? ("import" as const) : ("typescript" as const),
    severity: issue.type as "error" | "warning",
    raw: `${issue.file}:${issue.line ?? "?"}: ${issue.message}`,
  }));
}

// parseBuildErrors is re-exported for consumers who need to parse raw compiler output
export { parseBuildErrors };

export async function runBuildLoop(
  files: { path: string; content: string }[],
  maxIterations = 5,
  onProgress?: (iteration: number, errors: ParsedBuildError[]) => void
): Promise<BuildLoopResult> {
  const iterations: BuildRunResult[] = [];
  const currentFiles = [...files];
  let totalFixes = 0;
  let usedBroadFix = false;
  let useBroadOnNextIteration = false;

  for (let i = 0; i < maxIterations; i++) {
    const start = Date.now();

    // Run validation
    const validation = validateFiles(currentFiles);
    const allErrors = validationToBuildErrors(validation);
    const errors = allErrors.filter(e => e.severity === "error");
    const warnings = allErrors.filter(e => e.severity === "warning");

    const result: BuildRunResult = {
      success: errors.length === 0,
      errors,
      warnings,
      logs: [validation.summary],
      duration: Date.now() - start,
      iteration: i + 1,
    };
    iterations.push(result);

    if (onProgress) onProgress(i + 1, errors);

    if (errors.length === 0) {
      return { success: true, finalFiles: currentFiles, iterations, totalFixes, usedBroadFix };
    }

    if (i === maxIterations - 1) break;

    // Group errors by file and auto-fix
    const errorsByFile = groupErrorsByFile(errors);
    const filesToFix = currentFiles
      .filter(f => errorsByFile.has(f.path))
      .map(f => ({ path: f.path, content: f.content, errors: errorsByFile.get(f.path) ?? [] }));

    if (filesToFix.length === 0) break;

    const broad: boolean = useBroadOnNextIteration;
    const fixes = await autoFixFiles(filesToFix, undefined, { broad });
    if (broad) usedBroadFix = true;

    // Check if all fixes had no change — trigger broad retry on next iteration
    const allNoChange = fixes.every(f => f.noChange);
    useBroadOnNextIteration = allNoChange && !broad;

    // Apply fixes
    for (const fix of fixes) {
      if (fix.success) {
        const idx = currentFiles.findIndex(f => f.path === fix.file);
        if (idx !== -1) {
          currentFiles[idx] = { ...currentFiles[idx], content: fix.fixedContent };
          totalFixes++;
        }
      }
    }
  }

  const lastResult = iterations[iterations.length - 1];
  return {
    success: lastResult?.success ?? false,
    finalFiles: currentFiles,
    iterations,
    totalFixes,
    usedBroadFix,
  };
}
