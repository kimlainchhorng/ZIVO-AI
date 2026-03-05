import { NextResponse } from "next/server";
import {
  createProject,
  getProject,
  updateProject,
  addFiles,
  addConversationTurn,
  listProjects,
  deleteProject,
} from "@/lib/project-memory";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");

  if (projectId) {
    const project = getProject(projectId);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    return NextResponse.json({ project });
  }

  return NextResponse.json({ projects: listProjects() });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { action, projectId, prompt, files, role, content, updates } = body as {
    action: "create" | "update" | "add-files" | "add-message" | "delete";
    projectId?: string;
    prompt?: string;
    files?: { path: string; content: string }[];
    role?: "user" | "assistant";
    content?: string;
    updates?: Record<string, unknown>;
  };

  switch (action) {
    case "create": {
      const id = projectId ?? randomUUID();
      const project = createProject(id, prompt ?? "");
      return NextResponse.json({ project }, { status: 201 });
    }
    case "update": {
      if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });
      const project = updateProject(projectId, updates ?? {});
      return NextResponse.json({ project });
    }
    case "add-files": {
      if (!projectId || !files)
        return NextResponse.json({ error: "projectId and files required" }, { status: 400 });
      addFiles(projectId, files);
      return NextResponse.json({ success: true });
    }
    case "add-message": {
      if (!projectId || !role || !content)
        return NextResponse.json(
          { error: "projectId, role, content required" },
          { status: 400 }
        );
      addConversationTurn(projectId, role, content);
      return NextResponse.json({ success: true });
    }
    case "delete": {
      if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });
      deleteProject(projectId);
      return NextResponse.json({ success: true });
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
