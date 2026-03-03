import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface SupabaseConnectRequest {
  projectConfig: {
    tables?: string[];
    authEnabled?: boolean;
    description?: string;
  };
}

export interface SupabaseConnectResponse {
  files: Array<{ path: string; content: string; action: "create" }>;
  summary: string;
}

const SUPABASE_SYSTEM_PROMPT = `You are a Supabase integration expert. Given a project configuration, generate:
1. A SQL schema file with the requested tables (with RLS policies).
2. Supabase auth setup helpers if authEnabled is true.
3. A TypeScript types file matching the schema.
4. A ready-to-use Supabase client helper (lib/supabase.ts).

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "supabase/schema.sql", "content": "...", "action": "create" },
    { "path": "lib/supabase.ts", "content": "...", "action": "create" }
  ],
  "summary": "Brief description of what was generated"
}

Rules:
- Return ONLY valid JSON, no markdown fences, no extra text.
- Use strict TypeScript.
- Always include NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env vars.`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => {
      return NextResponse.json({ error: "Invalid or malformed JSON in request body" }, { status: 400 });
    });
    const { projectConfig }: SupabaseConnectRequest = body;

    if (!projectConfig || typeof projectConfig !== "object") {
      return NextResponse.json(
        { error: "Missing or invalid projectConfig" },
        { status: 400 }
      );
    }

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 4096,
      messages: [
        { role: "system", content: SUPABASE_SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(projectConfig) },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: SupabaseConnectResponse;
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
