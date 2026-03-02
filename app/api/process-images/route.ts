import { NextResponse } from "next/server";
import { getMedia } from "@/lib/media-store";

export const runtime = "nodejs";

export interface ProcessImagesOptions {
  imageId: string;
  operations: Array<"compress" | "resize" | "convert-webp" | "strip-metadata">;
  targetWidth?: number;
  targetHeight?: number;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { imageId, operations = [], targetWidth, targetHeight } = body as ProcessImagesOptions;

    if (!imageId || typeof imageId !== "string") {
      return NextResponse.json({ error: "Missing imageId" }, { status: 400 });
    }

    const media = getMedia(imageId);
    if (!media) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Processing pipeline (the actual transformations require a server-side
    // image library; this records the requested operations and returns the
    // original URL until a pipeline such as Sharp is wired up).
    const processingResult = {
      id: imageId,
      originalUrl: media.url,
      processedUrl: media.url,
      operations,
      targetWidth,
      targetHeight,
      processedAt: new Date().toISOString(),
      note: "Image processing pipeline queued. Integrate Sharp or Cloudinary for full transformation support.",
    };

    return NextResponse.json({ result: processingResult });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
