import { NextResponse } from "next/server";
import {
  extractBearerToken,
  getUserFromToken,
  getProjectById,
  restoreProjectFromSnapshot,
} from "@/lib/db/projects-db";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/projects/[id]/restore
 * Body: { buildId: string }
 *
 * Loads the snapshot for the given build from Supabase Storage and
 * replaces the project's current files with the snapshot contents.
 */
export async function POST(req: Request, { params }: RouteParams) {
  const { id } = await params;

  const token = extractBearerToken(req.headers.get("Authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { buildId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const buildId = typeof body.buildId === "string" ? body.buildId.trim() : "";
  if (!buildId) {
    return NextResponse.json({ error: "buildId is required" }, { status: 400 });
  }

  try {
    const project = await getProjectById(token, id);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    if (project.owner_user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await restoreProjectFromSnapshot(token, id, buildId);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message ?? "Failed to restore build" },
      { status: 500 }
    );
  }
}
