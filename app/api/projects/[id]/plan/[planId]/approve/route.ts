/**
 * POST /api/projects/[id]/plan/[planId]/approve
 *
 * Marks a plan as approved so changes can be applied.
 * Only the project owner can approve.
 *
 * Auth: Bearer token required. Caller must own the project.
 */

import { NextResponse } from "next/server";
import {
  extractBearerToken,
  getUserFromToken,
  getProjectById,
  getChangePlan,
  updateChangePlan,
} from "@/lib/db/projects-db";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string; planId: string }>;
}

export async function POST(_req: Request, { params }: RouteParams) {
  const { id: projectId, planId } = await params;

  const token = extractBearerToken(_req.headers.get("Authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await getProjectById(token, projectId);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (project.owner_user_id !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const plan = await getChangePlan(token, planId);
  if (!plan || plan.project_id !== projectId)
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  if (plan.status === "approved")
    return NextResponse.json({ error: "Plan is already approved" }, { status: 409 });

  if (!["draft", "awaiting_approval"].includes(plan.status))
    return NextResponse.json(
      { error: `Cannot approve a plan with status '${plan.status}'` },
      { status: 409 }
    );

  const updated = await updateChangePlan(token, planId, {
    status: "approved",
    approved_at: new Date().toISOString(),
    approved_by_user_id: user.id,
  });

  return NextResponse.json({ plan: updated });
}
