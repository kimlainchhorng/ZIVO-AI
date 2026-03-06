import { NextResponse } from "next/server";
import {
  extractBearerToken,
  getUserFromToken,
  listUserProjects,
  createProject as dbCreateProject,
} from "@/lib/db/projects-db";

export const runtime = "nodejs";

/** GET /api/projects — list current user's projects (requires auth). */
export async function GET(req: Request) {
  const token = extractBearerToken(req.headers.get("Authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const projects = await listUserProjects(token);
    return NextResponse.json({ projects });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message ?? "Failed to list projects" },
      { status: 500 }
    );
  }
}

/** POST /api/projects — create a new project (requires auth). */
export async function POST(req: Request) {
  const token = extractBearerToken(req.headers.get("Authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { title?: string; mode?: string; template?: string; client_idea?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const project = await dbCreateProject(token, user.id, {
      title: body.title,
      mode: (["code", "website_v2", "mobile_v2"].includes(body.mode ?? "")
        ? body.mode
        : "code") as "code" | "website_v2" | "mobile_v2",
      template: body.template,
      client_idea: body.client_idea,
    });
    return NextResponse.json({ project }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message ?? "Failed to create project" },
      { status: 500 }
    );
  }
}
