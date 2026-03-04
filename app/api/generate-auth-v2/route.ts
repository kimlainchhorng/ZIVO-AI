import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface AuthV2File {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateAuthV2Request {
  appName?: string;
  methods?: string[];
  mfa?: boolean;
  rateLimiting?: boolean;
}

export interface GenerateAuthV2Response {
  files: AuthV2File[];
  summary: string;
  setupInstructions: string;
  requiredEnvVars: string[];
}

const AUTH_V2_SYSTEM_PROMPT = `You are ZIVO AI — an expert in advanced authentication systems.

Generate an advanced, production-ready authentication system for a Next.js App Router project.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "setupInstructions": "Step-by-step setup instructions",
  "requiredEnvVars": ["NEXTAUTH_SECRET", "NEXTAUTH_URL"]
}

Always include:
- app/auth/login/page.tsx — Login page (magic link + OAuth options)
- app/auth/register/page.tsx — Registration page
- app/auth/verify/page.tsx — Email verification page
- app/auth/2fa/page.tsx — Two-factor authentication page
- app/api/auth/[...nextauth]/route.ts — NextAuth v5 route
- middleware.ts — Auth protection middleware
- lib/auth-config.ts — NextAuth configuration with all providers

Security: rate limiting, account lockout, session management.
Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json() as GenerateAuthV2Request;
    const {
      appName = "My App",
      methods = ["magic-link", "google", "github", "passkeys"],
      mfa = true,
      rateLimiting = true,
    } = body;

    const userPrompt = `Generate advanced authentication for "${appName}".
Auth methods: ${methods.join(", ")}
MFA enabled: ${mfa}
Rate limiting: ${rateLimiting}

Include: magic link, OAuth providers, WebAuthn passkeys, TOTP 2FA, session management, and rate limiting.`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: AUTH_V2_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateAuthV2Response;
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
