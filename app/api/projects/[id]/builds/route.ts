import { NextResponse } from "next/server";
import {
  extractBearerToken,
  getUserFromToken,
  createAuthedClient,
  getProjectById,
} from "@/lib/db/projects-db";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** GET /api/projects/[id]/builds — list build history for a project. */
export async function GET(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const token = extractBearerToken(req.headers.get("Authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const project = await getProjectById(token, id);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    if (project.owner_user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const client = createAuthedClient(token);
    const { data: builds, error } = await client
      .from("project_builds")
      .select("*")
      .eq("project_id", id)
      .order("build_number", { ascending: false });

    if (error) throw new Error(error.message);

    return NextResponse.json({ builds: builds ?? [] });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message ?? "Failed to list builds" },
      { status: 500 }
    );
  }
}
