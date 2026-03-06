import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

// Note: Actual video generation requires Runway/Sora API keys (RUNWAY_API_KEY).
// This route generates a detailed video script and storyboard via GPT-4o.

interface StoryboardScene {
  scene: number;
  description: string;
  duration: number;
  voiceover: string;
  visuals: string;
}

interface VideoResult {
  script: string;
  storyboard: StoryboardScene[];
  totalDuration: number;
  title: string;
  productionNotes: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({})) as {
    prompt: string;
    duration?: number;
    style?: "demo" | "explainer" | "animated";
  };

  if (!body.prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const client = new OpenAI({ apiKey });

  const userContent = [
    `Concept: ${body.prompt}`,
    body.duration && `Target duration: ${body.duration} seconds`,
    body.style && `Style: ${body.style}`,
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
          "You are a video production expert. Generate a detailed video script and storyboard for the given concept. Return JSON with: script (string), storyboard (array of {scene: number, description: string, duration: number, voiceover: string, visuals: string}), totalDuration (number in seconds), title (string), productionNotes (string).",
      },
      { role: "user", content: userContent },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";

  let result: VideoResult;
  try {
    result = JSON.parse(raw) as VideoResult;
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

  return NextResponse.json(result);
}
