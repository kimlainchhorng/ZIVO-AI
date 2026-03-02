import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type FileAction = "create" | "update" | "delete";

export interface GeneratedFile {
  path: string;
  action: FileAction;
  content: string;
  language: string;
}

export interface BuilderResponse {
  files: GeneratedFile[];
  summary: string;
}

const SYSTEM_PROMPT = `You are an expert full-stack developer AI assistant. Your task is to generate complete, production-ready code files for a Next.js TypeScript application.

When given a description, respond ONLY with a valid JSON object matching this exact schema:
{
  "files": [
    {
      "path": "relative/file/path.ts",
      "action": "create" | "update" | "delete",
      "content": "complete file content as a string",
      "language": "typescript" | "javascript" | "css" | "json" | "sql" | "markdown"
    }
  ],
  "summary": "brief description of what was generated"
}

Rules:
- Return ONLY the JSON object, no markdown fences, no extra text.
- Generate minimal working code that follows Next.js App Router best practices.
- Include proper TypeScript types.
- Organize imports alphabetically.
- Add concise comments only where needed.
- File paths should be relative to the project root (e.g. "app/page.tsx").
- For delete actions, content should be an empty string.`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY in environment" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const prompt = body?.prompt;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Missing or invalid prompt" }, { status: 400 });
    }

    const r = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt.trim() },
      ],
      temperature: 0.2,
    });

    const text: string = r.choices[0]?.message?.content ?? "";

    let parsed: BuilderResponse;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Attempt to extract JSON if the model wrapped it
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json(
          { error: "AI did not return valid JSON", raw: text },
          { status: 502 }
        );
      }
      parsed = JSON.parse(match[0]);
    }

    if (!Array.isArray(parsed.files)) {
      return NextResponse.json(
        { error: "Invalid response structure: missing files array" },
        { status: 502 }
      );
    }

    const validActions: FileAction[] = ["create", "update", "delete"];
    for (const file of parsed.files) {
      if (!file.path || typeof file.path !== "string") {
        return NextResponse.json({ error: "File missing path" }, { status: 502 });
      }
      if (!validActions.includes(file.action)) {
        return NextResponse.json(
          { error: `Invalid file action: ${file.action}` },
          { status: 502 }
        );
      }
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error)?.message || "Server error" }, { status: 500 });
  }
}
