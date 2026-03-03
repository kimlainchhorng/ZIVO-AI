import { NextResponse } from "next/server";

export const runtime = "nodejs";

const FRAME_PROMPTS: Record<string, (base: string, i: number, total: number) => string> = {
  cinematic: (base, i, total) =>
    `Cinematic film still, frame ${i + 1} of ${total}: ${base}. Shot ${i + 1} in a sequence showing gradual motion. Dramatic lighting, photorealistic, 4K.`,
  anime: (base, i, total) =>
    `Anime key frame ${i + 1} of ${total}: ${base}. Frame ${i + 1} in a flowing animation sequence. Vibrant colors, sharp lines, studio ghibli style.`,
  realistic: (base, i, total) =>
    `Photorealistic frame ${i + 1} of ${total}: ${base}. Moment ${i + 1} in a sequential realistic scene. Natural lighting, high detail.`,
  cartoon: (base, i, total) =>
    `Cartoon animation frame ${i + 1} of ${total}: ${base}. Step ${i + 1} in a colorful cartoon sequence. Bold outlines, bright colors, fun style.`,
};

async function generateFrame(
  apiKey: string,
  prompt: string,
  size: string
): Promise<string | null> {
  try {
    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        size,
        quality: "standard",
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return null;
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) return null;
    return `data:image/png;base64,${b64}`;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY in .env.local" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const prompt: string = body?.prompt;
    const style: string = body?.style || "cinematic";
    const frameCount: number = body?.frameCount === 6 ? 6 : 4;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const framePromptFn =
      FRAME_PROMPTS[style] ?? FRAME_PROMPTS["cinematic"];

    const framePrompts = Array.from({ length: frameCount }, (_, i) =>
      framePromptFn(prompt, i, frameCount)
    );

    // Generate all frames in parallel; skip failures gracefully
    const frameResults = await Promise.all(
      framePrompts.map((fp) => generateFrame(apiKey, fp, "1024x1024"))
    );

    const frames = frameResults.filter((f): f is string => f !== null);

    if (frames.length === 0) {
      return NextResponse.json(
        { error: "All frame generations failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ type: "video", frames, frameCount: frames.length });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error)?.message || "Server error" }, { status: 500 });
  }
}
