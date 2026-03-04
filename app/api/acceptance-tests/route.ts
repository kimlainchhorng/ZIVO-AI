import { NextResponse } from "next/server";
import OpenAI from "openai";
import { ACCEPTANCE_TESTS_PROMPTS } from "@/prompts/devops-ai-routes";

export const runtime = "nodejs";

interface AcceptanceTestsBody {
  spec: string;
  framework: "playwright" | "cypress";
}

export async function GET() {
  return NextResponse.json({
    description:
      "AI-powered acceptance test generator. Accepts a spec and framework (playwright | cypress) and returns generated end-to-end test scenarios.",
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

    const body = (await req.json().catch(() => ({}))) as AcceptanceTestsBody;
    const { spec, framework } = body;

    if (!spec || typeof spec !== "string") {
      return NextResponse.json(
        { error: "Missing required field: spec" },
        { status: 400 }
      );
    }

    if (!framework || !["playwright", "cypress"].includes(framework)) {
      return NextResponse.json(
        { error: "Invalid framework. Must be one of: playwright, cypress" },
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = ACCEPTANCE_TESTS_PROMPTS[framework];

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Generate acceptance tests for the following specification:\n\n${spec}`,
        },
      ],
      temperature: 0.3,
    });

    const tests = completion.choices[0]?.message?.content ?? "";

    return NextResponse.json({ framework, tests });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
