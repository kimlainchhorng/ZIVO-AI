import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing ELEVENLABS_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const text: string = body?.text;
    const voiceId: string =
      body?.voiceId ?? process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM";

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: "text must be 5000 characters or fewer" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id: "eleven_monolingual_v1",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `ElevenLabs API error: ${errText}` },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audioBuffer.byteLength),
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
