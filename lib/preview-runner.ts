/**
 * lib/preview-runner.ts
 *
 * Remote preview runner — builds and runs a generated Next.js project inside
 * an isolated Docker container (or a local child-process fallback when Docker
 * is unavailable).
 *
 * Security model
 * ──────────────
 * • Each preview gets its own Docker container; the host filesystem is NOT
 *   mounted except for the per-session temp workspace directory.
 * • Network egress can be restricted with `--network=none` after `npm install`;
 *   set PREVIEW_NETWORK_RESTRICTED=true to enable (may break CDN fonts etc.).
 * • Container env is stripped to a minimal safe set — no host env vars are
 *   forwarded.
 * • Containers are automatically stopped after PREVIEW_TTL_MS (30 min idle)
 *   by the reaper in preview-store.ts; `stopPreview()` also removes them.
 *
 * WARNING: Running arbitrary user-generated code has inherent risks. Deploy
 * this runner only on dedicated infrastructure that is NOT co-located with
 * sensitive services. See docs/live-preview-runner.md for full guidance.
 *
 * Environment variables
 * ─────────────────────
 * PREVIEW_DOCKER_IMAGE      Node.js image to use (default: node:20-alpine)
 * PREVIEW_BASE_URL          Publicly reachable base URL of this server, e.g.
 *                           https://preview.example.com  (used to build the
 *                           preview URL returned to the UI)
 * PREVIEW_PORT_RANGE_START  First ephemeral port to allocate (default: 4000)
 * PREVIEW_PORT_RANGE_END    Last ephemeral port (default: 4999)
 * PREVIEW_NETWORK_RESTRICTED  Set to "true" to restrict container networking
 * PREVIEW_USE_DOCKER        Set to "false" to disable Docker and use a
 *                           local child process instead (dev/CI only)
 */

