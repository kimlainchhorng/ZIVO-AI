/**
 * lib/quality-runner.ts — Quality Pass sandbox executor + auto-fix loop
 *
 * ⚠️  SECURITY NOTE: This module writes project files to a temporary directory
 * inside the app container and executes `npm run build`, `npm run lint`, and
 * `tsc --noEmit` as child processes.  Project files are user-controlled content;
 * this constitutes arbitrary code execution in the app container.
 * Do NOT enable this feature on multi-tenant infrastructure without an isolated
 * execution environment (e.g. a separate sandboxed container, gVisor, or a
 * remote runner).  The feature is intentionally scoped to `website_v2` projects
 * so that the attack surface is limited.
 */

import { execFile } from "child_process";
import { mkdtemp, writeFile, mkdir, rm } from "fs/promises";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { tmpdir } from "os";
import { promisify } from "util";
import OpenAI from "openai";

const execFileAsync = promisify(execFile);

export interface QualityFile {
  path: string;
  content: string;
}

export interface CheckResult {
  check: "build" | "lint" | "typecheck";
  passed: boolean;
  output: string;
  durationMs: number;
}

export interface QualityRunResult {
  passed: boolean;
  checks: CheckResult[];
  logs: string;
  fixAttempts: number;
  finalFiles: QualityFile[];
}

/** Maximum characters of check output to keep (to avoid huge logs). */
const MAX_OUTPUT_CHARS = 8_000;
/** Command timeout in milliseconds (90 s per check). */
const CMD_TIMEOUT_MS = 90_000;
/** Maximum auto-fix retries (hard limit). */
const MAX_AUTO_FIX_RETRIES = 3;

// ─── Sandbox helpers ──────────────────────────────────────────────────────────

/** Writes files into a temp directory and returns the directory path. */
async function writeFilesToTempDir(files: QualityFile[]): Promise<string> {
  const tmpDir = await mkdtemp(join(tmpdir(), "zivo-quality-"));
  for (const file of files) {
    const dest = join(tmpDir, file.path);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, file.content, "utf8");
  }
  return tmpDir;
}

/** Runs a shell command in a directory with a timeout; returns stdout+stderr. */
async function runCommand(
  cmd: string,
  args: string[],
  cwd: string,
  timeoutMs = CMD_TIMEOUT_MS
): Promise<{ output: string; exitCode: number }> {
  try {
    const { stdout, stderr } = await execFileAsync(cmd, args, {
      cwd,
      timeout: timeoutMs,
      maxBuffer: 10 * 1024 * 1024, // 10 MB
      env: { ...process.env, CI: "true", NO_COLOR: "1" },
    });
    return { output: (stdout + "\n" + stderr).trim(), exitCode: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; code?: number; signal?: string };
    const raw = ((e.stdout ?? "") + "\n" + (e.stderr ?? "")).trim();
    const output = raw.slice(0, MAX_OUTPUT_CHARS);
    const exitCode = typeof e.code === "number" ? e.code : 1;
    return { output, exitCode };
  }
}

// ─── Core check runner ────────────────────────────────────────────────────────

async function installDeps(tmpDir: string): Promise<string> {
  const { output } = await runCommand(
    "npm",
    ["install", "--prefer-offline", "--no-fund", "--no-audit"],
    tmpDir,
    CMD_TIMEOUT_MS * 3
  );
  return output;
}

async function runSingleCheck(
  check: "build" | "lint" | "typecheck",
  tmpDir: string
): Promise<CheckResult> {
  const t0 = Date.now();
  let cmd: string;
  let args: string[];

  if (check === "typecheck") {
    // Prefer `npm run typecheck` if script exists, fall back to tsc --noEmit
    cmd = "npx";
    args = ["tsc", "--noEmit", "--skipLibCheck"];
  } else {
    cmd = "npm";
    args = ["run", check, "--if-present"];
  }

  const { output, exitCode } = await runCommand(cmd, args, tmpDir);
  const passed = exitCode === 0;
  const durationMs = Date.now() - t0;

  return {
    check,
    passed,
    output: output.slice(0, MAX_OUTPUT_CHARS),
    durationMs,
  };
}

// ─── AI auto-fix helper ───────────────────────────────────────────────────────

/** Load the system prompt from prompts/ directory (keeps LLM templates out of code). */
function loadFixSystemPrompt(): string {
  try {
    return readFileSync(join(process.cwd(), "prompts", "quality-autofix-system.txt"), "utf8").trim();
  } catch {
    // Fallback inline prompt in case the file is not accessible at runtime
    return (
      "You are an expert TypeScript/Next.js auto-fixer.\n" +
      "Given failed build/lint/typecheck output and the relevant source files, return minimal patches.\n\n" +
      "Respond ONLY with a valid JSON array — no markdown fences, no explanation:\n" +
      '[  { "path": "relative/file/path.ts", "content": "<full fixed file content>" }, ... ]\n\n' +
      "Only include files that need to change.  Keep changes minimal."
    );
  }
}

