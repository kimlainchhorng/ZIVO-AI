/**
 * POST /api/projects/[id]/knowledge/reindex
 *
 * Triggers (or re-triggers) the knowledge indexer for the project.
 * The indexer runs synchronously in the same process for simplicity —
 * it is fast (pure string scanning, no subprocess).
 *
 * Auth: Bearer token required. Caller must own the project.
 *
 * Body (optional JSON):
 *   { sourceRunId?: string }  — quality/build run that triggered indexing
 *
 * Returns: { knowledgeId: string }
 */

import { NextResponse } from "next/server";
import {
  extractBearerToken,
  getUserFromToken,
  getProjectById,
  getProjectFiles,
  createKnowledgeRecord,
  updateKnowledgeRecord,
  listQualityRuns,
} from "@/lib/db/projects-db";
import { indexProjectFiles } from "@/lib/knowledge-indexer";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const token = extractBearerToken(req.headers.get("Authorization"));
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await getUserFromToken(token);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;

  // ── Ownership check ───────────────────────────────────────────────────────
  const project = await getProjectById(token, projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (project.owner_user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Optional body ─────────────────────────────────────────────────────────
  let sourceRunId: string | null = null;
  try {
    const body = await req.json().catch(() => ({})) as { sourceRunId?: string };
    sourceRunId = body.sourceRunId ?? null;
  } catch {
    // no body — fine
  }

  // ── Create DB record ──────────────────────────────────────────────────────
  const record = await createKnowledgeRecord(token, projectId, sourceRunId);

  // ── Mark as running ───────────────────────────────────────────────────────
  await updateKnowledgeRecord(token, record.id, { status: "running" });

  // ── Fetch project files ───────────────────────────────────────────────────
  let files: Array<{ path: string; content: string }>;
  try {
    files = await getProjectFiles(token, projectId);
  } catch (err) {
    await updateKnowledgeRecord(token, record.id, {
      status: "failed",
      error: err instanceof Error ? err.message : "Failed to fetch project files",
    });
    return NextResponse.json({ error: "Failed to fetch project files" }, { status: 500 });
  }

  // ── Resolve build summary from latest quality run ─────────────────────────
  let buildSummary: string | null = null;
  try {
    const runs = await listQualityRuns(token, projectId, 1);
    if (runs.length > 0) {
      const latest = runs[0];
      buildSummary = `Quality run ${latest.id.slice(0, 8)} — status: ${latest.status}`;
      if (latest.finished_at) {
        buildSummary += ` — finished: ${latest.finished_at}`;
      }
    }
  } catch {
    // best-effort, ignore
  }

  // ── Run indexer ───────────────────────────────────────────────────────────
  try {
    const knowledge = indexProjectFiles(files, buildSummary);
    await updateKnowledgeRecord(token, record.id, {
      status: "succeeded",
      knowledge_json: knowledge,
    });
    return NextResponse.json({ knowledgeId: record.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Indexing failed";
    await updateKnowledgeRecord(token, record.id, { status: "failed", error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
