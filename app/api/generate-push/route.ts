import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface PushFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GeneratePushRequest {
  appName?: string;
  pushType?: "web" | "mobile" | "both";
  platform?: "fcm" | "vapid" | "both";
}

export interface GeneratePushResponse {
  files: PushFile[];
  summary: string;
  setupInstructions: string;
  requiredEnvVars: string[];
}

const PUSH_SYSTEM_PROMPT = `You are ZIVO AI — an expert in push notification systems.

Generate a complete push notification system for a Next.js App Router project.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "setupInstructions": "Step-by-step setup",
  "requiredEnvVars": ["VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY"]
}

Always include:
- public/sw.js — Service worker for web push
- app/api/push/subscribe/route.ts — Subscription management
- app/api/push/send/route.ts — Send push notifications
- lib/push.ts — Push notification utilities
- hooks/usePushNotifications.ts — React hook for push subscriptions

Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json() as GeneratePushRequest;
    const {
      appName = "My App",
      pushType = "web",
      platform = "vapid",
    } = body;

    const userPrompt = `Generate a push notification system for "${appName}".
Push type: ${pushType}
Platform: ${platform}

Include service worker, VAPID key setup, subscription management, and send API.`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: PUSH_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GeneratePushResponse;
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
