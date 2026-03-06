import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    description:
      "Stream processing pipeline generator. Accepts { provider: 'kafka'|'redis-streams', pipeline: string } and returns generated stream processing pipeline configuration and code.",
  });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      provider?: "kafka" | "redis-streams";
      pipeline?: string;
    };

    const { provider, pipeline } = body;

    if (!provider || !["kafka", "redis-streams"].includes(provider)) {
      return NextResponse.json(
        { error: "Missing or invalid provider. Must be 'kafka' or 'redis-streams'" },
        { status: 400 }
      );
    }

    if (!pipeline) {
      return NextResponse.json(
        { error: "Missing required field: pipeline" },
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a stream processing expert. Generate a complete TypeScript stream processing pipeline for the specified provider based on the pipeline description. Include source, transform, sink stages, error handling, backpressure management, and monitoring hooks. Return clean, production-ready code with brief inline comments.",
        },
        {
          role: "user",
          content: JSON.stringify({ provider, pipeline }),
        },
      ],
    });

    const result = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
