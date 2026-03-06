import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    description:
      "Canary deployment config generator. POST { service: string, percentage: number, metrics: string[] } to generate a canary rollout configuration.",
  });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a site reliability engineer specializing in progressive delivery. Generate a canary deployment configuration for the given service, traffic percentage, and observability metrics. Include rollout strategy, health check thresholds, automatic rollback triggers based on the provided metrics, and step-by-step traffic shifting plan. Return a structured YAML configuration with explanatory comments.",
        },
        { role: "user", content: JSON.stringify(body) },
      ],
    });
    const result = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
