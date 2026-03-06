// app/api/project-plan/route.ts — Rich project plan endpoint (separate from /api/plan)

import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export interface ProjectPlanPhase {
  phase: number;
  name: string;
  tasks: string[];
  estimatedFiles: string[];
}

export interface ProjectPlanResponse {
  title: string;
  description: string;
  framework: string;
  techStack: string[];
  phases: ProjectPlanPhase[];
  pages: string[];
  components: string[];
  databaseTables: string[];
  authStrategy: string;
  estimatedComplexity: "low" | "medium" | "high";
}

const PROJECT_PLAN_SYSTEM_PROMPT = `You are a senior full-stack software architect. Given a user prompt, produce a detailed, step-by-step project plan.

Return ONLY a valid JSON object (no markdown fences):
{
  "title": "Project title",
  "description": "2-3 sentence project description",
  "framework": "Next.js 15 (App Router)",
  "techStack": ["Next.js 15", "TypeScript", "Tailwind CSS", "Supabase", "shadcn/ui"],
  "phases": [
    {
      "phase": 1,
      "name": "Project Setup & Foundation",
      "tasks": ["Initialize Next.js 15 with TypeScript", "Configure Tailwind CSS", "Set up Supabase client"],
      "estimatedFiles": ["package.json", "tailwind.config.ts", "lib/supabase.ts"]
    },
    {
      "phase": 2,
      "name": "Core UI Components",
      "tasks": ["Build Navbar component", "Create layout structure", "Implement design system"],
      "estimatedFiles": ["components/Navbar.tsx", "app/layout.tsx", "styles/globals.css"]
    },
    {
      "phase": 3,
      "name": "Feature Implementation",
      "tasks": ["Implement main features", "Build data fetching layer", "Add form handling"],
      "estimatedFiles": ["app/page.tsx", "lib/api.ts", "components/Form.tsx"]
    },
    {
      "phase": 4,
      "name": "Authentication & Security",
      "tasks": ["Add auth pages", "Configure middleware", "Set up RLS policies"],
      "estimatedFiles": ["app/(auth)/login/page.tsx", "middleware.ts", "supabase/migrations/001_rls.sql"]
    },
    {
      "phase": 5,
      "name": "Testing & Deployment",
      "tasks": ["Add unit tests", "Configure CI/CD", "Deploy to Vercel"],
      "estimatedFiles": ["__tests__/", ".github/workflows/ci.yml", "vercel.json"]
    }
  ],
  "pages": ["/", "/dashboard", "/profile"],
  "components": ["Navbar", "Footer", "StatsCard", "DataTable"],
  "databaseTables": ["users", "profiles", "posts"],
  "authStrategy": "Supabase Auth with email/password and OAuth",
  "estimatedComplexity": "medium"
}`;

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const VALID_MODELS = new Set([
  "gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo",
  "o1", "o1-mini", "o1-preview", "gpt-4.1", "gpt-4.1-mini",
]);

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

  const { prompt, model } = body as { prompt?: string; model?: string };
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const resolvedModel = typeof model === "string" && VALID_MODELS.has(model) ? model : "gpt-4o";

  try {
    const client = getClient();
    const response = await client.chat.completions.create({
      model: resolvedModel,
      temperature: 0.3,
      max_tokens: 3000,
      messages: [
        { role: "system", content: PROJECT_PLAN_SYSTEM_PROMPT },
        { role: "user", content: `Create a detailed project plan for:\n\n${prompt.trim()}` },
      ],
    });

    const rawText = response.choices?.[0]?.message?.content ?? "";
    let parsed: ProjectPlanResponse;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText) as ProjectPlanResponse;
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message ?? "Failed to generate project plan" },
      { status: 500 }
    );
  }
}
