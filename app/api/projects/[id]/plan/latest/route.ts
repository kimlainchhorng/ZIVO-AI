/**
 * GET /api/projects/[id]/plan/latest
 *
 * Returns the most recent change plan for the project plus its status.
 *
 * Auth: Bearer token required. Caller must own the project.
 */

import { NextResponse } from "next/server";
import {
  extractBearerToken,
  getUserFromToken,
  getProjectById,
  getLatestChangePlan,
} from "@/lib/db/projects-db";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  const { id: projectId } = await params;

  const token = extractBearerToken(_req.headers.get("Authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await getProjectById(token, projectId);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (project.owner_user_id !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const plan = await getLatestChangePlan(token, projectId);
  return NextResponse.json({ plan });
}
