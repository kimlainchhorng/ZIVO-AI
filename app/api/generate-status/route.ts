import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GENERATE_STATUS_SYSTEM_PROMPT } from "@/prompts/devops-ai-routes";

export const runtime = "nodejs";

interface GenerateStatusBody {
  appName: string;
  services: string[];
}

export async function GET() {
  return NextResponse.json({
    description:
      "AI-powered status page generator. Accepts an app name and list of services, then uses AI to generate a complete status page configuration and content.",
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

    const body = (await req.json().catch(() => ({}))) as GenerateStatusBody;
    const { appName, services } = body;

    if (!appName || typeof appName !== "string") {
      return NextResponse.json(
        { error: "Missing required field: appName" },
        { status: 400 }
      );
    }

    if (!Array.isArray(services) || services.length === 0) {
      return NextResponse.json(
        { error: "Missing required field: services (must be a non-empty array of strings)" },
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = GENERATE_STATUS_SYSTEM_PROMPT;

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Generate a status page configuration for the application "${appName}" with the following services: ${services.join(", ")}.`,
        },
      ],
      temperature: 0.4,
      response_format: { type: "json_object" },
    });

    const rawContent = completion.choices[0]?.message?.content ?? "{}";

    let statusPageConfig: unknown;
    try {
      statusPageConfig = JSON.parse(rawContent);
    } catch {
      statusPageConfig = { raw: rawContent };
    }

    return NextResponse.json({ appName, services, statusPageConfig });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
