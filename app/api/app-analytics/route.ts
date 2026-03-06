import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    description:
      "Mobile app analytics integration. Accepts { platform: string, analytics: string[] } and returns generated integration code for the requested analytics SDKs.",
  });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      platform?: string;
      analytics?: string[];
    };

    const { platform, analytics } = body;

    if (!platform || !analytics || analytics.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: platform and analytics" },
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
            "You are a mobile analytics expert. Generate integration code for the specified analytics providers on the given platform. Include SDK initialization, event tracking examples, and screen tracking. Return clean, production-ready code with brief inline comments.",
        },
        {
          role: "user",
          content: JSON.stringify({ platform, analytics }),
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
