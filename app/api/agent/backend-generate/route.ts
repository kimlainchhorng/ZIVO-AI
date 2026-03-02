import { NextResponse } from "next/server";
import { BackendAgent } from "@/agents/backend-agent";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const { projectId, description, apiPaths, databaseSchema, options } = body;

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }
    if (!description || typeof description !== "string") {
      return NextResponse.json({ error: "description is required" }, { status: 400 });
    }

    const agent = new BackendAgent(apiKey);
    const result = await agent.generate({ projectId, description, apiPaths, databaseSchema, options });

    if (result.error) {
      return NextResponse.json({ error: result.error, raw: result.raw }, { status: 422 });
    }

    return NextResponse.json({ ok: true, code: result.code });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
