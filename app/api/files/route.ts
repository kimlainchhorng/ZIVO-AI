import OpenAI from "openai";
import { NextResponse } from "next/server";
import type { GeneratorOutput } from "../../../lib/types";

export const runtime = "nodejs";

// POST /api/files
// Body: { prompt: string, projectId?: string, context?: object }
export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const { prompt, projectId, context } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const contextStr = context ? `\n\nProject context:\n${JSON.stringify(context, null, 2)}` : "";

    const r = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: `You are a code file generator. Generate complete, production-ready files.

ALWAYS format output as:
1. For each file use:
\`\`\`file:path/to/file.ts
// complete file content
\`\`\`

2. List any files to delete as:
## DELETE
- path/to/old-file.ts

3. Show directory structure as:
## DIRECTORY STRUCTURE
\`\`\`
src/
  components/
    Button.tsx
\`\`\`

4. List action items as:
## ACTION ITEMS
- Install X dependency
- Update Y config

Generate complete, working files with all imports and proper TypeScript types.`,
        },
        {
          role: "user",
          content: `Generate files for:${projectId ? ` (Project: ${projectId})` : ""}\n${prompt}${contextStr}`,
        },
      ],
    } as Parameters<typeof client.responses.create>[0]);

    const result = (r as { output_text?: string }).output_text ?? "";

    // Parse files from response
    const files: GeneratorOutput["files"] = [];
    const fileRegex = /```file:([^\n]+)\n([\s\S]*?)```/g;
    let match;
    while ((match = fileRegex.exec(result)) !== null) {
      const path = match[1].trim();
      const ext = path.split(".").pop() ?? "";
      const langMap: Record<string, string> = {
        ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
        css: "css", html: "html", json: "json", sql: "sql", md: "markdown",
      };
      files.push({
        path,
        content: match[2].trim(),
        action: "create",
        language: langMap[ext] ?? "text",
      });
    }

    // Parse deletions
    const deletionMatch = result.match(/## DELETE\n([\s\S]*?)(?=##|$)/);
    const deletions: string[] = [];
    if (deletionMatch) {
      const lines = deletionMatch[1].split("\n");
      for (const line of lines) {
        const trimmed = line.replace(/^-\s*/, "").trim();
        if (trimmed) deletions.push(trimmed);
      }
    }

    // Parse directory structure
    const structureMatch = result.match(/## DIRECTORY STRUCTURE\n```\n([\s\S]*?)```/);
    const directory_structure = structureMatch?.[1]?.trim() ?? "";

    // Parse action items
    const actionMatch = result.match(/## ACTION ITEMS\n([\s\S]*?)(?=##|$)/);
    const action_items: string[] = [];
    if (actionMatch) {
      const lines = actionMatch[1].split("\n");
      for (const line of lines) {
        const trimmed = line.replace(/^-\s*/, "").trim();
        if (trimmed) action_items.push(trimmed);
      }
    }

    const output: GeneratorOutput = {
      files,
      deletions,
      directory_structure,
      action_items,
    };

    return NextResponse.json({ ok: true, output, raw: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