async function applyAIFix(
  files: QualityFile[],
  failedChecks: CheckResult[]
): Promise<QualityFile[]> {
  if (!process.env.OPENAI_API_KEY) {
    return files; // no AI key → return unchanged
  }

  const errorSummary = failedChecks
    .map((c) => `## ${c.check} errors\n${c.output}`)
    .join("\n\n");

  // Only send files that appear in the error output (heuristic)
  const referencedPaths = new Set<string>();
  for (const c of failedChecks) {
    for (const f of files) {
      if (c.output.includes(f.path) || c.output.includes(f.path.replace(/\//g, "\\"))) {
        referencedPaths.add(f.path);
      }
    }
  }
  // If nothing matched, send all TS/TSX files (up to 10)
  const filesToSend =
    referencedPaths.size > 0
      ? files.filter((f) => referencedPaths.has(f.path))
      : files.filter((f) => /\.(ts|tsx|js|jsx)$/.test(f.path)).slice(0, 10);

  const filesDump = filesToSend
    .map((f) => `### ${f.path}\n\`\`\`\n${f.content.slice(0, 4000)}\n\`\`\``)
    .join("\n\n");

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  let raw: string;
  try {
    const completion = await client.chat.completions.create({
      // GPT-4o is used here because patch generation requires broad code knowledge
      // and instruction-following fidelity (structured JSON output).
      model: "gpt-4o",
      temperature: 0.1,
      max_tokens: 4096,
      messages: [
        { role: "system", content: loadFixSystemPrompt() },
        {
          role: "user",
          content: `Failed checks:\n\n${errorSummary}\n\nSource files:\n\n${filesDump}`,
        },
      ],
    });
    raw = completion.choices[0]?.message?.content ?? "[]";
  } catch {
    return files; // AI call failed → return unchanged
  }

  let patches: QualityFile[];
  try {
    // Strip possible markdown fences
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();
    patches = JSON.parse(cleaned) as QualityFile[];
    if (!Array.isArray(patches)) return files;
  } catch {
    return files;
  }

  // Merge patches back into files
  const updated = files.map((f) => {
    const patch = patches.find((p) => p.path === f.path);
    return patch ? { ...f, content: patch.content } : f;
  });

  // Add new files introduced by patches (rare, but handle it)
  for (const patch of patches) {
    if (!updated.some((f) => f.path === patch.path)) {
      updated.push(patch);
    }
  }

  return updated;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Runs the full Quality Pass (build + lint + typecheck) against the provided
 * files in a temporary directory inside the app container.
 *
 * @param files - Project files to check.
 * @param maxRetries - Number of auto-fix attempts when checks fail (0–3).
 * @param onProgress - Optional callback called after each check iteration.
 */
export async function runQualityPass(
  files: QualityFile[],
  maxRetries = MAX_AUTO_FIX_RETRIES,
  onProgress?: (attempt: number, checks: CheckResult[]) => void
): Promise<QualityRunResult> {
  const safeRetries = Math.min(Math.max(0, maxRetries), MAX_AUTO_FIX_RETRIES);
  let currentFiles = [...files];
  let fixAttempts = 0;
  let tmpDir: string | null = null;
  const allLogs: string[] = [];

  try {
    for (let attempt = 0; attempt <= safeRetries; attempt++) {
      // Write files to temp dir
      tmpDir = await writeFilesToTempDir(currentFiles);

      // Install deps if package.json is present
      const hasPackageJson = currentFiles.some((f) => f.path === "package.json");
      if (hasPackageJson) {
        const installLog = await installDeps(tmpDir);
        allLogs.push(`[install]\n${installLog}`);
      }

      // Run all three checks
      const checks: CheckResult[] = [];
      for (const check of ["build", "lint", "typecheck"] as const) {
        const result = await runSingleCheck(check, tmpDir);
        checks.push(result);
        allLogs.push(`[${check}] ${result.passed ? "PASS" : "FAIL"} (${result.durationMs}ms)\n${result.output}`);
      }

      if (onProgress) onProgress(attempt + 1, checks);

      const allPassed = checks.every((c) => c.passed);

      // Clean up temp dir
      try { await rm(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
      tmpDir = null;

      if (allPassed || attempt === safeRetries) {
        return {
          passed: allPassed,
          checks,
          logs: allLogs.join("\n\n"),
          fixAttempts,
          finalFiles: currentFiles,
        };
      }

      // Auto-fix: ask AI to patch failing files
      fixAttempts++;
      const failedChecks = checks.filter((c) => !c.passed);
      currentFiles = await applyAIFix(currentFiles, failedChecks);
    }
  } finally {
    if (tmpDir) {
      try { await rm(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
    }
  }

  // Fallback (should not reach here)
  return {
    passed: false,
    checks: [],
    logs: allLogs.join("\n\n"),
    fixAttempts,
    finalFiles: currentFiles,
  };
}
