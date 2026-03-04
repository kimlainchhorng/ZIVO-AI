import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const audio = formData.get("audio") as File | null;
    const builderType = (formData.get("builderType") as string | null) ?? "website";

    if (!audio) {
      return NextResponse.json(
        { error: "Missing audio file" },
        { status: 400 }
      );
    }

    const client = getClient();

    const transcription = await client.audio.transcriptions.create({
      file: audio,
      model: "whisper-1",
      language: "en",
    });

    const text = transcription.text?.trim();

    if (!text) {
      return NextResponse.json(
        { error: "Could not transcribe audio" },
        { status: 422 }
      );
    }

    const intentResponse = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1,
      max_tokens: 512,
      messages: [
        {
          role: "system",
          content:
            'You are a intent parser. Given a transcribed voice request, return JSON: {"intent": "...", "builderType": "website|mobile|code|api", "prompt": "cleaned prompt"}. Return ONLY valid JSON.',
        },
        {
          role: "user",
          content: `Voice request: "${text}"\nHint: the user is building a ${builderType}.`,
        },
      ],
    });

    const intentRaw = intentResponse.choices[0]?.message?.content ?? "{}";
    let intent: { intent?: string; builderType?: string; prompt?: string };
    try {
      intent = JSON.parse(intentRaw) as typeof intent;
    } catch {
      intent = { intent: text, builderType, prompt: text };
    }

    return NextResponse.json({
      transcription: text,
      intent: intent.intent ?? text,
      builderType: intent.builderType ?? builderType,
      prompt: intent.prompt ?? text,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
