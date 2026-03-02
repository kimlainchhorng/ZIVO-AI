import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  generateImage,
  buildHeroImagePrompt,
  type ImageStyle,
  type ImageSize,
} from "@/lib/image-generator";
import { addMedia } from "@/lib/media-store";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
      appName,
      description,
      style = "modern",
      size = "1792x1024",
      quality = "standard",
      projectId,
    } = body as {
      appName?: string;
      description?: string;
      style?: ImageStyle;
      size?: ImageSize;
      quality?: "standard" | "hd";
      projectId?: string;
    };

    if (!appName || typeof appName !== "string") {
      return NextResponse.json({ error: "Missing appName" }, { status: 400 });
    }
    if (!description || typeof description !== "string") {
      return NextResponse.json({ error: "Missing description" }, { status: 400 });
    }

    const prompt = buildHeroImagePrompt(appName, description);
    const images = await generateImage(client, { prompt, style, size, quality });

    const savedImages = images.map((img) =>
      addMedia({
        type: "image",
        category: "hero",
        url: img.url,
        prompt,
        revisedPrompt: img.revisedPrompt,
        projectId,
        metadata: { appName, style, size, quality },
      })
    );

    return NextResponse.json({ images: savedImages });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
