import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    description:
      "Multi-tenant billing setup generator. Accepts { features: string[], tiers: string[] } and returns a Stripe metered billing configuration with product, price, and meter definitions.",
  });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      features?: string[];
      tiers?: string[];
    };

    const { features, tiers } = body;

    if (!features || features.length === 0 || !tiers || tiers.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: features and tiers (non-empty arrays)" },
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
            "You are a Stripe billing expert specializing in multi-tenant SaaS. Generate a complete Stripe metered billing configuration including Products, Prices (metered and recurring), Meters for usage tracking, entitlement mapping per tier, and TypeScript code for usage reporting. Return clean, production-ready code with brief inline comments.",
        },
        {
          role: "user",
          content: JSON.stringify({ features, tiers }),
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
