import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface SecurityFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateSecurityRequest {
  features?: Array<
    | "rate-limiting"
    | "cors"
    | "csp-headers"
    | "input-sanitization"
    | "xss-protection"
    | "all"
  >;
  appName?: string;
}

export interface GenerateSecurityResponse {
  files: SecurityFile[];
  summary: string;
  envVars: string[];
  securityChecklist: string[];
}

const SECURITY_SYSTEM_PROMPT = `You are ZIVO AI — an expert in web application security for Next.js.

Generate production-ready security middleware and utilities for a Next.js App Router project.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "envVars": ["ENV_VAR_NAME=description"],
  "securityChecklist": ["Security measure 1", "Security measure 2"]
}

Always include:
- middleware.ts — Rate limiting + CORS + security headers middleware
- lib/security.ts — Input sanitization and XSS protection utilities
- lib/rate-limit.ts — Rate limiting using @upstash/ratelimit
- next.config.ts — CSP and security headers configuration
- lib/validation.ts — SQL injection prevention via parameterized queries

Use @upstash/ratelimit for rate limiting (sliding window algorithm).
Use DOMPurify patterns for XSS protection.
Add Content-Security-Policy, X-Frame-Options, X-Content-Type-Options headers.

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
      features = ["all"],
      appName = "My App",
    }: GenerateSecurityRequest = body;

    const selectedFeatures = features.includes("all")
      ? ["rate-limiting", "cors", "csp-headers", "input-sanitization", "xss-protection"]
      : features;

    const userPrompt = `Generate security middleware and utilities for "${appName}".
Security features: ${selectedFeatures.join(", ")}

Generate:
1. Rate limiting middleware using @upstash/ratelimit (lib/rate-limit.ts)
2. CORS configuration (next.config.ts or middleware.ts)
3. Content Security Policy headers (next.config.ts security headers)
4. Input sanitization utilities (lib/security.ts)
5. SQL injection prevention with parameterized query helpers (lib/db-utils.ts)
6. XSS protection utilities (lib/xss.ts)
7. Security-enhanced middleware.ts combining all protections`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: SECURITY_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateSecurityResponse;
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
