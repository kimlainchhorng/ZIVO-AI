import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface IntegrationFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateIntegrationRequest {
  service:
    | "stripe"
    | "sendgrid"
    | "resend"
    | "cloudinary"
    | "uploadthing"
    | "openai"
    | "supabase"
    | "twilio"
    | "google-maps";
  description?: string;
}

export interface GenerateIntegrationResponse {
  files: IntegrationFile[];
  summary: string;
  envVars: string[];
  setupInstructions: string;
}

const INTEGRATION_SYSTEM_PROMPT = `You are ZIVO AI — an expert in third-party API integrations for Next.js.

Generate production-ready integration code for a Next.js App Router project.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "envVars": ["ENV_VAR_NAME=description"],
  "setupInstructions": "Step-by-step setup"
}

Integration patterns:
- Stripe: payment forms, webhooks handler, subscription management
- SendGrid/Resend: email templates, transactional email utilities
- Cloudinary/Uploadthing: file/image upload with presigned URLs
- OpenAI: AI chat completions, embeddings, streaming
- Supabase: full client setup, RLS policies, storage
- Twilio: SMS notifications, phone verification
- Google Maps: map component, geocoding utilities

Always include proper error handling, TypeScript types, and environment variable usage.
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
      service,
      description = "",
    }: GenerateIntegrationRequest = body;

    if (!service) {
      return NextResponse.json(
        { error: "Missing required field: service" },
        { status: 400 }
      );
    }

    const userPrompt = `Generate a complete ${service} integration for a Next.js App Router project${description ? `: "${description}"` : ""}.

Include:
- lib/${service}.ts — Client setup and utility functions
- app/api/${service}/route.ts — API route handler (webhooks, callbacks)
- components/${service.charAt(0).toUpperCase() + service.slice(1)}Component.tsx — UI component (if applicable)
- Required environment variables list
- TypeScript types for all ${service} data structures`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: INTEGRATION_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateIntegrationResponse;
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
