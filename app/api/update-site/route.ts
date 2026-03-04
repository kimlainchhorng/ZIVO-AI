import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface SiteFile {
  path: string;
  content: string;
  action?: "create" | "update" | "delete";
}

export interface UpdateSiteRequest {
  currentFiles: SiteFile[];
  updateRequest: string;
}

export interface UpdateSiteResponse {
  files: SiteFile[];
  preview_html?: string;
  summary: string;
  updated_paths: string[];
}

const SYSTEM_PROMPT = `You are ZIVO AI — an expert full-stack developer that surgically updates website files based on user requests.

You will receive the current project files and an update request. Your job is to:
1. Identify only the files that need to change.
2. Return ONLY the modified or newly created files — do NOT include unchanged files.
3. Be surgical: change only what the user asks, preserve everything else.

You are proficient in: TypeScript, JavaScript, HTML, CSS, TailwindCSS, Next.js App Router, Framer Motion, ShadCN UI, React.

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "files": [
    { "path": "app/page.tsx", "content": "...(full updated file content)...", "action": "update" }
  ],
  "preview_html": "<!DOCTYPE html>...(optional: updated self-contained HTML preview)...",
  "summary": "Brief description of what was changed",
  "updated_paths": ["app/page.tsx"]
}

Rules:
- Return ONLY the files that were modified or created.
- Each returned file must have its FULL content, not just the diff.
- The \`action\` field should be "update" for existing files, "create" for new files, "delete" for removed files.
- If the update requires a new file, include it with action "create".
- Keep the same code style as the existing files.`;

function stripCodeFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

function parseJSON(text: string): UpdateSiteResponse {
  const clean = stripCodeFences(text);
  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("AI did not return valid JSON");
  }
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is missing" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const currentFiles: SiteFile[] = Array.isArray(body?.currentFiles) ? body.currentFiles : [];
    const updateRequest: string = body?.updateRequest || "";

    if (!updateRequest.trim()) {
      return NextResponse.json({ error: "Missing updateRequest" }, { status: 400 });
    }

    if (currentFiles.length === 0) {
      return NextResponse.json({ error: "Missing currentFiles" }, { status: 400 });
    }

    const filesContext = currentFiles
      .map((f) => `// FILE: ${f.path}\n${f.content}`)
      .join("\n\n---\n\n");

    const userPrompt = `Current project files:\n\n${filesContext}\n\n---\n\nUpdate request: ${updateRequest.trim()}`;

    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await getClient().chat.completions.create({
          model: "gpt-4o",
          temperature: 0.2,
          max_tokens: 6000,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
        });

        const text = response.choices?.[0]?.message?.content ?? "{}";
        const parsed = parseJSON(text);

        if (!Array.isArray(parsed.files)) {
          throw new Error("Invalid response: missing files array");
        }

        if (!Array.isArray(parsed.updated_paths)) {
          parsed.updated_paths = parsed.files.map((f) => f.path);
        }

        return NextResponse.json(parsed);
      } catch (err) {
        lastError = err as Error;
        if (attempt < 2) continue;
      }
    }

    return NextResponse.json(
      { error: lastError?.message || "Failed to update site" },
      { status: 502 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
