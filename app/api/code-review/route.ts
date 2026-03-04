import { NextResponse } from "next/server";
import OpenAI from "openai";
import { stripMarkdownFences } from "../../../lib/code-parser";

export const runtime = "nodejs";

interface GeneratedFile {
  path: string;
  content: string;
}

interface ReviewIssue {
  severity: "error" | "warning" | "info";
  category: string;
  message: string;
  line?: number;
  suggestion: string;
}

interface CodeReview {
  security: string[];
  performance: string[];
  quality: string[];
  bestPractices: string[];
  accessibility: string[];
}

interface CodeReviewResult {
  /** Structured review by category (new files-based interface) */
  review?: CodeReview;
  /** Flat issues list (legacy code-string interface) */
  issues?: ReviewIssue[];
  summary?: string;
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

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { files, focusAreas, code, language, framework } = body as {
    files?: unknown;
    focusAreas?: string[];
    code?: string;
    language?: string;
    framework?: string;
  };

  const client = getClient();

  // ── New interface: files array ─────────────────────────────────────────────
  if (Array.isArray(files)) {
    for (const f of files) {
      if (!f || typeof (f as GeneratedFile).path !== "string" || typeof (f as GeneratedFile).content !== "string") {
        return NextResponse.json(
          { error: "Each file must have path (string) and content (string)" },
          { status: 400 }
        );
      }
    }

    const fileArray = files as GeneratedFile[];
    const hasTsx = fileArray.some((f) => f.path.endsWith(".tsx"));
    const focusSection = focusAreas?.length ? `\nFocus especially on: ${focusAreas.join(", ")}` : "";
    const filesSummary = fileArray
      .slice(0, 8)
      .map((f) => `// ${f.path}\n${f.content.slice(0, 1000)}`)
      .join("\n\n---\n\n");

    const prompt = `Perform a comprehensive code review. Return a JSON object:
{
  "review": {
    "security": ["issue1", ...],
    "performance": ["issue1", ...],
    "quality": ["issue1", ...],
    "bestPractices": ["issue1", ...],
    "accessibility": ["issue1", ...]
  },
  "score": <0-100>,
  "recommendations": ["rec1", ...]
}
${focusSection}${hasTsx ? "\nInclude accessibility review for TSX components." : ""}

Files:\n${filesSummary}\n\nRespond ONLY with the JSON object.`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 2048,
      messages: [
        { role: "system", content: "You are a senior software engineer performing a thorough code review." },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let result: CodeReviewResult = {
      review: { security: [], performance: [], quality: [], bestPractices: [], accessibility: [] },
      score: 0,
      recommendations: [],
    };
    try {
      result = JSON.parse(stripMarkdownFences(raw)) as CodeReviewResult;
    } catch {
      // Return empty result on parse failure
    }
    return NextResponse.json(result);
  }

  // ── Legacy interface: code string ──────────────────────────────────────────
  if (!code || typeof code !== "string") {
    return NextResponse.json(
      { error: "Provide either 'files' (array) or 'code' (string)" },
      { status: 400 }
    );
  }

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
  const legacyResult: CodeReviewResult = {
    issues: rawIssues.filter(isReviewIssue),
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    score: typeof parsed.score === "number" ? _clampScore(parsed.score) : 0,
    recommendations: Array.isArray(parsed.recommendations)
      ? (parsed.recommendations as unknown[]).filter((r): r is string => typeof r === "string")
      : [],
  };

  return NextResponse.json(legacyResult);
}
