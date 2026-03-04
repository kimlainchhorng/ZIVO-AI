import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    description:
      "API connector builder. Accepts { openApiSpec: string, language: string } and returns a fully typed SDK client generated from the provided OpenAPI specification.",
  });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      openApiSpec?: string;
      language?: string;
    };

    const { openApiSpec, language } = body;

    if (!openApiSpec || !language) {
      return NextResponse.json(
        { error: "Missing required fields: openApiSpec and language" },
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
            "You are an API SDK expert. Given an OpenAPI specification and a target language, generate a fully typed SDK client with method-per-endpoint, request/response types, error handling, and authentication support. Return clean, production-ready code with brief inline comments.",
        },
        {
          role: "user",
          content: JSON.stringify({ openApiSpec, language }),
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
