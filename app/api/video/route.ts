import { NextResponse } from "next/server";
import OpenAI from "openai";

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
  size: string,
  maxRetries = 2
): Promise<string | null> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
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
      if (!r.ok) {
        if (attempt < maxRetries) continue;
        return null;
      }
      const data = await r.json().catch(() => ({}));
      const b64 = data?.data?.[0]?.b64_json;
      if (!b64) {
        if (attempt < maxRetries) continue;
        return null;
      }
      return `data:image/png;base64,${b64}`;
    } catch {
      if (attempt >= maxRetries) return null;
    }
  }
  return null;
}

async function generateNarration(
  openai: OpenAI,
  framePrompt: string,
  frameIndex: number
): Promise<string> {
  try {
    const r = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.7,
      max_tokens: 120,
      messages: [
        {
          role: "system",
          content: "You are a professional narrator. Write a single concise narration sentence (1-2 sentences max) for a video frame. Be vivid and cinematic.",
        },
        {
          role: "user",
          content: `Write narration for frame ${frameIndex + 1}: ${framePrompt}`,
        },
      ],
    });
    return r.choices[0]?.message?.content?.trim() ?? "";
  } catch {
    return "";
  }
}

async function optimizePrompt(openai: OpenAI, userPrompt: string): Promise<string> {
  try {
    const r = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.5,
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: "You are a professional prompt engineer specializing in AI image generation for video sequences. Expand and optimize the user's video prompt to be more visually descriptive, cinematic, and detailed. Output ONLY the optimized prompt, no explanation.",
        },
        {
          role: "user",
          content: `Optimize this video generation prompt: ${userPrompt}`,
        },
      ],
    });
    return r.choices[0]?.message?.content?.trim() ?? userPrompt;
  } catch {
    return userPrompt;
  }
}

function buildSlideshowHtml(
  frames: Array<{ frame: string; narration?: string }>,
  title: string
): string {
  const slides = frames
    .map(
      (f, i) => `
    <div class="slide${i === 0 ? " active" : ""}">
      <img src="${f.frame}" alt="Frame ${i + 1}" />
      ${f.narration ? `<div class="caption">${f.narration}</div>` : ""}
      <div class="counter">${i + 1} / ${frames.length}</div>
    </div>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; color: #fff; font-family: system-ui, sans-serif; overflow: hidden; }
    .slideshow { position: relative; width: 100vw; height: 100vh; }
    .slide { position: absolute; inset: 0; opacity: 0; transition: opacity 0.8s ease; display: flex; align-items: center; justify-content: center; flex-direction: column; }
    .slide.active { opacity: 1; }
    .slide img { max-width: 100%; max-height: 85vh; object-fit: contain; }
    .caption { position: absolute; bottom: 60px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.7); padding: 0.75rem 1.5rem; border-radius: 8px; font-size: 1rem; max-width: 80%; text-align: center; backdrop-filter: blur(4px); }
    .counter { position: absolute; top: 16px; right: 20px; font-size: 0.875rem; opacity: 0.6; }
    .progress { position: absolute; bottom: 0; left: 0; height: 3px; background: #6366f1; transition: width 3s linear; }
  </style>
</head>
<body>
  <div class="slideshow">
    ${slides}
    <div class="progress" id="progress"></div>
  </div>
  <script>
    const slides = document.querySelectorAll('.slide');
    const progress = document.getElementById('progress');
    let current = 0;
    function next() {
      slides[current].classList.remove('active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('active');
      progress.style.width = '0%';
      requestAnimationFrame(() => { progress.style.width = '100%'; });
    }
    progress.style.width = '100%';
    setInterval(next, 3000);
  </script>
</body>
</html>`;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY in .env.local" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    let prompt: string = body?.prompt;
    const style: string = body?.style || "cinematic";
    const frameCount: number = body?.frameCount === 6 ? 6 : 4;
    const narration: boolean = Boolean(body?.narration);
    const slideshow: boolean = Boolean(body?.slideshow);
    const videoPromptOptimizer: boolean = Boolean(body?.videoPromptOptimizer);

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey });

    // Optional: optimize the prompt before generation
    if (videoPromptOptimizer) {
      prompt = await optimizePrompt(openai, prompt);
    }

    const framePromptFn = FRAME_PROMPTS[style] ?? FRAME_PROMPTS["cinematic"];
    const framePrompts = Array.from({ length: frameCount }, (_, i) =>
      framePromptFn(prompt, i, frameCount)
    );

    // Generate all frames in parallel with per-frame retry
    const frameResults = await Promise.all(
      framePrompts.map((fp) => generateFrame(apiKey, fp, "1024x1024", 2))
    );

    const validFrames: Array<{ frame: string; narration?: string }> = [];

    for (let i = 0; i < frameResults.length; i++) {
      const frame = frameResults[i];
      if (frame === null) continue;

      if (narration) {
        const text = await generateNarration(openai, framePrompts[i], i);
        validFrames.push({ frame, narration: text });
      } else {
        validFrames.push({ frame });
      }
    }

    if (validFrames.length === 0) {
      return NextResponse.json(
        { error: "All frame generations failed" },
        { status: 500 }
      );
    }

    const response: Record<string, unknown> = {
      type: "video",
      frames: validFrames.map((f) => f.frame),
      frameCount: validFrames.length,
      optimizedPrompt: videoPromptOptimizer ? prompt : undefined,
    };

    if (narration) {
      response.narrations = validFrames.map((f) => f.narration ?? "");
    }

    if (slideshow) {
      response.slideshowHtml = buildSlideshowHtml(validFrames, prompt.slice(0, 60));
    }

    return NextResponse.json(response);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error)?.message || "Server error" }, { status: 500 });
  }
}
