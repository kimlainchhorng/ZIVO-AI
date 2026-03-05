// app/api/database-builder/route.ts — AI Database Schema Builder

import { NextResponse } from "next/server";
import { generateDatabaseSchema } from "@/lib/ai/database-generator";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    description: "AI Database Builder — POST { prompt, projectName? } to generate a full database schema",
  });
}

export async function POST(req: Request): Promise<Response> {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { prompt, projectName } = body as { prompt?: string; projectName?: string };

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const safePrompt = prompt.trim().slice(0, 2000);

  try {
    const schema = await generateDatabaseSchema(
      projectName ? `${projectName}: ${safePrompt}` : safePrompt
    );
    return NextResponse.json(schema);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message ?? "Failed to generate database schema" },
      { status: 500 }
    );
  }
}
