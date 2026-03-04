import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    description:
      "SCIM provisioning API generator. Accepts { provider: string, attributes: string[] } and returns a complete SCIM 2.0 provisioning configuration and endpoint handlers for the specified identity provider.",
  });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      provider?: string;
      attributes?: string[];
    };

    const { provider, attributes } = body;

    if (!provider || !attributes || attributes.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: provider and attributes (non-empty array)" },
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
            "You are a SCIM 2.0 provisioning expert. Generate a complete SCIM configuration including schema definitions for the specified attributes, SCIM endpoint handlers (Users, Groups), attribute mappings for the given identity provider, and TypeScript Next.js API route code. Include bearer token authentication and proper SCIM response formatting. Return clean, production-ready code with brief inline comments.",
        },
        {
          role: "user",
          content: JSON.stringify({ provider, attributes }),
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
