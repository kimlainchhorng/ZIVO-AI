import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

interface SeoIssue {
  category: string;
  severity: "critical" | "warning" | "info";
  message: string;
  fix: string;
}

interface SeoResult {
  score: number;
  issues: SeoIssue[];
  metaTags: Record<string, string>;
  structuredData: string;
  sitemap: string;
  robotsTxt: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({})) as {
    url?: string;
    html?: string;
    title?: string;
    description?: string;
  };

  const client = new OpenAI({ apiKey });

  const userContent = [
    body.url && `URL: ${body.url}`,
    body.title && `Title: ${body.title}`,
    body.description && `Description: ${body.description}`,
    body.html && `HTML:\n${body.html}`,
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
          "You are an SEO expert. Analyze the provided content for SEO issues. Return JSON with: score (0-100 number), issues (array of {category: string, severity: 'critical'|'warning'|'info', message: string, fix: string}), metaTags (object with suggested meta tag values), structuredData (string with JSON-LD), sitemap (string with XML sitemap), robotsTxt (string).",
      },
      { role: "user", content: userContent },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";

  let result: SeoResult;
  try {
    result = JSON.parse(raw) as SeoResult;
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

  return NextResponse.json(result);
}
