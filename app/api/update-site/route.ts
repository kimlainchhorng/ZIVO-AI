import { NextResponse } from "next/server";
import OpenAI from "openai";
import { UPDATE_SITE_SYSTEM_PROMPT } from "../../../prompts/update-site";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

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

const VALID_FILE_ACTIONS = new Set(["create", "update", "delete"]);

function isValidFile(f: unknown): f is GeneratedFile {
  if (!f || typeof f !== "object") return false;
  const { path, content, action } = f as Record<string, unknown>;
  return (
    typeof path === "string" &&
    path.length > 0 &&
    typeof content === "string" &&
    VALID_FILE_ACTIONS.has(action as string)
  );
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const updateRequest = typeof body?.updateRequest === "string" ? body.updateRequest : "";
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
          { role: "system", content: UPDATE_SITE_SYSTEM_PROMPT },
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
    parsed.files = parsed.files.filter(isValidFile);

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
