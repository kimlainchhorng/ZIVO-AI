import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface RealtimeFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateRealtimeRequest {
  feature?: "websocket" | "sse" | "supabase-realtime" | "all";
  description?: string;
}

export interface GenerateRealtimeResponse {
  files: RealtimeFile[];
  summary: string;
  setupInstructions: string;
}

const REALTIME_SYSTEM_PROMPT = `You are ZIVO AI — an expert in real-time web applications.

Generate production-ready real-time feature code for a Next.js App Router project.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "setupInstructions": "Step-by-step setup instructions"
}

For WebSocket: include Socket.io server setup and React client hooks.
For SSE: include Server-Sent Events API route and React client hook.
For Supabase Realtime: include subscription setup and React hooks.
Always include:
- components/Chat.tsx — Real-time chat component
- hooks/useRealtime.ts — Custom hook for real-time subscriptions
- A live dashboard component with real-time data updates

Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      feature = "all",
      description = "real-time chat and live dashboard",
    }: GenerateRealtimeRequest = body;

    const userPrompt = `Generate real-time feature code for: "${description}"
Feature type: ${feature}

Include:
1. WebSocket server using Socket.io (app/api/socket/route.ts)
2. Supabase Realtime subscriptions (lib/realtime.ts)
3. Server-Sent Events endpoint (app/api/events/route.ts)
4. Real-time chat component (components/Chat.tsx)
5. Live dashboard with real-time data (components/LiveDashboard.tsx)
6. Collaborative editing hooks (hooks/useCollaboration.ts)
7. Custom real-time hook (hooks/useRealtime.ts)`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: REALTIME_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateRealtimeResponse;
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
