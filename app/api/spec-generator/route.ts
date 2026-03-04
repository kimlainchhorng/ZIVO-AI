import { NextResponse } from "next/server";
import OpenAI from "openai";
import { SPEC_GENERATOR_PROMPTS } from "@/prompts/devops-ai-routes";

export const runtime = "nodejs";

interface SpecGeneratorBody {
  description: string;
  type: "prd" | "api" | "schema";
}

export async function GET() {
  return NextResponse.json({
    description:
      "AI-powered spec generator. Accepts a description and type (prd | api | schema) and returns a generated specification document.",
  });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as SpecGeneratorBody;
    const { description, type } = body;

    if (!description || typeof description !== "string") {
      return NextResponse.json(
        { error: "Missing required field: description" },
        { status: 400 }
      );
    }

    if (!type || !["prd", "api", "schema"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be one of: prd, api, schema" },
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = SPEC_GENERATOR_PROMPTS[type];

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Generate a ${type.toUpperCase()} specification for the following:\n\n${description}`,
        },
      ],
      temperature: 0.4,
    });

    const spec = completion.choices[0]?.message?.content ?? "";

    return NextResponse.json({ type, spec });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
