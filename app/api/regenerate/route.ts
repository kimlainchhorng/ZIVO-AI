import { getOpenAIClient } from "@/lib/openai-client";
import { NextResponse } from "next/server";
import { getProjectById } from "../projects/route";

export const runtime = "nodejs";


export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { projectId, part, prompt } = body;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY in .env.local" }, { status: 500 });
    }
    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }
    if (!part || typeof part !== "string") {
      return NextResponse.json({ error: "Missing part (e.g. 'schema', 'auth', 'components', 'api')" }, { status: 400 });
    }

    const project = getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const systemPrompt = `You are a full-stack developer. Regenerate the ${part} for an existing React + Supabase application.
Return only the regenerated code/files as a JSON object: { "files": { "filename": "content" } }`;

    const userMessage = [
      `Project: ${project.name}`,
      `Description: ${project.description}`,
      `Regenerate part: ${part}`,
      prompt ? `Additional requirements: ${prompt}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const r = await getOpenAIClient().responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const text = (r as any).output_text ?? "";

    let parsed: any = null;
    try {
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[1] : text);
    } catch {
      parsed = { raw: text };
    }

    return NextResponse.json({ ok: true, part, result: parsed });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Regeneration failed" }, { status: 500 });
  }
}
