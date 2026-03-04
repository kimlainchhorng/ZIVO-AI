import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    description:
      "Device permissions manager. Accepts { permissions: string[], platform: 'ios'|'android'|'both' } and returns generated permission handling code for the target platform(s).",
  });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      permissions?: string[];
      platform?: "ios" | "android" | "both";
    };

    const { permissions, platform } = body;

    if (!permissions || permissions.length === 0 || !platform) {
      return NextResponse.json(
        { error: "Missing required fields: permissions (array) and platform" },
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
            "You are a mobile permissions expert. Generate complete permission handling code for React Native, including runtime permission requests, Info.plist entries (iOS), AndroidManifest entries (Android), and user-facing rationale strings. Return clean, typed TypeScript/TSX code with brief inline comments.",
        },
        {
          role: "user",
          content: JSON.stringify({ permissions, platform }),
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