import { execFile, spawn } from "child_process";
import { promisify } from "util";
import { mkdtemp, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { tmpdir } from "os";
import {
  getPreviewSession,
  updatePreviewSession,
  appendPreviewLog,
  type PreviewSession,
} from "./preview-store";

const execFileAsync = promisify(execFile);

// ── Config ────────────────────────────────────────────────────────────────────

const DOCKER_IMAGE =
  process.env.PREVIEW_DOCKER_IMAGE ?? "node:20-alpine";
const BASE_URL =
  (process.env.PREVIEW_BASE_URL ?? "").replace(/\/$/, "") ||
  "http://localhost:3001";
const PORT_START = parseInt(process.env.PREVIEW_PORT_RANGE_START ?? "4000", 10);
const PORT_END   = parseInt(process.env.PREVIEW_PORT_RANGE_END   ?? "4999", 10);
const NETWORK_RESTRICTED =
  process.env.PREVIEW_NETWORK_RESTRICTED === "true";
const USE_DOCKER =
  process.env.PREVIEW_USE_DOCKER !== "false";

// ── Port allocation ───────────────────────────────────────────────────────────

const allocatedPorts = new Set<number>();

function allocatePort(): number | null {
  for (let p = PORT_START; p <= PORT_END; p++) {
    if (!allocatedPorts.has(p)) {
      allocatedPorts.add(p);
      return p;
    }
  }
  return null;
}

function releasePort(port: number): void {
  allocatedPorts.delete(port);
}

// ── File helpers ──────────────────────────────────────────────────────────────

interface ProjectFile {
  path: string;
  content: string;
}

async function writeProjectFiles(
  workDir: string,
  files: ProjectFile[]
): Promise<void> {
  for (const file of files) {
    const fullPath = join(workDir, file.path);
    const dir = dirname(fullPath);
    await mkdir(dir, { recursive: true });
    await writeFile(fullPath, file.content, "utf8");
  }
}

/**
 * Ensures the project has a minimal package.json so npm install works even
 * when the LLM omitted it.
 */
async function ensurePackageJson(workDir: string, files: ProjectFile[]): Promise<void> {
  const hasPackageJson = files.some((f) => f.path === "package.json");
  if (!hasPackageJson) {
    const minimal = JSON.stringify(
      {
        name: "zivo-preview",
        version: "0.1.0",
        private: true,
        scripts: { dev: "next dev", build: "next build", start: "next start" },
        dependencies: { next: "14.2.x", react: "^18", "react-dom": "^18" },
      },
      null,
      2
    );
    await writeFile(join(workDir, "package.json"), minimal, "utf8");
  }
}

// ── Docker helpers ────────────────────────────────────────────────────────────

async function isDockerAvailable(): Promise<boolean> {
  try {
    await execFileAsync("docker", ["info"], { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

async function startDockerContainer(
  workDir: string,
  port: number,
  containerId: string
): Promise<void> {
  const networkArgs = NETWORK_RESTRICTED
    ? ["--network=none"]
    : ["--network=bridge"];

  const args = [
    "run",
    "--rm",
    "--detach",
    `--name=${containerId}`,
    `-p${port}:3000`,
    `--workdir=/app`,
    // Source files are bind-mounted read-only; node_modules and .next are
    // separate tmpfs mounts so npm install and next build can write inside the
    // container without touching the host workspace.
    `-v${workDir}:/app/src:ro`,
    "--memory=512m",
    "--cpus=0.5",
    "--pids-limit=100",
    "--tmpfs=/app/node_modules",
    "--tmpfs=/app/.next",
    "--tmpfs=/tmp",
    ...networkArgs,
    // strip all capabilities
    "--cap-drop=ALL",
    // no new privileges
    "--security-opt=no-new-privileges",
    DOCKER_IMAGE,
    "sh",
    "-c",
    // Copy source to writable /app, install deps, and start dev server
    "cp -r /app/src/. /app/ && npm install --no-audit --no-fund --prefer-offline 2>&1 && npm run dev -- --port 3000 --hostname 0.0.0.0 2>&1",
  ];

  await execFileAsync("docker", args, { timeout: 10_000 });
}

async function stopDockerContainer(containerId: string): Promise<void> {
  try {
    await execFileAsync("docker", ["stop", "--time=5", containerId], {
      timeout: 15_000,
    });
  } catch {
    // Container may already be stopped — ignore
  }
}

// ── Local process fallback (development / CI) ─────────────────────────────────

/** Tracks child processes by containerId alias. */
const localProcesses = new Map<string, ReturnType<typeof spawn>>();

async function startLocalProcess(
  workDir: string,
  port: number,
  processId: string,
  previewId: string
): Promise<void> {
  // Run npm install synchronously first
  await execFileAsync("npm", ["install", "--no-audit", "--no-fund"], {
    cwd: workDir,
    timeout: 120_000,
  });

  const proc = spawn(
    "npm",
    ["run", "dev", "--", "--port", String(port), "--hostname", "0.0.0.0"],
    {
      cwd: workDir,
      env: {
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        NODE_ENV: "development",
        PORT: String(port),
      },
      detached: false,
    }
  );

  localProcesses.set(processId, proc);

  proc.stdout?.on("data", (chunk: Buffer) => {
    const line = chunk.toString().trim();
    if (line) appendPreviewLog(previewId, line);
    if (/ready|started|localhost/i.test(line)) {
      updatePreviewSession(previewId, {
        status: "running",
        url: `${BASE_URL.replace(/:\d+$/, "")}:${port}`,
        startedAt: new Date().toISOString(),
      });
    }
  });

  proc.stderr?.on("data", (chunk: Buffer) => {
    const line = chunk.toString().trim();
    if (line) appendPreviewLog(previewId, `[stderr] ${line}`);
  });

  proc.on("exit", (code) => {
    appendPreviewLog(previewId, `Process exited with code ${code}`);
    if (code !== 0) {
      updatePreviewSession(previewId, {
        status: "failed",
        error: `Process exited with code ${code}`,
      });
    }
    localProcesses.delete(processId);
  });
}

function stopLocalProcess(processId: string): void {
  const proc = localProcesses.get(processId);
  if (proc) {
    try { proc.kill("SIGTERM"); } catch { /* ignore */ }
    localProcesses.delete(processId);
  }
}

// ── Poll Docker container logs ────────────────────────────────────────────────

/**
 * Polls Docker logs until the server is ready (or fails) and updates the
 * session state accordingly.  Runs asynchronously — does not block startPreview.
 */
async function pollDockerUntilReady(
  previewId: string,
  containerId: string,
  port: number
): Promise<void> {
  const POLL_INTERVAL_MS = 2000;
  const TIMEOUT_MS = 180_000; // 3 minutes
  const startTime = Date.now();

  while (Date.now() - startTime < TIMEOUT_MS) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const session = getPreviewSession(previewId);
    if (!session || session.status === "stopped") return;

    try {
      const { stdout } = await execFileAsync(
        "docker",
        ["logs", "--tail=30", containerId],
        { timeout: 5000 }
      );
      const lines = stdout.split("\n").filter(Boolean);
      lines.forEach((l) => appendPreviewLog(previewId, l));

      const combined = lines.join("\n");
      if (/ready|started|localhost|✓ Ready/i.test(combined)) {
        updatePreviewSession(previewId, {
          status: "running",
          url: `${BASE_URL}:${port}`,
          startedAt: new Date().toISOString(),
        });
        return;
      }
      if (/error|failed|ENOENT/i.test(combined)) {
        updatePreviewSession(previewId, {
          status: "failed",
          error: "Container reported an error during startup",
        });
        return;
      }
    } catch {
      // Container may not have started yet
    }
  }

  updatePreviewSession(previewId, {
    status: "failed",
    error: "Preview startup timed out after 3 minutes",
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Kicks off an async preview build for the given session.
 * Updates the session status as the build progresses.
 */
export async function startPreview(
  session: PreviewSession,
  files: ProjectFile[]
): Promise<void> {
  const { previewId } = session;

  // Allocate a port
  const port = allocatePort();
  if (port === null) {
    updatePreviewSession(previewId, {
      status: "failed",
      error: "No free preview ports available. Try again later.",
    });
    return;
  }

  updatePreviewSession(previewId, { status: "building", port });
  appendPreviewLog(previewId, `[runner] Allocated port ${port}`);

  let workDir: string;
  try {
    workDir = await mkdtemp(join(tmpdir(), `zivo-preview-${previewId.slice(0, 8)}-`));
  } catch (err) {
    releasePort(port);
    updatePreviewSession(previewId, {
      status: "failed",
      error: `Failed to create temp workspace: ${err instanceof Error ? err.message : String(err)}`,
    });
    return;
  }

  try {
    appendPreviewLog(previewId, "[runner] Writing project files…");
    await ensurePackageJson(workDir, files);
    await writeProjectFiles(workDir, files);
    appendPreviewLog(previewId, `[runner] Wrote ${files.length} file(s) to ${workDir}`);

    const useDocker = USE_DOCKER && (await isDockerAvailable());
    const containerId = `zivo-preview-${previewId.slice(0, 12)}`;
    updatePreviewSession(previewId, { containerId });

    if (useDocker) {
      appendPreviewLog(previewId, `[runner] Starting Docker container ${containerId}…`);
      await startDockerContainer(workDir, port, containerId);
      appendPreviewLog(previewId, "[runner] Container started — waiting for server…");
      // Poll asynchronously; startPreview returns immediately
      void pollDockerUntilReady(previewId, containerId, port);
    } else {
      appendPreviewLog(previewId, "[runner] Docker unavailable — using local process fallback");
      await startLocalProcess(workDir, port, containerId, previewId);
      appendPreviewLog(previewId, "[runner] Local dev server started");
    }
  } catch (err) {
    releasePort(port);
    const message = err instanceof Error ? err.message : String(err);
    appendPreviewLog(previewId, `[runner] ERROR: ${message}`);
    updatePreviewSession(previewId, { status: "failed", error: message });
  }
}

/**
 * Stops and cleans up a preview session's container / process.
 */
export async function stopPreview(session: PreviewSession): Promise<void> {
  const { previewId, containerId, port } = session;

  if (containerId) {
    // Try Docker stop first; fall back to local process
    if (USE_DOCKER) {
      await stopDockerContainer(containerId).catch(() => {});
    }
    stopLocalProcess(containerId);
  }

  if (port !== null) releasePort(port);

  updatePreviewSession(previewId, {
    status: "stopped",
    url: null,
    containerId: null,
    port: null,
  });
  appendPreviewLog(previewId, "[runner] Preview stopped and cleaned up");
}
