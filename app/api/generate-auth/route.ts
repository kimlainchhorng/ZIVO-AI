import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface AuthFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateAuthRequest {
  provider?: "supabase" | "next-auth" | "both";
  oauthProviders?: string[];
  appName?: string;
}

export interface GenerateAuthResponse {
  files: AuthFile[];
  summary: string;
  setupInstructions: string;
}

const AUTH_SYSTEM_PROMPT = `You are ZIVO AI — an expert full-stack developer specializing in authentication systems.

Generate a complete, production-ready authentication system for a Next.js App Router project.

When given a request, respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "setupInstructions": "Step-by-step setup instructions"
}

Always include:
- app/login/page.tsx — Login page with email/password form
- app/register/page.tsx — Registration page
- middleware.ts — Protected route middleware
- components/providers/AuthProvider.tsx — Auth context provider
- lib/auth.ts — Auth utility functions and JWT helpers
- app/api/auth/[...nextauth]/route.ts — Next-Auth v5 API route (if next-auth selected)

Use TypeScript, Tailwind CSS, and production best practices.
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
      provider = "both",
      oauthProviders = ["google", "github"],
      appName = "My App",
    }: GenerateAuthRequest = body;

    const userPrompt = `Generate a complete authentication system for a Next.js App Router project called "${appName}".
Auth provider: ${provider}
OAuth providers: ${oauthProviders.join(", ")}

Include:
- Supabase Auth setup (email/password + OAuth: ${oauthProviders.join(", ")})
- Next-Auth v5 configuration
- Login page (app/login/page.tsx)
- Register page (app/register/page.tsx)
- Protected route middleware (middleware.ts)
- Auth context provider (components/providers/AuthProvider.tsx)
- JWT session handling utilities
- Password reset flow`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: AUTH_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateAuthResponse;
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
