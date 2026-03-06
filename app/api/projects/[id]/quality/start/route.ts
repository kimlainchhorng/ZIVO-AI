/**
 * POST /api/projects/[id]/quality/start
 *
 * Starts a Quality Pass (build + lint + typecheck + optional auto-fix loop)
 * against the current project_files workspace.
 *
 * Auth: Bearer token required. Caller must own the project.
 *
 * Body (optional JSON):
 *   { maxRetries?: number }   — auto-fix retries (0–3, default 3)
 *
 * Returns: { runId: string }
 * The run is processed asynchronously; poll GET .../quality/status?runId=<id>
 * for results.
 *
 * ⚠️  SECURITY: This endpoint executes arbitrary project files as child
 * processes inside the app container. See lib/quality-runner.ts for details.
 */

import { NextResponse } from "next/server";
import {
  extractBearerToken,
  getUserFromToken,
  getProjectById,
  getProjectFiles,
  createQualityRun,
  updateQualityRun,
  upsertProjectFiles,
} from "@/lib/db/projects-db";
import { runQualityPass, type QualityFile } from "@/lib/quality-runner";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  const { id: projectId } = await params;

  // ── Auth ────────────────────────────────────────────────────────────────────
  const token = extractBearerToken(req.headers.get("Authorization"));
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await getUserFromToken(token);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Ownership check ─────────────────────────────────────────────────────────
  const project = await getProjectById(token, projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (project.owner_user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Parse body ──────────────────────────────────────────────────────────────
  let maxRetries = 3;
  try {
    const body = await req.json().catch(() => ({})) as { maxRetries?: unknown };
    if (typeof body.maxRetries === "number") {
      maxRetries = Math.min(Math.max(0, body.maxRetries), 3);
    }
  } catch {
    // ignore parse errors — use defaults
  }

  // ── Create queued run ───────────────────────────────────────────────────────
  const run = await createQualityRun(token, projectId, maxRetries);

  // ── Fire-and-forget async execution ────────────────────────────────────────
  // We kick off the quality pass in the background so the HTTP response is
  // immediate.  Progress is persisted to project_quality_runs.
  setImmediate(async () => {
    try {
      // Mark as running
      await updateQualityRun(token, run.id, {
        status: "running",
        started_at: new Date().toISOString(),
      });

      // Load project files
      const dbFiles = await getProjectFiles(token, projectId);
      const files: QualityFile[] = dbFiles.map((f) => ({ path: f.path, content: f.content }));

      // Execute quality pass
      const result = await runQualityPass(files, maxRetries);

      // Persist fixed files back to project_files when AI auto-fix ran
      if (result.fixAttempts > 0 && result.passed) {
        await upsertProjectFiles(
          token,
          projectId,
          result.finalFiles.map((f) => ({ path: f.path, content: f.content, generated_by: "quality-autofix" }))
        );
      }

      // Persist result
      await updateQualityRun(token, run.id, {
        status: result.passed ? "passed" : "failed",
        logs: result.logs,
        checks: result.checks,
        fix_attempts: result.fixAttempts,
        patches: result.fixAttempts > 0
          ? result.finalFiles.map((f) => ({ path: f.path }))
          : null,
        finished_at: new Date().toISOString(),
      });
    } catch (err: unknown) {
      // Mark as failed with error log
      try {
        await updateQualityRun(token, run.id, {
          status: "failed",
          logs: `Quality pass executor error: ${(err as Error)?.message ?? String(err)}`,
          finished_at: new Date().toISOString(),
        });
      } catch {
        // swallow — best effort
      }
    }
  });

  return NextResponse.json({ runId: run.id }, { status: 202 });
}
