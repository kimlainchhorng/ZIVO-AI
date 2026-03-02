export type VideoQuality = "480p" | "720p" | "1080p";
export type VideoFormat = "mp4" | "webm";

export interface VideoGenerationOptions {
  script: string;
  quality?: VideoQuality;
  format?: VideoFormat;
  voiceOver?: boolean;
  captions?: boolean;
}

export interface GeneratedVideo {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  url?: string;
  thumbnailUrl?: string;
  duration?: number;
  quality: VideoQuality;
  format: VideoFormat;
  createdAt: string;
}

export async function generateVideo(
  options: VideoGenerationOptions,
  apiKey?: string
): Promise<GeneratedVideo> {
  const { script, quality = "720p", format = "mp4" } = options;
  const id = `vid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Runway ML integration
  if (apiKey) {
    const response = await fetch("https://api.runwayml.com/v1/text-to-video", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: script, resolution: quality }),
    });

    if (response.ok) {
      const data = (await response.json()) as { id?: string; url?: string };
      return {
        id: data.id ?? id,
        status: "queued",
        url: data.url,
        quality,
        format,
        createdAt: new Date().toISOString(),
      };
    }
  }

  // Return a queued job when no API key is available
  return {
    id,
    status: "queued",
    quality,
    format,
    createdAt: new Date().toISOString(),
  };
}

export function buildVideoScript(
  type: "explainer" | "demo" | "tutorial" | "marketing" | "onboarding",
  appName: string,
  content: string
): string {
  const intros: Record<string, string> = {
    explainer: `Introducing ${appName} — `,
    demo: `Let me show you how ${appName} works. `,
    tutorial: `In this tutorial, you'll learn how to use ${appName}. `,
    marketing: `Discover ${appName} — `,
    onboarding: `Welcome to ${appName}! Let's get you started. `,
  };
  return `${intros[type]}${content}`;
}
