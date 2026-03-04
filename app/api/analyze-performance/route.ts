import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

interface PerformanceIssue {
  category: string;
  severity: "critical" | "warning" | "info";
  message: string;
  fix: string;
}

interface PerformanceResult {
  score: number;
  issues: PerformanceIssue[];
  recommendations: string[];
  estimatedImprovements: Record<string, string>;
}

export async function POST(req: Request): Promise<NextResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({})) as {
    url?: string;
    code?: string;
    framework?: string;
  };

  const client = new OpenAI({ apiKey });

  const userContent = [
    body.url && `URL: ${body.url}`,
    body.framework && `Framework: ${body.framework}`,
    body.code && `Code:\n${body.code}`,
  ]
    .filter(Boolean)
    .join("\n") || "No input provided.";

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a web performance expert. Analyze the provided URL or code for performance issues. Return JSON with: score (0-100 number), issues (array of {category: string, severity: 'critical'|'warning'|'info', message: string, fix: string}), recommendations (string[]), estimatedImprovements (object with keys: lcp, fid, cls - each a string like '+20%').",
      },
      { role: "user", content: userContent },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";

  let result: PerformanceResult;
  try {
    result = JSON.parse(raw) as PerformanceResult;
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

  return NextResponse.json(result);
}
