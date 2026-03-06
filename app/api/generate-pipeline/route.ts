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
  pipelineType?:
    | "etl"
    | "cron"
    | "webhook"
    | "queue"
    | "streaming"
    | "event-driven"
    | "ml-inference"
    | "notification"
    | "data-sync"
    | "all";
  description?: string;
  queueProvider?: "bullmq" | "inngest" | "kafka" | "redis-streams" | "sqs";
  schedule?: string;
  // When retryPolicy is omitted, the AI defaults to exponential backoff with 3 retries and 1000ms base delay.
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
    strategy: "fixed" | "exponential";
  };
  deadLetterQueue?: boolean;
  monitoring?: boolean;
  outputFormat?: "ts" | "yaml" | "both";
}

export interface GeneratePipelineResponse {
  files: PipelineFile[];
  summary: string;
  setupInstructions: string;
  requiredEnvVars: string[];
  architecture?: string;
  estimatedThroughput?: string;
  warnings?: string[];
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
  "requiredEnvVars": [],
  "architecture": "ASCII diagram of the pipeline",
  "estimatedThroughput": "e.g. ~10k events/sec with BullMQ",
  "warnings": []
}

Pipeline generation rules:
- Always include retry logic with exponential backoff by default.
- When deadLetterQueue is true, add a DLQ consumer and routing logic for failed messages.
- When monitoring is true, add OpenTelemetry tracing hooks AND a Prometheus metrics endpoint (/metrics).
- When outputFormat is "both", generate TypeScript source files AND a YAML deployment manifest.
- Support queue providers: BullMQ, Inngest, Kafka, Redis Streams, and SQS — use the correct SDK for each.
- For "ml-inference" type: include model warm-up, request batching, and a fallback/circuit-breaker.
- For "event-driven" type: include event schema (Zod), emitter, listener, and a saga orchestrator pattern.
- For "data-sync" type: include change-data-capture (CDC) with Debezium or polling, and a conflict resolution strategy (last-write-wins or CRDTs).
- For "notification" type: include a multi-channel dispatcher (email via Resend, SMS via Twilio, push via FCM, Slack webhook).
- Always include pipeline workers, queue setup, scheduling configuration, and TypeScript types.
- Include an ASCII architecture diagram in the "architecture" field.

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
      schedule,
      retryPolicy,
      deadLetterQueue = false,
      monitoring = false,
      outputFormat = "ts",
    } = body;

    const userPrompt = `Generate a data pipeline for "${appName}".
Pipeline type: ${pipelineType}
Description: ${description}
Queue provider: ${queueProvider}
${schedule ? `Schedule (cron): ${schedule}` : ""}
${retryPolicy ? `Retry policy: maxRetries=${retryPolicy.maxRetries}, backoffMs=${retryPolicy.backoffMs}, strategy=${retryPolicy.strategy}` : ""}
Dead-letter queue: ${deadLetterQueue}
Monitoring (OpenTelemetry + Prometheus): ${monitoring}
Output format: ${outputFormat}

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
