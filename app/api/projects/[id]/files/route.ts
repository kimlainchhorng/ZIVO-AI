import { NextResponse } from "next/server";
import {
  extractBearerToken,
  getUserFromToken,
  getProjectFiles,
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
