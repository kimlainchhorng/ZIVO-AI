import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface MediaFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateMediaRequest {
  appName?: string;
  features?: Array<
    | "video-upload"
    | "transcoding"
    | "thumbnails"
    | "audio-transcription"
    | "image-optimization"
    | "cdn"
    | "all"
  >;
  videoProvider?: "mux" | "cloudinary" | "bunny";
  storageProvider?: "s3" | "supabase" | "cloudinary";
}

export interface GenerateMediaResponse {
  files: MediaFile[];
  summary: string;
  setupInstructions: string;
  requiredEnvVars: string[];
}

const MEDIA_SYSTEM_PROMPT = `You are ZIVO AI — an expert in media processing, video hosting, and CDN configuration for Next.js.

Generate a complete media handling system for a Next.js App Router project.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "setupInstructions": "Step-by-step setup instructions",
  "requiredEnvVars": ["VAR_NAME=description"]
}

Always include:
- app/api/upload/route.ts — Signed upload URL generation
- app/api/media/route.ts — Media CRUD API
- app/api/media/transcode/route.ts — Video transcoding webhook handler
- components/VideoPlayer.tsx — Custom video player with chapters and controls
- components/ImageGallery.tsx — Masonry grid image gallery
- components/AudioPlayer.tsx — Custom audio player with waveform
- components/MediaUploader.tsx — Drag-and-drop upload component with progress
- lib/media/upload.ts — Upload utility functions
- lib/media/transcode.ts — Transcoding helpers (Mux/Cloudinary)
- lib/media/optimize.ts — Image optimization pipeline

Support video upload/transcoding, audio transcription via Whisper, CDN setup.
Generate signed upload URLs to avoid exposing API keys.

Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request): Promise<NextResponse> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    let body: GenerateMediaRequest;
    try {
      body = await req.json() as GenerateMediaRequest;
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }
    const {
      appName = "My App",
      features = ["all"],
      videoProvider = "mux",
      storageProvider = "s3",
    } = body;

    const selectedFeatures = features.includes("all")
      ? ["video-upload", "transcoding", "thumbnails", "audio-transcription", "image-optimization", "cdn"]
      : features;

    const userPrompt = `Generate a complete media processing system for "${appName}".
Features: ${selectedFeatures.join(", ")}
Video provider: ${videoProvider}
Storage provider: ${storageProvider}

Generate:
1. Signed upload URL API (app/api/upload/route.ts)
2. Media CRUD API (app/api/media/route.ts)
3. Transcoding webhook handler (app/api/media/transcode/route.ts)
4. Custom video player with chapters (components/VideoPlayer.tsx)
5. Masonry image gallery (components/ImageGallery.tsx)
6. Audio player component (components/AudioPlayer.tsx)
7. Drag-and-drop media uploader (components/MediaUploader.tsx)
8. Upload utility library (lib/media/upload.ts)
9. Transcoding helpers for ${videoProvider} (lib/media/transcode.ts)
10. Image optimization pipeline (lib/media/optimize.ts)`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: MEDIA_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateMediaResponse;
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
