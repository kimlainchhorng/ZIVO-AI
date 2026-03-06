import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

interface GeneratedFile {
  path: string;
  content: string;
}

interface PwaResult {
  files: GeneratedFile[];
  summary: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({})) as {
    appName: string;
    description?: string;
    themeColor?: string;
    backgroundColor?: string;
    features?: string[];
  };

  if (!body.appName) {
    return NextResponse.json({ error: "appName is required" }, { status: 400 });
  }

  const client = new OpenAI({ apiKey });

  const userContent = [
    `App name: ${body.appName}`,
    body.description && `Description: ${body.description}`,
    body.themeColor && `Theme color: ${body.themeColor}`,
    body.backgroundColor && `Background color: ${body.backgroundColor}`,
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
          "You are a Progressive Web App expert. Generate complete PWA configuration files. Return JSON with: files (array of {path: string, content: string}) for: public/manifest.json, public/sw.js (service worker), app/offline/page.tsx (offline fallback), components/PwaInstallPrompt.tsx, public/robots.txt; summary (string).",
      },
      { role: "user", content: userContent },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";

  let result: PwaResult;
  try {
    result = JSON.parse(raw) as PwaResult;
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

  return NextResponse.json(result);
}
