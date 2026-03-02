import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const MODIFY_SYSTEM_PROMPT = `You are a code modification assistant.
Given existing code and a description of changes, produce the modified code.
Return ONLY valid JSON in this format:
{
  "type": "code_generation",
  "description": "...",
  "files": [
    { "path": "...", "content": "...", "language": "..." }
  ]
}`;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const { path: filePath, code, changes } = body;

    if (!filePath || typeof filePath !== "string") {
      return NextResponse.json({ error: "path is required" }, { status: 400 });
    }
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "code is required" }, { status: 400 });
    }
    if (!changes || typeof changes !== "string") {
      return NextResponse.json({ error: "changes is required" }, { status: 400 });
    }

    const client = new OpenAI({ apiKey });

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: MODIFY_SYSTEM_PROMPT },
        {
          role: "user",
          content: `File: ${filePath}\n\nCurrent code:\n\`\`\`\n${code}\n\`\`\`\n\nChanges to apply: ${changes}`,
        },
      ],
      temperature: 0.2,
    });

    const raw = response.choices[0]?.message?.content ?? "";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let result: unknown;
    try {
      result = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "Invalid JSON from model", raw }, { status: 422 });
    }

    return NextResponse.json({ ok: true, result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
