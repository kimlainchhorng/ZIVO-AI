// app/api/api-generator/route.ts — AI API Route Generator

import { NextResponse } from "next/server";
import { generateAPIRoutes } from "@/lib/ai/api-generator";
import type { Table } from "@/lib/ai/database-generator";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    description: "AI API Generator — POST { prompt, tables?, framework? } to generate CRUD API routes",
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

  const {
    prompt,
    tables,
    framework = "nextjs",
  } = body as {
    prompt?: string;
    tables?: Table[];
    framework?: "nextjs" | "express";
  };

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const validFrameworks = ["nextjs", "express"];
  if (!validFrameworks.includes(framework)) {
    return NextResponse.json({ error: "framework must be nextjs or express" }, { status: 400 });
  }

  try {
    const result = await generateAPIRoutes(prompt.trim().slice(0, 2000), tables, framework);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message ?? "Failed to generate API routes" },
      { status: 500 }
    );
  }
}
