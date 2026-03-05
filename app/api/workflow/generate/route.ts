// app/api/workflow/generate/route.ts — AI Workflow Generator

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { WORKFLOW_SYSTEM_PROMPT, buildWorkflowUserPrompt } from "@/prompts/workflow-builder";

export const runtime = "nodejs";

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  return new OpenAI({ apiKey });
}

interface GenerateWorkflowRequest {
  prompt: string;
  model?: string;
}

interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  config: Record<string, unknown>;
}

interface GeneratedWorkflow {
  name: string;
  description: string;
  trigger: "manual" | "schedule" | "webhook" | "event";
  steps: WorkflowNode[];
}

interface GenerateWorkflowResponse {
  workflow: GeneratedWorkflow;
  explanation: string;
}

export async function POST(req: Request): Promise<Response> {
  let body: GenerateWorkflowRequest;
  try {
    body = (await req.json()) as GenerateWorkflowRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { prompt, model = "gpt-4o" } = body;

  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const client = getClient();

  let raw: string;
  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.4,
      messages: [
        { role: "system", content: WORKFLOW_SYSTEM_PROMPT },
        { role: "user", content: buildWorkflowUserPrompt(prompt.trim()) },
      ],
    });
    raw = completion.choices[0]?.message?.content ?? "";
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "OpenAI request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  let workflow: GeneratedWorkflow;
  try {
    // Strip any accidental markdown fences before parsing
    const cleaned = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    workflow = JSON.parse(cleaned) as GeneratedWorkflow;
  } catch {
    return NextResponse.json(
      { error: "AI returned invalid JSON", raw },
      { status: 502 }
    );
  }

  // Validate minimal shape
  if (!workflow.name || !Array.isArray(workflow.steps)) {
    return NextResponse.json(
      { error: "AI response is missing required fields (name, steps)", raw },
      { status: 502 }
    );
  }

  const explanation = `Generated "${workflow.name}" with ${workflow.steps.length} step${workflow.steps.length !== 1 ? "s" : ""}. ${workflow.description ?? ""}`.trim();

  const response: GenerateWorkflowResponse = { workflow, explanation };
  return NextResponse.json(response);
}
