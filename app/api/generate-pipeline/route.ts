import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface PipelineFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GeneratePipelineRequest {
  appName?: string;
  pipelineType?: "etl" | "cron" | "webhook" | "queue" | "all";
  description?: string;
  queueProvider?: "bullmq" | "inngest";
}

export interface GeneratePipelineResponse {
  files: PipelineFile[];
  summary: string;
  setupInstructions: string;
  requiredEnvVars: string[];
}

const PIPELINE_SYSTEM_PROMPT = `You are ZIVO AI — an expert in data pipeline architecture.

Generate a complete data processing pipeline for a Next.js App Router project.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "setupInstructions": "Step-by-step setup",
  "requiredEnvVars": []
}

Always include pipeline workers, queue setup, scheduling configuration, and TypeScript types.

Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json() as GeneratePipelineRequest;
    const {
      appName = "My App",
      pipelineType = "etl",
      description = "data processing pipeline",
      queueProvider = "bullmq",
    } = body;

    const userPrompt = `Generate a data pipeline for "${appName}".
Pipeline type: ${pipelineType}
Description: ${description}
Queue provider: ${queueProvider}

Include ETL workers, job queue setup, scheduling, and error handling.`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: PIPELINE_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GeneratePipelineResponse;
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
