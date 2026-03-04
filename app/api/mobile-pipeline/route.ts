import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    description:
      "Mobile CI/CD pipeline generator. Accepts { platform: 'ios'|'android'|'both', appName: string, features: string[] } and returns a generated mobile pipeline configuration.",
  });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      platform?: "ios" | "android" | "both";
      appName?: string;
      features?: string[];
    };

    const { platform, appName, features } = body;

    if (!platform || !appName) {
      return NextResponse.json(
        { error: "Missing required fields: platform and appName" },
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
            "You are a mobile DevOps expert. Generate a complete CI/CD pipeline configuration (YAML) for the specified mobile platform(s) using GitHub Actions or Fastlane. Include build, test, and deployment stages. Return only the pipeline YAML with brief inline comments.",
        },
        {
          role: "user",
          content: JSON.stringify({ platform, appName, features: features ?? [] }),
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
