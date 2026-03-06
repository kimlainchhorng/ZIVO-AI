/**
 * POST /api/projects/[id]/plan/[planId]/verify
 *
 * Triggers a quality/build verification run for a plan that has been applied.
 * Reuses the existing quality-pass system (POST .../quality/start) and
 * links the resulting run back to the plan via verification_run_id.
 *
 * Auth: Bearer token required. Caller must own the project.
 */

import { NextResponse } from "next/server";
import {
  extractBearerToken,
  getUserFromToken,
  getProjectById,
  getProjectFiles,
  getChangePlan,
  updateChangePlan,
  createQualityRun,
  updateQualityRun,
} from "@/lib/db/projects-db";
import { runQualityPass, type QualityFile } from "@/lib/quality-runner";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string; planId: string }>;
}

export async function POST(_req: Request, { params }: RouteParams) {
  const { id: projectId, planId } = await params;

  // ── Auth ──────────────────────────────────────────────────────────────────
  const token = extractBearerToken(_req.headers.get("Authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── Ownership ─────────────────────────────────────────────────────────────
  const project = await getProjectById(token, projectId);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (project.owner_user_id !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // ── Plan validation ───────────────────────────────────────────────────────
  const plan = await getChangePlan(token, planId);
  if (!plan || plan.project_id !== projectId)
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  if (!["applied", "verified", "failed"].includes(plan.status)) {
    return NextResponse.json(
      { error: `Plan must be applied before verifying. Current status: ${plan.status}` },
      { status: 409 }
    );
  }

  // ── Create quality run ────────────────────────────────────────────────────
  const run = await createQualityRun(token, projectId, 3);

  // ── Link run to plan immediately ──────────────────────────────────────────
  await updateChangePlan(token, planId, {
    status: "applied", // stays applied during verification
    verification_run_id: run.id,
  });

  // ── Fire-and-forget async quality check ──────────────────────────────────
  setImmediate(async () => {
    try {
      await updateQualityRun(token, run.id, {
        status: "running",
        started_at: new Date().toISOString(),
      });

      const dbFiles = await getProjectFiles(token, projectId);
      const files: QualityFile[] = dbFiles.map((f) => ({ path: f.path, content: f.content }));
      const result = await runQualityPass(files, 3);

      await updateQualityRun(token, run.id, {
        status: result.passed ? "passed" : "failed",
        logs: result.logs,
        checks: result.checks,
        fix_attempts: result.fixAttempts,
        patches: result.fixAttempts > 0 ? result.finalFiles.map((f) => ({ path: f.path })) : null,
        finished_at: new Date().toISOString(),
      });

      await updateChangePlan(token, planId, {
        status: result.passed ? "verified" : "failed",
        result_json: {
          verificationRunId: run.id,
          passed: result.passed,
          fixAttempts: result.fixAttempts,
        },
      });
    } catch (err: unknown) {
      try {
        await updateQualityRun(token, run.id, {
          status: "failed",
          logs: `Verification error: ${(err as Error)?.message ?? String(err)}`,
          finished_at: new Date().toISOString(),
        });
        await updateChangePlan(token, planId, {
          status: "failed",
          result_json: { error: (err as Error)?.message ?? String(err) },
        });
      } catch {
        // best effort
      }
    }
  });

  return NextResponse.json({ runId: run.id }, { status: 202 });
}
