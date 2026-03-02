import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  generateImage,
  buildMarketingPrompt,
  type ImageStyle,
  type ImageSize,
} from "@/lib/image-generator";
import { addMedia } from "@/lib/media-store";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MATERIAL_TYPES = [
  "banner",
  "email-header",
  "og-image",
  "promotional",
  "product-showcase",
  "testimonial",
  "cta",
  "feature-highlight",
] as const;

type MaterialType = (typeof MATERIAL_TYPES)[number];

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
      materialType = "promotional",
      appName,
      content,
      style = "corporate",
      size = "1792x1024",
      projectId,
    } = body as {
      materialType?: MaterialType;
      appName?: string;
      content?: string;
      style?: ImageStyle;
      size?: ImageSize;
      projectId?: string;
    };

    if (!appName || typeof appName !== "string") {
      return NextResponse.json({ error: "Missing appName" }, { status: 400 });
    }
    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Missing content" }, { status: 400 });
    }

    const prompt = buildMarketingPrompt(materialType, appName, content);
    const images = await generateImage(client, { prompt, style, size });

    const savedImages = images.map((img) =>
      addMedia({
        type: "image",
        category: "marketing",
        url: img.url,
        prompt,
        revisedPrompt: img.revisedPrompt,
        projectId,
        metadata: { materialType, appName, style, size },
      })
    );

    return NextResponse.json({ images: savedImages });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
