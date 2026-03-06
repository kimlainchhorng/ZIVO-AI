/**
 * GET /api/projects/[id]/quality/status?runId=<uuid>
 *
 * Polls the status of a Quality Pass run.
 *
 * Auth: Bearer token required. Caller must own the project.
 *
 * Query params:
 *   runId — the quality run ID returned by POST .../quality/start
 *   (omit runId to list the last 10 runs for the project)
 *
 * Returns:
 *   With runId:  { run: DbQualityRun }
 *   Without:     { runs: DbQualityRun[] }
 */

import { NextResponse } from "next/server";
import {
  extractBearerToken,
  getUserFromToken,
  getProjectById,
  getQualityRun,
  listQualityRuns,
} from "@/lib/db/projects-db";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
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

  // ── Respond ─────────────────────────────────────────────────────────────────
  const url = new URL(req.url);
  const runId = url.searchParams.get("runId");

  if (runId) {
    const run = await getQualityRun(token, runId);
    if (!run || run.project_id !== projectId) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }
    return NextResponse.json({ run });
  }

  const runs = await listQualityRuns(token, projectId, 10);
  return NextResponse.json({ runs });
}
