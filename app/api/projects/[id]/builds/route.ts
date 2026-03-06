import { NextResponse } from "next/server";
import {
  extractBearerToken,
  getUserFromToken,
  getProjectById,
  listProjectBuilds,
} from "@/lib/db/projects-db";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** GET /api/projects/[id]/builds — list builds for a project. */
export async function GET(req: Request, { params }: RouteParams) {
  const { id } = await params;

  const token = extractBearerToken(req.headers.get("Authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const project = await getProjectById(token, id);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const builds = await listProjectBuilds(token, id);
    return NextResponse.json({ builds });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message ?? "Failed to list builds" },
      { status: 500 }
    );
  }
}
