import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// POST /api/workflows
// Body: { description: string, type?: string, projectId?: string }
export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const { description, type = "state-machine", projectId } = body;

    if (!description || typeof description !== "string") {
      return NextResponse.json(
        { error: "description is required" },
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const r = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: `You are a workflow automation expert. Generate production-ready workflow definitions including:
- State machine definitions (JSON format)
- Event handlers
- Conditional logic
- Error handling and retry logic
- Notification triggers
- Audit trail setup

Return a JSON workflow definition in \`\`\`json block plus TypeScript implementation code.`,
        },
        {
          role: "user",
          content: `Generate a ${type} workflow for:${projectId ? ` (Project: ${projectId})` : ""}\n${description}`,
        },
      ],
    } as Parameters<typeof client.responses.create>[0]);

    const result = (r as { output_text?: string }).output_text ?? "";

    // Extract JSON workflow definition
    const jsonMatch = result.match(/```json\n([\s\S]*?)```/);
    let workflow = null;
    if (jsonMatch) {
      try {
        workflow = JSON.parse(jsonMatch[1]);
      } catch {
        // Ignore parse errors
      }
    }

    return NextResponse.json({ ok: true, result, workflow });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
