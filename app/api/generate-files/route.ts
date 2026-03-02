import { NextResponse } from "next/server";
import { CodeGeneratorAgent } from "../../../agents/code-generator-agent";
import type { GenerateFilesRequest } from "../../../lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as Partial<GenerateFilesRequest>;
    const { prompt, project_id, context } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const agent = new CodeGeneratorAgent(apiKey);
    const result = await agent.generateFiles({
      prompt,
      project_id: project_id ?? "local",
      context,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
