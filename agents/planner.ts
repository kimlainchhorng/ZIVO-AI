// planner.ts — Breaks a user request into an ordered task list for the ZIVO AI Agent

import OpenAI from "openai";

export interface PlanStep {
  step: number;
  title: string;
  description: string;
  tool?: string;
  toolParams?: Record<string, string>;
}

export interface Plan {
  goal: string;
  steps: PlanStep[];
  estimatedComplexity: "low" | "medium" | "high";
}

const PLANNER_SYSTEM_PROMPT = `You are ZIVO Planner, an expert at decomposing complex software tasks into small, ordered steps.

Given a task description, respond ONLY with a valid JSON object matching this schema:
{
  "goal": "one-sentence summary of the goal",
  "steps": [
    {
      "step": 1,
      "title": "Short step title",
      "description": "Detailed description of what to do in this step",
      "tool": "readFile | writeFile | runShell | searchDocs | null",
      "toolParams": { "param": "value" }
    }
  ],
  "estimatedComplexity": "low | medium | high"
}

Rules:
- Break every task into 3-10 concrete, actionable steps.
- Each step must have a clear title and description.
- Assign the most appropriate tool if one applies.
- Return ONLY valid JSON, no markdown fences, no extra text.`;

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function createPlan(task: string): Promise<Plan> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing in environment");
  }

  const response = await getClient().chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    max_tokens: 2048,
    messages: [
      { role: "system", content: PLANNER_SYSTEM_PROMPT },
      { role: "user", content: task },
    ],
  });

  const text = response.choices?.[0]?.message?.content ?? "";

  let parsed: Plan;
  try {
    parsed = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Planner did not return valid JSON");
    }
    parsed = JSON.parse(match[0]);
  }

  if (!Array.isArray(parsed.steps)) {
    throw new Error("Invalid plan structure: missing steps array");
  }

  return parsed;
}
