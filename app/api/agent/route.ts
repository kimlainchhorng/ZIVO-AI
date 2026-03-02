import { NextResponse } from "next/server";
import { orchestrator } from "../../../lib/orchestrator";
import { projectMemory } from "../../../lib/memory";
import type { AgentRole } from "../../../lib/orchestrator";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// POST /api/agent  – single-agent or pipeline execution
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY in environment" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // ---- Pipeline mode ----
    if (body.pipeline && Array.isArray(body.pipeline)) {
      const projectId: string = body.projectId ?? `proj-${Date.now()}`;
      const tasks = body.pipeline as Array<{ task: string; role: AgentRole }>;

      if (!tasks.length) {
        return NextResponse.json(
          { error: "Pipeline must contain at least one task" },
          { status: 400 }
        );
      }

      const results = await orchestrator.runPipeline(tasks, projectId);
      return NextResponse.json({ ok: true, projectId, results });
    }

    // ---- Single task mode ----
    const { task, role, projectId, context } = body as {
      task?: string;
      role?: AgentRole;
      projectId?: string;
      context?: Record<string, unknown>;
    };

    if (!task || typeof task !== "string") {
      return NextResponse.json(
        { error: "Field 'task' is required" },
        { status: 400 }
      );
    }

    const result = await orchestrator.route({ task, role, projectId, context });
    return NextResponse.json({ ok: true, ...result });
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// GET /api/agent  – list agents or retrieve project memory
// ---------------------------------------------------------------------------
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (projectId) {
    const snapshot = projectMemory.snapshot(projectId);
    if (!snapshot) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, memory: snapshot });
  }

  return NextResponse.json({
    ok: true,
    agents: orchestrator.listAgents(),
    projects: projectMemory.listProjects(),
  });
}
