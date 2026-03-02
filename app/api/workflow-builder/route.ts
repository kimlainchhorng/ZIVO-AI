import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { AIWorkflow, WorkflowStep } from "../../../lib/types";

export const runtime = "nodejs";

// ─── POST /api/workflow-builder ───────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const description = typeof body.description === "string" ? body.description : "";
    const project_id  = typeof body.project_id  === "string" ? body.project_id  : "local";

    if (!description) {
      return NextResponse.json({ error: "description is required" }, { status: 400 });
    }

    const client = new OpenAI({ apiKey });
    const prompt = `You are a workflow architect. Design a business workflow for ZIVO AI.

Description: ${description}

Return JSON matching this structure:
{
  "name": "string",
  "description": "string",
  "trigger": {
    "type": "manual|schedule|event|webhook",
    "config": {}
  },
  "steps": [
    {
      "id": "step_1",
      "name": "string",
      "type": "action|condition|parallel|loop",
      "action": "string",
      "config": {},
      "next": ["step_2"],
      "on_error": "fail|continue|retry",
      "retry_count": 3
    }
  ]
}

Include error handling, retry logic, and audit trail steps. Make it production-ready.`;

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 2048,
    });

    let workflowDef: Partial<AIWorkflow> = {};
    try {
      workflowDef = JSON.parse(response.choices[0]?.message?.content ?? "{}");
    } catch {
      // ignore parse errors
    }

    const workflow: Partial<AIWorkflow> = {
      id: `wf-${Date.now()}`,
      project_id,
      name: workflowDef.name ?? "Untitled Workflow",
      description: workflowDef.description,
      status: "active",
      trigger: workflowDef.trigger ?? { type: "manual" },
      steps: (workflowDef.steps ?? []) as WorkflowStep[],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, workflow });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
