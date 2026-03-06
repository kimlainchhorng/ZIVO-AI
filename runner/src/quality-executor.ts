/**
 * runner/src/quality-executor.ts
 *
 * Executes quality checks (npm install, lint, tsc, build) against a project's
 * files in a temporary workspace directory inside the runner container.
 *
 * Security mitigations (execution model B — run directly in runner container):
 *  - Commands run as the runner's unprivileged OS user (see Dockerfile).
 *  - Only essential env vars are forwarded (CI, NO_COLOR, HOME, PATH).
 *  - Per-command timeouts are enforced.
 *  - Temp workspace is cleaned up after each job.
 *  - Sensitive env vars (SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY, etc.)
 *    are explicitly excluded from child-process environments.
 */

import { execFile } from "child_process";
import { mkdtemp, writeFile, mkdir, rm } from "fs/promises";
import { join, dirname } from "path";
import { tmpdir } from "os";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

/** Maximum output characters to keep per check (avoids huge DB payloads). */
const MAX_OUTPUT_CHARS = 10_000;

/** Per-command timeout in milliseconds. */
const CMD_TIMEOUT_MS = 90_000;

/** Timeout for npm install (longer because it downloads packages). */
const INSTALL_TIMEOUT_MS = CMD_TIMEOUT_MS * 3;

/** Safe subset of env vars forwarded to child processes. */
function safeEnv(): NodeJS.ProcessEnv {
  return {
    CI: "true",
    NO_COLOR: "1",
    HOME: process.env.HOME ?? "/tmp",
    PATH: process.env.PATH ?? "/usr/local/bin:/usr/bin:/bin",
    // Allow npm/node to find itself
    npm_execpath: process.env.npm_execpath,
  };
}

export interface QualityFile {
  path: string;
  content: string;
}

export interface CheckResult {
  check: "install" | "lint" | "typecheck" | "build";
  passed: boolean;
  output: string;
  durationMs: number;
}

export interface QualityExecutionResult {
  passed: boolean;
  checks: CheckResult[];
  logs: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function writeFilesToTempDir(files: QualityFile[]): Promise<string> {
  const tmpDir = await mkdtemp(join(tmpdir(), "zivo-runner-"));
  for (const file of files) {
    const dest = join(tmpDir, file.path);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, file.content, "utf8");
  }
  return tmpDir;
}

async function runCommand(
  cmd: string,
  args: string[],
  cwd: string,
  timeoutMs: number
): Promise<{ output: string; exitCode: number }> {
  try {
    const { stdout, stderr } = await execFileAsync(cmd, args, {
      cwd,
      timeout: timeoutMs,
      maxBuffer: 20 * 1024 * 1024,
      env: safeEnv(),
    });
    return { output: (stdout + "\n" + stderr).trim(), exitCode: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; code?: number };
    const raw = ((e.stdout ?? "") + "\n" + (e.stderr ?? "")).trim();
    return {
      output: raw.slice(0, MAX_OUTPUT_CHARS),
      exitCode: typeof e.code === "number" ? e.code : 1,
    };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Runs npm install + lint + typecheck + build for the given project files.
 * Returns structured results and a combined log string.
 */
export async function executeQualityChecks(
  files: QualityFile[]
): Promise<QualityExecutionResult> {
  const tmpDir = await writeFilesToTempDir(files);
  const checks: CheckResult[] = [];
  const logLines: string[] = [];

  try {
    const hasPackageJson = files.some((f) => f.path === "package.json");

    if (hasPackageJson) {
      // npm install
      const t0 = Date.now();
      const { output, exitCode } = await runCommand(
        "npm",
        ["install", "--prefer-offline", "--no-fund", "--no-audit"],
        tmpDir,
        INSTALL_TIMEOUT_MS
      );
      const durationMs = Date.now() - t0;
      checks.push({ check: "install", passed: exitCode === 0, output: output.slice(0, MAX_OUTPUT_CHARS), durationMs });
      logLines.push(`[install] ${exitCode === 0 ? "PASS" : "FAIL"} (${durationMs}ms)\n${output}`);

      // If install failed, skip remaining checks
      if (exitCode !== 0) {
        return buildResult(checks, logLines, false);
      }
    }

    // lint
    {
      const t0 = Date.now();
      const { output, exitCode } = await runCommand(
        "npm",
        ["run", "lint", "--if-present"],
        tmpDir,
        CMD_TIMEOUT_MS
      );
      const durationMs = Date.now() - t0;
      checks.push({ check: "lint", passed: exitCode === 0, output: output.slice(0, MAX_OUTPUT_CHARS), durationMs });
      logLines.push(`[lint] ${exitCode === 0 ? "PASS" : "FAIL"} (${durationMs}ms)\n${output}`);
    }

    // typecheck (prefer npm run typecheck, fall back to tsc --noEmit)
    {
      const t0 = Date.now();
      const { output, exitCode } = await runCommand(
        "npx",
        ["tsc", "--noEmit", "--skipLibCheck"],
        tmpDir,
        CMD_TIMEOUT_MS
      );
      const durationMs = Date.now() - t0;
      checks.push({ check: "typecheck", passed: exitCode === 0, output: output.slice(0, MAX_OUTPUT_CHARS), durationMs });
      logLines.push(`[typecheck] ${exitCode === 0 ? "PASS" : "FAIL"} (${durationMs}ms)\n${output}`);
    }

    // build
    {
      const t0 = Date.now();
      const { output, exitCode } = await runCommand(
        "npm",
        ["run", "build", "--if-present"],
        tmpDir,
        CMD_TIMEOUT_MS
      );
      const durationMs = Date.now() - t0;
      checks.push({ check: "build", passed: exitCode === 0, output: output.slice(0, MAX_OUTPUT_CHARS), durationMs });
      logLines.push(`[build] ${exitCode === 0 ? "PASS" : "FAIL"} (${durationMs}ms)\n${output}`);
    }

    return buildResult(checks, logLines, checks.every((c) => c.passed));
  } finally {
    try { await rm(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

function buildResult(
  checks: CheckResult[],
  logLines: string[],
  passed: boolean
): QualityExecutionResult {
  return { passed, checks, logs: logLines.join("\n\n") };
}
