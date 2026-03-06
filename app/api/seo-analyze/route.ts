import { NextResponse } from "next/server";
import OpenAI from "openai";
import { analyzeSEO } from "@/lib/ai/seo-analyzer";

export const runtime = "nodejs";

interface GeneratedFile {
  path: string;
  content: string;
  action?: string;
}

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { files?: GeneratedFile[] };
  const { files = [] } = body;

  const report = analyzeSEO(files);

  // AI-powered recommendations
  if (process.env.OPENAI_API_KEY && report.issues.length > 0) {
    try {
      const client = getClient();
      const issuesSummary = report.issues
        .slice(0, 5)
        .map((i) => `${i.severity}: ${i.rule} - ${i.description}`)
        .join("\n");
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an SEO expert. Give 3 concise actionable recommendations.",
          },
          {
            role: "user",
            content: `Top SEO issues found:\n${issuesSummary}\nGive 3 specific recommendations.`,
          },
        ],
        max_tokens: 300,
      });
      const aiText = completion.choices[0]?.message?.content ?? "";
      const aiRecs = aiText
        .split("\n")
        .filter((l) => l.trim().length > 0)
        .slice(0, 3);
      report.recommendations = [...aiRecs, ...report.recommendations].slice(0, 10);
    } catch {
      // OpenAI call failed, use static recommendations only
    }
  }

  return NextResponse.json(report);
}
