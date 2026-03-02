import { getOpenAIClient } from "@/lib/openai-client";
import { NextResponse } from "next/server";
import { getProjectById } from "../projects/route";

export const runtime = "nodejs";


export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { projectId, feature, prompt } = body;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY in .env.local" }, { status: 500 });
    }
    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }
    if (!feature || typeof feature !== "string") {
      return NextResponse.json({ error: "Missing feature name" }, { status: 400 });
    }

    const project = getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const systemPrompt = `You are a full-stack developer. Add a new feature to an existing React + Supabase application.
Return the new/modified files as a JSON object:
{
  "feature": "string",
  "description": "string",
  "files": { "filename": "content" },
  "migrations": ["SQL statements if schema changes needed"],
  "instructions": "string"
}`;

    const userMessage = [
      `Project: ${project.name} - ${project.description}`,
      `Add feature: ${feature}`,
      prompt ? `Details: ${prompt}` : "",
      `Existing features: ${project.features.join(", ")}`,
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

    return NextResponse.json({ ok: true, result: parsed });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Feature addition failed" }, { status: 500 });
  }
}
