import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface GeneratedFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface FlowDiagram {
  name: string;
  steps: string[];
  ascii: string;
}

export interface GenerateFlowRequest {
  appName: string;
  flows: string[];
}

export interface GenerateFlowResponse {
  files: GeneratedFile[];
  flowDiagrams: FlowDiagram[];
  summary: string;
}

const FLOW_SYSTEM_PROMPT = `You are ZIVO AI — an expert in application flow design and implementation for Next.js 15.

Generate complete flow documentation and server action implementations.

For each flow, always generate:
1. docs/flows/[flow-name].md — Markdown flow diagram using ASCII arrows (→, ↓)
2. app/actions/[flow-name].ts — Next.js Server Actions implementing each flow step with 'use server' directive

Rules:
- Use kebab-case for flow names in file paths
- Server Actions must use 'use server' directive
- Each step must be a separate async function with TypeScript types
- ASCII diagrams should clearly show decision points and branches
- Include error handling for each step
- No console.log in production code

Respond ONLY with a valid JSON object (no markdown fences):
{
  "files": [
    { "path": "docs/flows/[flow-name].md", "content": "...", "action": "create" },
    { "path": "app/actions/[flow-name].ts", "content": "...", "action": "create" }
  ],
  "flowDiagrams": [
    {
      "name": "flow name",
      "steps": ["Step 1", "Step 2", "Step 3"],
      "ascii": "User → Step1 → Step2 → Complete"
    }
  ],
  "summary": "Brief description"
}`;

function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const appName: string = body?.appName || "MyApp";
    const flows: string[] = Array.isArray(body?.flows) ? body.flows : [];

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is missing" }, { status: 500 });
    }
    if (!flows.length) {
      return NextResponse.json({ error: "No flows provided" }, { status: 400 });
    }

    const userMessage = `App: ${appName}
Flows to implement: ${flows.join(", ")}

Generate documentation and server actions for each flow.`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 12000,
      messages: [
        { role: "system", content: FLOW_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    });

    const text = response.choices?.[0]?.message?.content || "{}";
    const clean = stripFences(text);

    let parsed: GenerateFlowResponse;
    try {
      parsed = JSON.parse(clean);
    } catch {
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        return NextResponse.json({ error: "Invalid JSON from AI" }, { status: 500 });
      }
    }

    if (!Array.isArray(parsed.files)) parsed.files = [];
    if (!Array.isArray(parsed.flowDiagrams)) parsed.flowDiagrams = [];
    if (!parsed.summary) parsed.summary = `Flow diagrams and actions generated for ${appName}`;

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
