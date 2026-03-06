import { NextResponse } from "next/server";
import OpenAI from "openai";
import { stripMarkdownFences } from "../../../lib/code-parser";

export const runtime = "nodejs";

interface ErrorAnalysis {
  error: string;
  root_cause: string;
  explanation: string;
  severity: "critical" | "high" | "medium" | "low";
  fix_summary: string;
}

interface SuggestedFix {
  error: string;
  fix: string;
  code?: string;
}

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { errors, language = "typescript", context } = body as {
      errors: unknown;
      language?: "typescript" | "python" | "javascript";
      context?: string;
    };

    if (!Array.isArray(errors) || errors.length === 0) {
      return NextResponse.json({ error: "errors must be a non-empty array" }, { status: 400 });
    }

    const contextSection = context ? `\nContext:\n${context}` : "";
    const prompt = `Analyze these ${language} errors and return a JSON object with:\n{\n  "analyses": [{"error":"...","root_cause":"...","explanation":"...","severity":"critical|high|medium|low","fix_summary":"..."}],\n  "fixes": [{"error":"...","fix":"...","code":"..."}]\n}\n\nErrors:\n${(errors as string[]).join("\n")}${contextSection}\n\nRespond ONLY with the JSON object.`;

    const completion = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 2048,
      messages: [
        { role: "system", content: "You are an expert code debugger. Analyze errors and provide actionable fixes." },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let result: { analyses: ErrorAnalysis[]; fixes: SuggestedFix[] } = { analyses: [], fixes: [] };
    try {
      result = JSON.parse(stripMarkdownFences(raw)) as typeof result;
    } catch {
      result = { analyses: [], fixes: [] };
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
