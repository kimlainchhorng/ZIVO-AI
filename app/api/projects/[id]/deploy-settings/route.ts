/**
 * GET  /api/projects/[id]/deploy-settings  — fetch current deploy settings
 * PATCH /api/projects/[id]/deploy-settings  — save deploy settings
 *
 * Auth: Bearer token required. Caller must own the project.
 * Note: docker_deploy_token is intentionally not stored here.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  extractBearerToken,
  getUserFromToken,
  getProjectById,
  getDeploySettings,
  upsertDeploySettings,
} from "@/lib/db/projects-db";

export const runtime = "nodejs";

/** Only allow updating the user-facing settings fields; block tracking fields. */
const PatchSchema = z.object({
  deploy_repo_url: z.string().url().nullable().optional(),
  deploy_branch: z.string().min(1).max(255).optional(),
  docker_deploy_endpoint: z.string().url().nullable().optional(),
}).strict();

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  const { id: projectId } = await params;

  const token = extractBearerToken(req.headers.get("Authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await getProjectById(token, projectId);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (project.owner_user_id !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const settings = await getDeploySettings(token, projectId);
  return NextResponse.json({ settings: settings ?? null });
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const { id: projectId } = await params;

  const token = extractBearerToken(req.headers.get("Authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await getProjectById(token, projectId);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (project.owner_user_id !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const settings = await upsertDeploySettings(token, projectId, parsed.data);
  return NextResponse.json({ settings });
}
