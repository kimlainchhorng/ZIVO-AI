import { NextResponse } from "next/server";
import {
  generateVideo,
  buildVideoScript,
  type VideoQuality,
  type VideoFormat,
} from "@/lib/video-generator";
import { addMedia } from "@/lib/media-store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      type = "explainer",
      appName,
      content,
      quality = "720p",
      format = "mp4",
      voiceOver = false,
      captions = false,
      projectId,
    } = body as {
      type?: "explainer" | "demo" | "tutorial" | "marketing" | "onboarding";
      appName?: string;
      content?: string;
      quality?: VideoQuality;
      format?: VideoFormat;
      voiceOver?: boolean;
      captions?: boolean;
      projectId?: string;
    };

    if (!appName || typeof appName !== "string") {
      return NextResponse.json({ error: "Missing appName" }, { status: 400 });
    }
    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Missing content" }, { status: 400 });
    }

    const script = buildVideoScript(type, appName, content);
    const video = await generateVideo(
      { script, quality, format, voiceOver, captions },
      process.env.RUNWAY_API_KEY
    );

    const savedVideo = addMedia({
      type: "video",
      category: "video",
      url: video.url ?? "",
      projectId,
      metadata: {
        videoId: video.id,
        status: video.status,
        script,
        type,
        quality,
        format,
        voiceOver,
        captions,
        duration: video.duration,
      },
    });

    return NextResponse.json({ video: savedVideo, generationId: video.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
