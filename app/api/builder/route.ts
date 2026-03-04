import OpenAI from "openai";
import { NextResponse } from "next/server";
import { CODE_BUILDER_SYSTEM_PROMPT, CODE_BUILDER_PLAN_PROMPT } from "../../../prompts/code-builder";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export type FileAction = "create" | "update" | "delete";

export interface GeneratedFile {
  path: string;
  action: FileAction;
  content: string;
  language: string;
}

export interface BuilderResponse {
  files: GeneratedFile[];
  commands?: string[];
  summary: string;
}

function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
}

function parseBuilderJSON(text: string): BuilderResponse {
  const cleaned = stripMarkdownFences(text);
  try {
    return JSON.parse(cleaned);
  } catch (parseErr) {
    console.error("[builder] Initial JSON parse failed:", parseErr);
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("AI did not return valid JSON");
  }
}

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
    const planOnly = Boolean(body?.planOnly);

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Missing or invalid prompt" }, { status: 400 });
    }

    if (planOnly) {
      const r = await getClient().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: CODE_BUILDER_PLAN_PROMPT },
          { role: "user", content: prompt.trim() },
        ],
        temperature: 0.3,
      });
      const text: string = r.choices[0]?.message?.content ?? "";
      let parsed: { plan: string };
      try {
        parsed = parseBuilderJSON(text) as unknown as { plan: string };
      } catch {
        return NextResponse.json({ error: "AI did not return valid JSON", raw: text }, { status: 502 });
      }
      if (typeof parsed.plan !== "string") {
        return NextResponse.json({ error: "Invalid plan response structure" }, { status: 502 });
      }
      return NextResponse.json(parsed);
    }

    // Retry up to 3 attempts if JSON is invalid
    let parsed: BuilderResponse | null = null;
    let lastError = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      const r = await getClient().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: CODE_BUILDER_SYSTEM_PROMPT },
          { role: "user", content: prompt.trim() },
        ],
        temperature: 0.2,
      });

      const text: string = r.choices[0]?.message?.content ?? "";

      try {
        parsed = parseBuilderJSON(text);
        if (Array.isArray(parsed.files)) break;
        lastError = "Invalid response structure: missing files array";
        parsed = null;
      } catch (e) {
        lastError = (e as Error).message || "AI did not return valid JSON";
      }
    }

    if (!parsed) {
      return NextResponse.json({ error: lastError || "AI did not return valid JSON" }, { status: 502 });
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
