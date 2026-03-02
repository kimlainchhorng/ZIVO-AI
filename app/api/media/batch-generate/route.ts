import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  generateImage,
  buildHeroImagePrompt,
  buildLogoPrompt,
  buildSocialMediaPrompt,
  buildMarketingPrompt,
  type ImageStyle,
  type ImageSize,
} from "@/lib/image-generator";
import { addMedia, type MediaCategory } from "@/lib/media-store";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface BatchItem {
  type: "hero" | "logo" | "social" | "marketing";
  appName: string;
  description?: string;
  message?: string;
  content?: string;
  platform?: string;
  materialType?: string;
  style?: ImageStyle;
  size?: ImageSize;
  projectId?: string;
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { items } = body as { items?: BatchItem[] };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Missing or empty items array" }, { status: 400 });
    }
    if (items.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 items per batch request" },
        { status: 400 }
      );
    }

    const results = await Promise.allSettled(
      items.map(async (item) => {
        let prompt = "";
        let category: MediaCategory = "hero";
        const size: ImageSize = item.size ?? "1024x1024";

        if (item.type === "hero") {
          prompt = buildHeroImagePrompt(item.appName, item.description ?? "");
          category = "hero";
        } else if (item.type === "logo") {
          prompt = buildLogoPrompt(item.appName, item.description ?? "");
          category = "logo";
        } else if (item.type === "social") {
          prompt = buildSocialMediaPrompt(
            item.platform ?? "twitter",
            item.appName,
            item.message ?? ""
          );
          category = "social";
        } else if (item.type === "marketing") {
          prompt = buildMarketingPrompt(
            item.materialType ?? "promotional",
            item.appName,
            item.content ?? ""
          );
          category = "marketing";
        }

        const images = await generateImage(client, {
          prompt,
          style: item.style ?? "modern",
          size,
        });

        return images.map((img) =>
          addMedia({
            type: "image",
            category,
            url: img.url,
            prompt,
            revisedPrompt: img.revisedPrompt,
            projectId: item.projectId,
            metadata: { batchItem: item },
          })
        );
      })
    );

    const succeeded = results
      .filter((r): r is PromiseFulfilledResult<ReturnType<typeof addMedia>[]> => r.status === "fulfilled")
      .flatMap((r) => r.value);

    const failed = results
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map((r) => r.reason?.message ?? "Unknown error");

    return NextResponse.json({ succeeded, failed, total: items.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
