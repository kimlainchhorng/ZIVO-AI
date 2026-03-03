import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "placeholder" });

const VALID_MODELS = ["gpt-4.1-mini", "gpt-4o", "gpt-4o-mini"] as const;
type ValidModel = (typeof VALID_MODELS)[number];

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
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
    const messages: ChatMessage[] = body?.messages;
    const useStream: boolean = body?.stream === true;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    for (const msg of messages) {
      if (!msg.role || !msg.content || typeof msg.content !== "string") {
        return NextResponse.json(
          { error: "Each message must have role and content (string)" },
          { status: 400 }
        );
      }
    }

    const requestedModel: string = body?.model ?? "gpt-4.1-mini";
    const model: ValidModel = (VALID_MODELS as readonly string[]).includes(requestedModel)
      ? (requestedModel as ValidModel)
      : "gpt-4.1-mini";

    const systemMessage: ChatMessage = {
      role: "system",
      content: "You are ZIVO AI. Be fast, clear, and practical.",
    };

    const allMessages: ChatMessage[] = [systemMessage, ...messages];

    if (useStream) {
      const stream = await client.chat.completions.create({
        model,
        messages: allMessages,
        stream: true,
      });

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content ?? "";
            if (token) {
              controller.enqueue(encoder.encode(token));
            }
          }
          controller.close();
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    const response = await client.chat.completions.create({
      model,
      messages: allMessages,
    });

    const reply = response.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ ok: true, result: reply });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
