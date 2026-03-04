import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

interface CodeReviewBody {
  code: string;
  language?: string;
  framework?: string;
}

interface ReviewIssue {
  severity: "error" | "warning" | "info";
  category: string;
  message: string;
  line?: number;
  suggestion: string;
}

interface CodeReviewResult {
  issues: ReviewIssue[];
  summary: string;
  score: number;
  recommendations: string[];
}

function _clampScore(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function isReviewIssue(value: unknown): value is ReviewIssue {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    (obj.severity === "error" || obj.severity === "warning" || obj.severity === "info") &&
    typeof obj.category === "string" &&
    typeof obj.message === "string" &&
    typeof obj.suggestion === "string" &&
    (obj.line === undefined || typeof obj.line === "number")
  );
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 500 });
  }

  const body = await req.json().catch(() => ({})) as Partial<CodeReviewBody>;
  const { code, language, framework } = body;

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Missing required field: code (string)." }, { status: 400 });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const contextParts: string[] = [];
  if (language) contextParts.push(`Language: ${language}`);
  if (framework) contextParts.push(`Framework: ${framework}`);
  const context = contextParts.length ? `\n${contextParts.join("\n")}` : "";

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are an expert code reviewer. Review the code for security vulnerabilities (OWASP Top 10), performance issues, accessibility (WCAG 2.1 AA), code smells, TypeScript type safety, and test coverage gaps. Return JSON with: issues (array of {severity: 'error'|'warning'|'info', category: string, message: string, line?: number, suggestion: string}), summary (string), score (0-100 number), recommendations (string[]).",
      },
      {
        role: "user",
        content: `Review the following code:${context}\n\n${code}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response as JSON." }, { status: 500 });
  }

  const rawIssues = Array.isArray(parsed.issues) ? parsed.issues : [];
  const result: CodeReviewResult = {
    issues: rawIssues.filter(isReviewIssue),
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    score: typeof parsed.score === "number" ? _clampScore(parsed.score) : 0,
    recommendations: Array.isArray(parsed.recommendations)
      ? (parsed.recommendations as unknown[]).filter((r): r is string => typeof r === "string")
      : [],
  };

  return NextResponse.json(result);
}
