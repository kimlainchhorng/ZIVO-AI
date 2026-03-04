import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export interface GeneratedFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface UpdateSiteResponse {
  files: GeneratedFile[];
  preview_html?: string;
  summary: string;
}

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
}

function parseJSON(text: string): UpdateSiteResponse {
  const cleaned = stripMarkdownFences(text);
  try {
    return JSON.parse(cleaned);
  } catch (parseErr) {
    console.error("[update-site] Initial JSON parse failed:", parseErr);
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("AI did not return valid JSON");
  }
}

const SYSTEM_PROMPT = `You are ZIVO AI, an expert full-stack developer. The user has an existing website and wants to make specific changes.

You will receive:
1. The current files of the website
2. The user's update request

Your job is to apply ONLY the requested changes surgically. Do not regenerate everything — only modify what the user asked for.

Return ONLY a valid JSON object with this structure:
{
  "files": [
    {
      "path": "path/to/changed/file",
      "content": "complete updated file content",
      "action": "create" | "update" | "delete"
    }
  ],
  "preview_html": "<!DOCTYPE html>...(updated self-contained HTML preview if applicable)...",
  "summary": "Brief description of what was changed"
}

Rules:
- Return ONLY the JSON object, no markdown fences, no extra text.
- Only include files that were actually changed.
- For the preview_html, regenerate it only if the visible UI changed.
- Keep all unchanged files as-is (do not include them in the response).
- Make the changes clean and consistent with the existing code style.`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const updateRequest: string = body?.updateRequest || "";
    const currentFiles: GeneratedFile[] = Array.isArray(body?.currentFiles)
      ? body.currentFiles
      : [];

    if (!updateRequest.trim()) {
      return NextResponse.json({ error: "Missing updateRequest" }, { status: 400 });
    }

    const currentFilesContext =
      currentFiles.length > 0
        ? `Current files:\n${currentFiles
            .map((f) => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
            .join("\n\n")}`
        : "No existing files provided.";

    const userMessage = `${currentFilesContext}\n\nUpdate request: ${updateRequest.trim()}`;

    let parsed: UpdateSiteResponse | null = null;
    let lastError = "";

    for (let attempt = 0; attempt < 3; attempt++) {
      const r = await getClient().chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 8000,
      });

      const text: string = r.choices[0]?.message?.content ?? "";
      try {
        parsed = parseJSON(text);
        if (Array.isArray(parsed.files)) break;
        lastError = "Invalid response structure: missing files array";
        parsed = null;
      } catch (e) {
        lastError = (e as Error).message || "AI did not return valid JSON";
      }
    }

    if (!parsed) {
      return NextResponse.json(
        { error: lastError || "AI did not return valid JSON" },
        { status: 502 }
      );
    }

    if (!Array.isArray(parsed.files)) {
      parsed.files = [];
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
