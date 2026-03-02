import { NextResponse } from "next/server";
import { ArchitectAgent } from "@/agents/architect-agent";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const { projectId, description, requirements, options } = body;

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }
    if (!description || typeof description !== "string") {
      return NextResponse.json({ error: "description is required" }, { status: 400 });
    }

    const agent = new ArchitectAgent(apiKey);
    const result = await agent.plan({ projectId, description, requirements, options });

    if (result.error) {
      return NextResponse.json({ error: result.error, raw: result.raw }, { status: 422 });
    }

    return NextResponse.json({ ok: true, architecture: result.architecture });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
