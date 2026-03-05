import { NextResponse } from "next/server";
import {
  extractBearerToken,
  getUserFromToken,
  getProjectFiles,
  upsertProjectFiles,
} from "@/lib/db/projects-db";

export const runtime = "nodejs";

/** GET /api/projects/[id]/files — get full file contents for a project. */
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
    const files = await getProjectFiles(token, id);
    return NextResponse.json({ files });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message ?? "Failed to get project files" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/[id]/files — upsert a single file for a project.
 * Body: { path: string; content: string }
 * Requires Authorization: Bearer <token>
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = extractBearerToken(req.headers.get("Authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { path?: unknown; content?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const path = typeof body.path === "string" ? body.path.trim() : "";
  const content = typeof body.content === "string" ? body.content : "";

  if (!path) {
    return NextResponse.json({ error: "path is required" }, { status: 400 });
  }

  try {
    await upsertProjectFiles(token, id, [{ path, content, generated_by: "user-edit" }]);
    return NextResponse.json({ ok: true, path });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message ?? "Failed to save file" },
      { status: 500 }
    );
  }
}
