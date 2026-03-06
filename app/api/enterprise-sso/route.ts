import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    description:
      "Enterprise SSO configuration generator. Accepts { protocol: 'saml'|'oidc', provider: string } and returns a complete SSO configuration for the specified protocol and identity provider.",
  });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      protocol?: "saml" | "oidc";
      provider?: string;
    };

    const { protocol, provider } = body;

    if (!protocol || !["saml", "oidc"].includes(protocol)) {
      return NextResponse.json(
        { error: "Missing or invalid protocol. Must be 'saml' or 'oidc'" },
        { status: 400 }
      );
    }

    if (!provider) {
      return NextResponse.json(
        { error: "Missing required field: provider" },
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
            "You are an enterprise SSO expert. Generate a complete SSO integration configuration for the specified protocol and identity provider. Include all required metadata, attribute mappings, TypeScript middleware/callback handlers, and step-by-step setup instructions. Return clean, production-ready code and configuration with brief inline comments.",
        },
        {
          role: "user",
          content: JSON.stringify({ protocol, provider }),
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
