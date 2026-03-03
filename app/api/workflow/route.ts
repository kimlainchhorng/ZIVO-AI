import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type WorkflowStepType = "Generate Code" | "Ask AI" | "Transform" | "Summarize" | "Scrape URL" | "Deploy";

export interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  input: string;
}

export interface WorkflowStepResult {
  id: string;
  type: WorkflowStepType;
  input: string;
  output: string;
  status: "done" | "error";
  error?: string;
}

async function runStep(step: WorkflowStep, previousOutput: string): Promise<WorkflowStepResult> {
  const contextNote = previousOutput
    ? `\n\nPrevious step output:\n${previousOutput.slice(0, 2000)}`
    : "";

  try {
    if (step.type === "Scrape URL") {
      // We cannot fetch external URLs server-side without issues; return placeholder
      return {
        id: step.id,
        type: step.type,
        input: step.input,
        output: `[URL scraping is not available in this environment. URL: ${step.input}]`,
        status: "done",
      };
    }

    if (step.type === "Deploy") {
      return {
        id: step.id,
        type: step.type,
        input: step.input,
        output: `[Deploy step: ${step.input || "No deployment target specified"}]`,
        status: "done",
      };
    }

    const systemPrompts: Record<string, string> = {
      "Generate Code": "You are ZIVO AI — an expert full-stack developer. Generate complete, working code based on the user's request.",
      "Ask AI": "You are ZIVO AI — a helpful assistant. Answer the user's question clearly and concisely.",
      "Transform": "You are ZIVO AI — a code transformation expert. Transform or refactor the provided code/content as requested.",
      "Summarize": "You are ZIVO AI — a summarization expert. Summarize the provided content clearly and concisely.",
    };

    const systemPrompt = systemPrompts[step.type] ?? "You are ZIVO AI — a helpful assistant.";
    const userContent = step.input + contextNote;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 2000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    });

    const output = response.choices?.[0]?.message?.content ?? "";
    return { id: step.id, type: step.type, input: step.input, output, status: "done" };
  } catch (err: unknown) {
    return {
      id: step.id,
      type: step.type,
      input: step.input,
      output: "",
      status: "error",
      error: (err as Error)?.message ?? "Step failed",
    };
  }
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const steps: WorkflowStep[] = Array.isArray(body?.steps) ? body.steps : [];

    if (steps.length === 0) {
      return NextResponse.json({ error: "No steps provided" }, { status: 400 });
    }

    const results: WorkflowStepResult[] = [];
    let previousOutput = "";

    for (const step of steps) {
      const result = await runStep(step, previousOutput);
      results.push(result);
      if (result.status === "done") {
        previousOutput = result.output;
      }
    }

    return NextResponse.json({ results });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
