import { NextResponse } from "next/server";
import {
  extractBearerToken,
  getUserFromToken,
  getProject,
  listProjectFiles,
  updateProject,
} from "@/lib/db/projects-db";

export const runtime = "nodejs";

/** GET /api/projects/[id] — get project + file list (path/metadata only). */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = extractBearerToken(req.headers.get("Authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const project = await getProject(token, id);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const files = await listProjectFiles(token, id);
    return NextResponse.json({ project, files });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message ?? "Failed to get project" },
      { status: 500 }
    );
  }
}

/** PATCH /api/projects/[id] — update project metadata. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = extractBearerToken(req.headers.get("Authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const allowed = ["title", "mode", "visibility", "client_idea", "blueprint", "manifest"] as const;
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  try {
    const project = await updateProject(token, id, updates);
    return NextResponse.json({ project });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message ?? "Failed to update project" },
      { status: 500 }
    );
  }
}
