import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  generateImage,
  buildLogoPrompt,
  type ImageStyle,
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
      style = "minimalist",
      projectId,
    } = body as {
      appName?: string;
      description?: string;
      style?: ImageStyle;
      projectId?: string;
    };

    if (!appName || typeof appName !== "string") {
      return NextResponse.json({ error: "Missing appName" }, { status: 400 });
    }
    if (!description || typeof description !== "string") {
      return NextResponse.json({ error: "Missing description" }, { status: 400 });
    }

    const prompt = buildLogoPrompt(appName, description);
    const images = await generateImage(client, {
      prompt,
      style,
      size: "1024x1024",
    });

    const savedImages = images.map((img) =>
      addMedia({
        type: "image",
        category: "logo",
        url: img.url,
        prompt,
        revisedPrompt: img.revisedPrompt,
        projectId,
        metadata: { appName, style },
      })
    );

    return NextResponse.json({ images: savedImages });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
