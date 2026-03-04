import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

interface GeneratedFile {
  path: string;
  content: string;
}

interface SaasResult {
  files: GeneratedFile[];
  summary: string;
  setupInstructions: string;
  requiredEnvVars: string[];
}

export async function POST(req: Request): Promise<NextResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({})) as {
    appName: string;
    description?: string;
    features?: string[];
  };

  if (!body.appName) {
    return NextResponse.json({ error: "appName is required" }, { status: 400 });
  }

  const client = new OpenAI({ apiKey });

  const userContent = [
    `App name: ${body.appName}`,
    body.description && `Description: ${body.description}`,
    body.features?.length && `Features: ${body.features.join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n");

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a full-stack SaaS developer. Generate a complete SaaS starter application with landing page, authentication, subscription management, user dashboard, and admin panel. Return JSON with: files (array of {path: string, content: string}), summary (string), setupInstructions (string), requiredEnvVars (string[]).",
      },
      { role: "user", content: userContent },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";

  let result: SaasResult;
  try {
    result = JSON.parse(raw) as SaasResult;
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

  return NextResponse.json(result);
}
