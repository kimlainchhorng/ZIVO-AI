/**
 * GET /api/projects/[id]/knowledge/latest
 *
 * Returns the most recent knowledge record for the project.
 *
 * Auth: Bearer token required. Caller must own the project.
 *
 * Returns:
 *   { knowledge: DbKnowledgeRecord | null }
 */

import { NextResponse } from "next/server";
import {
  extractBearerToken,
  getUserFromToken,
  getProjectById,
  getLatestKnowledgeRecord,
} from "@/lib/db/projects-db";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
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

  // ── Fetch latest record ───────────────────────────────────────────────────
  const knowledge = await getLatestKnowledgeRecord(token, projectId);
  return NextResponse.json({ knowledge });
}
