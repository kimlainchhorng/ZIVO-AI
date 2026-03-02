import { NextResponse } from "next/server";
import { AgentCoordinator } from "../../../agents/coordinator";
import type { AgentType } from "../../../lib/types";

export const runtime = "nodejs";

const VALID_AGENTS: AgentType[] = ["architect", "ui", "backend", "qa", "devops"];

// POST /api/agents
// Body: { agent: AgentType, prompt: string, context?: object, multi?: boolean, tasks?: array }
export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { agent, prompt, context, multi, tasks, projectDescription } = body;

    const coordinator = new AgentCoordinator();

    // Full project build with all agents
    if (body.action === "build_project") {
      if (!projectDescription || typeof projectDescription !== "string") {
        return NextResponse.json(
          { error: "projectDescription is required for build_project" },
          { status: 400 }
        );
      }
      const results = await coordinator.buildProject(projectDescription, context);
      return NextResponse.json({ ok: true, results });
    }

    // Multi-agent parallel run
    if (multi && Array.isArray(tasks)) {
      const results = await coordinator.runMultiAgent(tasks);
      return NextResponse.json({ ok: true, results });
    }

    // Single agent run
    if (!agent || !VALID_AGENTS.includes(agent)) {
      return NextResponse.json(
        { error: `agent must be one of: ${VALID_AGENTS.join(", ")}` },
        { status: 400 }
      );
    }
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const result = await coordinator.runAgent(agent as AgentType, prompt, context);
    return NextResponse.json({ ok: true, result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
