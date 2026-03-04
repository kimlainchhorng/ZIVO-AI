import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface ScreenshotFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface ScreenshotToCodeResponse {
  files: ScreenshotFile[];
  summary: string;
  components: string[];
}

const SCREENSHOT_SYSTEM_PROMPT = `You are ZIVO AI — an expert UI engineer specializing in converting designs to production React code.

Given an image of a UI design or screenshot, generate pixel-perfect React/TSX components using TailwindCSS.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description of what was generated",
  "components": ["ComponentName1", "ComponentName2"]
}

Always:
- Use TailwindCSS for all styling
- Preserve layout (flexbox/grid), colors, typography, spacing
- Generate a main page component and sub-components as needed
- Use TypeScript with proper type annotations
- Include responsive breakpoints

Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const image = formData.get("image") as File | null;
    const instructions = (formData.get("instructions") as string | null) ?? "";

    if (!image) {
      return NextResponse.json(
        { error: "Missing image file" },
        { status: 400 }
      );
    }

    const arrayBuffer = await image.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = image.type || "image/png";

    const client = getClient();

    const userContent: OpenAI.Chat.ChatCompletionContentPart[] = [
      {
        type: "image_url",
        image_url: { url: `data:${mimeType};base64,${base64}`, detail: "high" },
      },
      {
        type: "text",
        text: instructions
          ? `Convert this UI screenshot to React/TSX code with TailwindCSS. Additional instructions: ${instructions}`
          : "Convert this UI screenshot to React/TSX code with TailwindCSS.",
      },
    ];

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1,
      max_tokens: 8192,
      messages: [
        { role: "system", content: SCREENSHOT_SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: ScreenshotToCodeResponse;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json(
          { error: "AI did not return valid JSON" },
          { status: 502 }
        );
      }
      parsed = JSON.parse(match[0]);
    }

    if (!Array.isArray(parsed.files)) {
      return NextResponse.json(
        { error: "Invalid response structure: missing files array" },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
