import { NextResponse } from "next/server";
import {
  getOrCreateMemory,
  getMemory,
  clearShortTerm,
  setArchitecture,
  setCurrentTask,
  listProjects,
} from "@/lib/memory";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ ok: true, projects: listProjects() });
  }

  const memory = getMemory(projectId);
  if (!memory) {
    return NextResponse.json({ ok: true, memory: null, projectId });
  }
  return NextResponse.json({ ok: true, memory, projectId });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { projectId, action, data } = body as {
      projectId?: string;
      action?: string;
      data?: Record<string, unknown>;
    };

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    switch (action) {
      case "init":
        return NextResponse.json({ ok: true, memory: getOrCreateMemory(projectId) });

      case "clear_short_term":
        clearShortTerm(projectId);
        return NextResponse.json({ ok: true, message: "Short-term memory cleared" });

      case "set_architecture":
        if (!data?.architecture || !data?.techStack) {
          return NextResponse.json({ error: "architecture and techStack required" }, { status: 400 });
        }
        setArchitecture(
          projectId,
          String(data.architecture),
          Array.isArray(data.techStack) ? data.techStack.map(String) : []
        );
        return NextResponse.json({ ok: true, message: "Architecture recorded" });

      case "set_task":
        if (!data?.task) {
          return NextResponse.json({ error: "task is required" }, { status: 400 });
        }
        setCurrentTask(projectId, String(data.task));
        return NextResponse.json({ ok: true, message: "Current task updated" });

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Memory error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
