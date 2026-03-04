// orchestrator.ts — Main agent loop: plan → execute → verify for ZIVO AI

import OpenAI from "openai";
import { createPlan, type Plan, type PlanStep } from "./planner";
import { getToolByName } from "./tools";

export interface AgentFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface StepResult {
  step: number;
  title: string;
  status: "success" | "error" | "skipped";
  output: string;
}

export interface OrchestratorResult {
  plan: Plan;
  stepResults: StepResult[];
  files: AgentFile[];
  summary: string;
}

const EXECUTOR_SYSTEM_PROMPT = `You are ZIVO Agent, an autonomous full-stack software engineer.
Given a task, you will:
1. Plan: break it into small numbered steps
2. Execute each step using tools
3. Verify each step completed correctly
4. Return the final result

Tools available: readFile, writeFile, runShell, searchDocs
Always think step by step. Never skip verification.

When generating code files, respond with a valid JSON object:
{
  "files": [
    { "path": "relative/path.ts", "content": "...", "action": "create" | "update" | "delete" }
  ],
  "summary": "Brief summary of what was done"
}

Return ONLY valid JSON, no markdown fences, no extra text.`;

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function _executeStep(
  step: PlanStep,
  context: string
): Promise<StepResult> {
  // If a specific tool is assigned, execute it
  if (step.tool && step.tool !== "null") {
    const tool = getToolByName(step.tool);
    if (tool && step.toolParams) {
      const result = await tool.execute(step.toolParams);
      return {
        step: step.step,
        title: step.title,
        status: result.success ? "success" : "error",
        output: result.success ? result.output : (result.error ?? "Unknown error"),
      };
    }
  }

  // Default: use LLM to execute the step
  const response = await getClient().chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    max_tokens: 2048,
    messages: [
      { role: "system", content: EXECUTOR_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Context:\n${context}\n\nExecute step ${step.step}: ${step.title}\n${step.description}`,
      },
    ],
  });

  const output = response.choices?.[0]?.message?.content ?? "";
  return {
    step: step.step,
    title: step.title,
    status: "success",
    output,
  };
}

export async function runOrchestrator(task: string): Promise<OrchestratorResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing in environment");
  }

  // Phase 1: Plan
  const plan = await createPlan(task);

  const stepResults: StepResult[] = [];
  let context = `Goal: ${plan.goal}\n\nTask: ${task}`;
  const files: AgentFile[] = [];

  // Phase 2: Execute each step
  for (const step of plan.steps) {
    const result = await _executeStep(step, context);
    stepResults.push(result);

    // Accumulate context
    context += `\n\nStep ${step.step} (${step.title}) result:\n${result.output}`;

    // Parse any files generated in this step
    if (result.output) {
      try {
        const parsed = JSON.parse(result.output);
        if (Array.isArray(parsed.files)) {
          files.push(...parsed.files);
        }
      } catch (parseErr) {
        // Not a JSON response — treat as plain text output (expected for tool execution results)
        void parseErr;
      }
    }

    // Stop on critical error
    if (result.status === "error") {
      break;
    }
  }

  // Phase 3: Verify — generate final summary
  const verifyResponse = await getClient().chat.completions.create({
    model: "gpt-4o",
    temperature: 0.1,
    max_tokens: 512,
    messages: [
      {
        role: "system",
        content: "You are a senior code reviewer. Summarize in 2-3 sentences what was accomplished.",
      },
      { role: "user", content: context },
    ],
  });

  const summary = verifyResponse.choices?.[0]?.message?.content ?? "Task completed.";

  return { plan, stepResults, files, summary };
}
