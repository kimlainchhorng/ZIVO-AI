// lib/build-runner.ts — Build validation utilities

import { validateFiles } from "../agents/validator";

export interface GeneratedFile {
  path: string;
  content: string;
  action?: "create" | "update" | "delete";
  language?: string;
}

export interface BuildError {
  file: string;
  line?: number;
  message: string;
  rule?: string;
}

export interface BuildWarning {
  file: string;
  line?: number;
  message: string;
}

export interface BuildResult {
  success: boolean;
  errors: BuildError[];
  warnings: BuildWarning[];
  duration: number;
}

/**
 * Runs build validation checks on an array of generated files.
 * Checks TypeScript errors via the validator agent and required project files.
 */
export async function runBuildChecks(
  files: GeneratedFile[],
  projectType: "nextjs" | "react" | "node" = "nextjs"
): Promise<BuildResult> {
  const start = Date.now();
  const errors: BuildError[] = [];
  const warnings: BuildWarning[] = [];

  // ── Required file checks ──────────────────────────────────────────────────
  const paths = files.map((f) => f.path);
  const hasTsFiles = paths.some((p) => /\.(ts|tsx)$/.test(p));

  if (!paths.some((p) => p === "package.json" || p.endsWith("/package.json"))) {
    errors.push({ file: "package.json", message: "Missing required package.json" });
  }

  if (hasTsFiles && !paths.some((p) => p === "tsconfig.json" || p.endsWith("/tsconfig.json"))) {
    errors.push({ file: "tsconfig.json", message: "Missing tsconfig.json for TypeScript project" });
  }

  if (projectType === "nextjs") {
    if (!paths.some((p) => p === "app/layout.tsx" || p === "app/layout.ts" || p.endsWith("/layout.tsx"))) {
      warnings.push({ file: "app/layout.tsx", message: "Missing Next.js root layout — recommended for App Router" });
    }
    if (!paths.some((p) => p === "next.config.ts" || p === "next.config.js" || p === "next.config.mjs")) {
      warnings.push({ file: "next.config.ts", message: "Missing next.config file" });
    }
  }

  // ── TypeScript/ESLint validation ──────────────────────────────────────────
  const validationResult = validateFiles(
    files.map((f) => ({ path: f.path, content: f.content }))
  );

  for (const issue of validationResult.issues) {
    const entry = { file: issue.file, line: issue.line, message: issue.message, rule: issue.rule };
    if (issue.type === "error") {
      errors.push(entry);
    } else {
      warnings.push(entry);
    }
  }

  const duration = Date.now() - start;
  return { success: errors.length === 0, errors, warnings, duration };
}

// ── New BuildRunResult interface (compatible with lib/ai/fix-loop.ts BuildResult) ──

export interface BuildRunResult {
  success: boolean;
  errors: BuildError[];
  warnings: BuildWarning[];
  logs: string[];
  duration: number;
}

/**
 * Runs build validation and returns a structured BuildRunResult with logs.
 * Compatible with the BuildError / BuildWarning types from lib/ai/fix-loop.ts.
 */
export async function runBuild(
  files: Array<{ path: string; content: string }>
): Promise<BuildRunResult> {
  const generatedFiles: GeneratedFile[] = files.map((f) => ({
    path: f.path,
    content: f.content,
  }));

  const result = await runBuildChecks(generatedFiles);

  const logs: string[] = [
    `Build started — ${files.length} file(s)`,
    ...result.errors.map((e) => `ERROR [${e.file}] ${e.message}`),
    ...result.warnings.map((w) => `WARN  [${w.file}] ${w.message}`),
    result.success ? `Build succeeded in ${result.duration}ms` : `Build failed in ${result.duration}ms`,
  ];

  return {
    success: result.success,
    errors: result.errors,
    warnings: result.warnings,
    logs,
    duration: result.duration,
  };
}
