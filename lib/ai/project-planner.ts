// lib/ai/project-planner.ts — Turns a user prompt into a structured project plan

import OpenAI from "openai";

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  files: string[];
  status: "pending" | "running" | "done" | "error";
  dependencies: string[];
}

export interface ProjectPlan {
  goal: string;
  techStack: { name: string; reason: string }[];
  tasks: ProjectTask[];
  estimatedFiles: number;
  complexity: "low" | "medium" | "high";
}

const PLANNER_SYSTEM_PROMPT = `You are a project planner for ZIVO AI. Given a user prompt, create a structured project plan.
Return ONLY valid JSON matching this schema:
{
  "goal": "one-sentence project goal",
  "techStack": [{ "name": "Next.js 15", "reason": "..." }],
  "tasks": [
    {
      "id": "task-1",
      "title": "Setup project",
      "description": "...",
      "files": ["app/layout.tsx", "package.json"],
      "status": "pending",
      "dependencies": []
    }
  ],
  "estimatedFiles": 8,
  "complexity": "medium"
}`;

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function createProjectPlan(
  prompt: string,
  model = "gpt-4o"
): Promise<ProjectPlan> {
  const response = await getClient().chat.completions.create({
    model,
    temperature: 0.3,
    max_tokens: 2048,
    messages: [
      { role: "system", content: PLANNER_SYSTEM_PROMPT },
      { role: "user", content: `Create a project plan for: ${prompt}` },
    ],
  });

  const raw = response.choices?.[0]?.message?.content ?? "{}";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  try {
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw) as ProjectPlan;
    // Ensure required fields
    return {
      goal: parsed.goal ?? prompt,
      techStack: Array.isArray(parsed.techStack) ? parsed.techStack : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      estimatedFiles: parsed.estimatedFiles ?? 0,
      complexity: parsed.complexity ?? "medium",
    };
  } catch {
    return {
      goal: prompt,
      techStack: [{ name: "Next.js 15", reason: "Modern full-stack framework" }],
      tasks: [
        {
          id: "task-1",
          title: "Generate project",
          description: prompt,
          files: [],
          status: "pending",
          dependencies: [],
        },
      ],
      estimatedFiles: 5,
      complexity: "medium",
    };
  }
}
