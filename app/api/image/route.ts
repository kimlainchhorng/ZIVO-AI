import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY in .env.local" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const prompt = body?.prompt;
    const size: string = body?.size || "1024x1024";

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    // Use HTTP call so it works even if SDK versions differ
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
      }),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return NextResponse.json({ error: data?.error?.message || "Image generation failed", raw: data }, { status: 500 });
    }

    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) {
      return NextResponse.json({ error: "No image returned", raw: data }, { status: 500 });
    }

    const dataUrl = `data:image/png;base64,${b64}`;
    return NextResponse.json({ type: "image", dataUrl, size, prompt });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error)?.message || "Server error" }, { status: 500 });
  }
}
