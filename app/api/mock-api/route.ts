import { NextResponse } from "next/server";
import OpenAI from "openai";
import { MOCK_API_PROMPTS } from "@/prompts/devops-ai-routes";

export const runtime = "nodejs";

interface MockApiBody {
  openApiSpec: string;
  format: "msw" | "json-server";
}

export async function GET() {
  return NextResponse.json({
    description:
      "Mock API generator. Accepts an OpenAPI spec and format (msw | json-server) and returns generated mock handlers or seed data.",
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

    const body = (await req.json().catch(() => ({}))) as MockApiBody;
    const { openApiSpec, format } = body;

    if (!openApiSpec || typeof openApiSpec !== "string") {
      return NextResponse.json(
        { error: "Missing required field: openApiSpec" },
        { status: 400 }
      );
    }

    if (!format || !["msw", "json-server"].includes(format)) {
      return NextResponse.json(
        { error: "Invalid format. Must be one of: msw, json-server" },
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = MOCK_API_PROMPTS[format];

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Generate ${format} mock handlers for the following OpenAPI specification:\n\n${openApiSpec}`,
        },
      ],
      temperature: 0.3,
    });

    const mockOutput = completion.choices[0]?.message?.content ?? "";

    return NextResponse.json({ format, mockOutput });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
