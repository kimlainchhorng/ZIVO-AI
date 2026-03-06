import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface EmailFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateEmailSystemRequest {
  appName?: string;
  provider?: "resend" | "sendgrid" | "nodemailer";
  templates?: string[];
}

export interface GenerateEmailSystemResponse {
  files: EmailFile[];
  summary: string;
  setupInstructions: string;
  requiredEnvVars: string[];
}

const EMAIL_SYSTEM_PROMPT = `You are ZIVO AI — an expert in transactional email systems.

Generate a complete email infrastructure for a Next.js App Router project using Resend and React Email.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "setupInstructions": "Step-by-step instructions",
  "requiredEnvVars": ["RESEND_API_KEY"]
}

Always include:
- emails/welcome.tsx — Welcome email template
- emails/verify-email.tsx — Email verification template
- emails/reset-password.tsx — Password reset template
- app/api/email/send/route.ts — Send email API route
- lib/email.ts — Email client and send helpers

Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json() as GenerateEmailSystemRequest;
    const {
      appName = "My App",
      provider = "resend",
      templates = ["welcome", "verify-email", "reset-password"],
    } = body;

    const userPrompt = `Generate a complete email system for "${appName}".
Provider: ${provider}
Templates needed: ${templates.join(", ")}

Include React Email templates, send API routes, and email client configuration.`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: EMAIL_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateEmailSystemResponse;
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
