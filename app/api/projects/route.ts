import { NextResponse } from "next/server";
import {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
} from "../../../lib/project-memory";
import type { AIProject } from "../../../lib/types";

export const runtime = "nodejs";

// GET /api/projects  – list all projects
// GET /api/projects?id=xxx  – get single project
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const project = await getProject(id);
      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, project });
    }

    const projects = await listProjects();
    return NextResponse.json({ ok: true, projects });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/projects  – create project
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, description, goals, tech_stack } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const project = await createProject({
      name,
      description: description ?? "",
      goals: goals ?? [],
      tech_stack: tech_stack ?? [],
      active_pages: [],
      db_schema: {},
      recent_changes: [],
      version: "1.0.0",
      team_members: [],
      phase: "planning",
      deployment_status: "idle",
    });

    return NextResponse.json({ ok: true, project }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PATCH /api/projects  – update project
export async function PATCH(req: Request) {
  try {
    const body: Partial<AIProject> & { id: string } = await req.json().catch(() => ({})) as Partial<AIProject> & { id: string };
    const { id, ...patch } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const project = await updateProject(id, patch);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, project });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/projects?id=xxx
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const ok = await deleteProject(id);
    if (!ok) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
