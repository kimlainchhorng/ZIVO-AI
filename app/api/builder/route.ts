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
  thinking?: string;
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
        model: "gpt-4o",
        messages: [
          { role: "system", content: CODE_BUILDER_PLAN_PROMPT },
          { role: "user", content: prompt.trim() },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      });
      const text: string = r.choices[0]?.message?.content ?? "";
      let parsed: { plan: string };
      try {
        parsed = parseBuilderJSON(text) as unknown as { plan: string };
      } catch {
        return NextResponse.json({ error: "AI did not return valid JSON", raw: text }, { status: 502 });
      }
      if (typeof parsed.plan !== "string") {
        return NextResponse.json({ error: "AI plan response missing 'plan' field", raw: text }, { status: 502 });
      }
      return NextResponse.json({ plan: parsed.plan });
    }

    // Full code generation with retry
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const r = await getClient().chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: CODE_BUILDER_SYSTEM_PROMPT },
            { role: "user", content: prompt.trim() },
          ],
          temperature: 0.2,
          max_tokens: 16000,
        });
        const text = r.choices[0]?.message?.content ?? "";
        const parsed = parseBuilderJSON(text);
        if (!Array.isArray(parsed.files) || parsed.files.length === 0) {
          throw new Error("AI returned no files");
        }
        return NextResponse.json(parsed);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`[builder] Attempt ${attempt} failed:`, lastError.message);
        if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
    return NextResponse.json(
      { error: lastError?.message ?? "Failed after 3 attempts" },
      { status: 502 }
    );
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error)?.message || "Server error" }, { status: 500 });
  }
}
