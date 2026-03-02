import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  generateImage,
  buildSocialMediaPrompt,
  type ImageStyle,
} from "@/lib/image-generator";
import { addMedia } from "@/lib/media-store";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PLATFORM_SIZES: Record<string, "1024x1024" | "1792x1024" | "1024x1792"> = {
  twitter: "1792x1024",
  linkedin: "1792x1024",
  instagram: "1024x1024",
};

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      platform = "twitter",
      appName,
      message,
      style = "modern",
      projectId,
    } = body as {
      platform?: string;
      appName?: string;
      message?: string;
      style?: ImageStyle;
      projectId?: string;
    };

    if (!appName || typeof appName !== "string") {
      return NextResponse.json({ error: "Missing appName" }, { status: 400 });
    }
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    const size = PLATFORM_SIZES[platform.toLowerCase()] ?? "1024x1024";
    const prompt = buildSocialMediaPrompt(platform, appName, message);
    const images = await generateImage(client, { prompt, style, size });

    const savedImages = images.map((img) =>
      addMedia({
        type: "image",
        category: "social",
        url: img.url,
        prompt,
        revisedPrompt: img.revisedPrompt,
        projectId,
        metadata: { platform, appName, style, size },
      })
    );

    return NextResponse.json({ images: savedImages });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
