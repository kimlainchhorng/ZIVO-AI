import { NextResponse } from "next/server";
import OpenAI from "openai";
import { API_CONTRACT_TESTS_PROMPTS } from "@/prompts/devops-ai-routes";

export const runtime = "nodejs";

interface ApiContractTestsBody {
  spec: string;
  framework: "pact" | "supertest";
}

export async function GET() {
  return NextResponse.json({
    description:
      "API contract test generator. Accepts a spec and framework (pact | supertest) and returns generated contract tests to verify API behaviour.",
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

    const body = (await req.json().catch(() => ({}))) as ApiContractTestsBody;
    const { spec, framework } = body;

    if (!spec || typeof spec !== "string") {
      return NextResponse.json(
        { error: "Missing required field: spec" },
        { status: 400 }
      );
    }

    if (!framework || !["pact", "supertest"].includes(framework)) {
      return NextResponse.json(
        { error: "Invalid framework. Must be one of: pact, supertest" },
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = API_CONTRACT_TESTS_PROMPTS[framework];

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Generate ${framework} contract tests for the following API specification:\n\n${spec}`,
        },
      ],
      temperature: 0.3,
    });

    const contractTests = completion.choices[0]?.message?.content ?? "";

    return NextResponse.json({ framework, contractTests });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
