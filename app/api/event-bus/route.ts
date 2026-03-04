import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    description:
      "Event bus configuration generator. Accepts { provider: 'kafka'|'redis'|'rabbitmq', events: string[] } and returns a generated event bus configuration and producer/consumer boilerplate.",
  });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      provider?: "kafka" | "redis" | "rabbitmq";
      events?: string[];
    };

    const { provider, events } = body;

    if (!provider || !["kafka", "redis", "rabbitmq"].includes(provider)) {
      return NextResponse.json(
        { error: "Missing or invalid provider. Must be 'kafka', 'redis', or 'rabbitmq'" },
        { status: 400 }
      );
    }

    if (!events || events.length === 0) {
      return NextResponse.json(
        { error: "Missing required field: events (non-empty array)" },
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
            "You are a distributed systems expert. Generate a complete event bus configuration and TypeScript producer/consumer boilerplate for the specified provider. Include connection setup, typed event schemas, error handling, and retry logic. Return clean, production-ready code with brief inline comments.",
        },
        {
          role: "user",
          content: JSON.stringify({ provider, events }),
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
