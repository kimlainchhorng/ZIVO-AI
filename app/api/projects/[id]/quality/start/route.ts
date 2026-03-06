/**
 * POST /api/projects/[id]/quality/start
 *
 * Schedules a Quality Pass (build + lint + typecheck) job to be executed by
 * the remote runner.  Checks no longer run inside the app container.
 *
 * Auth: Bearer token required. Caller must own the project.
 *
 * Body (optional JSON):
 *   {
 *     previousRunId?: string  — if provided, triggers app-side auto-fix:
 *                               fetches failed checks from the previous job,
 *                               applies AI patches to project_files, then
 *                               queues a new job.
 *   }
 *
 * Returns: { runId: string }
 * Poll GET .../quality/status?runId=<id> for results.
 */

import { NextResponse } from "next/server";
import {
  extractBearerToken,
  getUserFromToken,
  getProjectById,
  getProjectFiles,
  getProjectJob,
  createProjectJob,
  upsertProjectFiles,
} from "@/lib/db/projects-db";
import { applyAIFix, type QualityFile, type CheckResult } from "@/lib/quality-runner";

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
  let previousRunId: string | null = null;
  try {
    const body = await req.json().catch(() => ({})) as { previousRunId?: unknown };
    if (typeof body.previousRunId === "string" && body.previousRunId) {
      previousRunId = body.previousRunId;
    }
  } catch {
    // ignore parse errors — use defaults
  }

  // ── Optional: app-side auto-fix before scheduling ───────────────────────────
  // When previousRunId is supplied the app reads the failed job's check results,
  // asks the LLM to generate patches, and applies them to project_files before
  // queuing the next attempt.
  let attempt = 1;
  if (previousRunId) {
    const prevJob = await getProjectJob(token, previousRunId);
    if (prevJob && prevJob.project_id === projectId && prevJob.status === "failed") {
      attempt = prevJob.attempt + 1;

      // Extract failed checks from result_json
      const resultJson = prevJob.result_json as { checks?: CheckResult[] } | null;
      const failedChecks: CheckResult[] = (resultJson?.checks ?? []).filter((c) => !c.passed);

      if (failedChecks.length > 0) {
        // Load current project files
        const dbFiles = await getProjectFiles(token, projectId);
        const files: QualityFile[] = dbFiles.map((f) => ({ path: f.path, content: f.content }));

        // Ask the LLM to patch failing files (auto-fix stays in app per spec)
        const patchedFiles = await applyAIFix(files, failedChecks);

        // Persist patched files only when something changed
        const changed = patchedFiles.filter((pf) => {
          const orig = files.find((f) => f.path === pf.path);
          return !orig || orig.content !== pf.content;
        });
        if (changed.length > 0) {
          await upsertProjectFiles(
            token,
            projectId,
            changed.map((f) => ({ path: f.path, content: f.content, generated_by: "quality-autofix" }))
          );
        }
      }
    }
  }

  // ── Determine max_attempts (cap at 4 = initial + 3 retries) ─────────────────
  const maxAttempts = 4;

  // ── Create queued job row ───────────────────────────────────────────────────
  const job = await createProjectJob(token, projectId, user.id, "quality", attempt, maxAttempts);

  return NextResponse.json({ runId: job.id }, { status: 202 });
}


