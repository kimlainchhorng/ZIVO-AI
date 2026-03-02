import { NextResponse } from "next/server";
import { MultiAgentOrchestrator } from "../../../agents/orchestrator";
import type { MultiAgentRequest } from "../../../lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = (await req.json().catch(() => ({}))) as Partial<MultiAgentRequest>;
    const { task, project_id, context, agents } = body;

    if (!task || typeof task !== "string") {
      return NextResponse.json({ error: "task is required" }, { status: 400 });
    }

    const orchestrator = new MultiAgentOrchestrator(apiKey);
    const result = await orchestrator.run({
      task,
      project_id,
      context,
      agents,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
