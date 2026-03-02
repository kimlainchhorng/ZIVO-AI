import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getMedia, addMedia, deleteMedia } from "@/lib/media-store";
import { generateImage, type ImageStyle } from "@/lib/image-generator";

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
    const { mediaId, style } = body as { mediaId?: string; style?: ImageStyle };

    if (!mediaId || typeof mediaId !== "string") {
      return NextResponse.json({ error: "Missing mediaId" }, { status: 400 });
    }

    const existing = getMedia(mediaId);
    if (!existing) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }
    if (existing.type !== "image") {
      return NextResponse.json(
        { error: "Only image regeneration is supported" },
        { status: 400 }
      );
    }

    const prompt = existing.prompt;
    if (!prompt) {
      return NextResponse.json({ error: "Original prompt not found" }, { status: 400 });
    }

    const images = await generateImage(client, {
      prompt,
      style: style ?? (existing.metadata?.style as ImageStyle | undefined) ?? "modern",
      size: (existing.metadata?.size as "1024x1024" | "1792x1024" | "1024x1792") ?? "1024x1024",
    });

    deleteMedia(mediaId);

    const newItems = images.map((img) =>
      addMedia({
        type: existing.type,
        category: existing.category,
        url: img.url,
        prompt,
        revisedPrompt: img.revisedPrompt,
        projectId: existing.projectId,
        metadata: { ...existing.metadata, regeneratedFrom: mediaId },
      })
    );

    return NextResponse.json({ items: newItems });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
