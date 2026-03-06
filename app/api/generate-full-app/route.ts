import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface FullAppFile {
  path: string;
  content: string;
  action: "create";
}

export interface FullAppPlan {
  pages: Array<{ path: string; name: string; description: string }>;
  components: string[];
  database: Array<{ table: string; columns: string[] }>;
}

export interface GenerateFullAppRequest {
  prompt: string;
  appName?: string;
  features?: Array<"auth" | "dashboard" | "database" | "api" | "all">;
  model?: string;
}

export interface GenerateFullAppResponse {
  plan: FullAppPlan;
  files: FullAppFile[];
  summary: string;
}

const FULL_APP_SYSTEM_PROMPT = `You are ZIVO AI — an expert full-stack engineer who builds complete Next.js applications.

Given a prompt, you will:
1. First create a SITE PLAN (pages, components, database schema)
2. Then generate ALL files for the entire app

Respond ONLY with a valid JSON object:
{
  "plan": {
    "pages": [{ "path": "/", "name": "Home", "description": "Landing page" }],
    "components": ["Navbar", "Footer", "Button"],
    "database": [{ "table": "users", "columns": ["id", "email", "name", "created_at"] }]
  },
  "files": [
    { "path": "app/page.tsx", "content": "...", "action": "create" },
    { "path": "app/login/page.tsx", "content": "...", "action": "create" },
    { "path": "app/signup/page.tsx", "content": "...", "action": "create" },
    { "path": "app/dashboard/page.tsx", "content": "...", "action": "create" },
    { "path": "app/settings/page.tsx", "content": "...", "action": "create" },
    { "path": "app/profile/page.tsx", "content": "...", "action": "create" },
    { "path": "app/layout.tsx", "content": "...", "action": "create" },
    { "path": "middleware.ts", "content": "...", "action": "create" },
    { "path": "lib/supabase.ts", "content": "...", "action": "create" },
    { "path": "components/Navbar.tsx", "content": "...", "action": "create" }
  ],
  "summary": "Generated a full-stack app with X pages and Y components."
}

Always generate ALL of these files:
- app/page.tsx — Landing / home page
- app/login/page.tsx — Login form (email/password + OAuth buttons)
- app/signup/page.tsx — Signup with validation
- app/dashboard/page.tsx — Main dashboard with stats and navigation
- app/settings/page.tsx — User settings page
- app/profile/page.tsx — User profile page
- app/layout.tsx — Root layout with metadata and global providers
- middleware.ts — Protects /dashboard, /settings, /profile routes
- lib/supabase.ts — Supabase client configuration
- components/Navbar.tsx — Shared navigation component
- components/Footer.tsx — Shared footer component

Use TypeScript, Tailwind CSS, Next.js App Router, and Supabase for auth/database.
Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request): Promise<Response> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      prompt,
      appName = "My App",
      features = ["auth", "dashboard", "database"],
      model = "gpt-4o",
    }: GenerateFullAppRequest = body;

    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 }
      );
    }

    const featureList = Array.isArray(features) ? features : ["auth", "dashboard"];
    const includeAll = featureList.includes("all");
    const includeAuth = includeAll || featureList.includes("auth");
    const includeDashboard = includeAll || featureList.includes("dashboard");
    const includeDatabase = includeAll || featureList.includes("database");
    const includeApi = includeAll || featureList.includes("api");

    const userPrompt = `Build a complete Next.js full-stack application called "${appName}".

User prompt: ${prompt}

Features to include:
${includeAuth ? "- Authentication (login, signup, forgot password, OAuth with Google/GitHub)" : ""}
${includeDashboard ? "- Dashboard with analytics, stats cards, and data tables" : ""}
${includeDatabase ? "- Supabase database with proper schema, RLS policies, and TypeScript types" : ""}
${includeApi ? "- API routes for CRUD operations" : ""}

Generate the complete app with all required pages, components, and configuration files.
Include real, production-quality code with proper TypeScript types, error handling, and responsive design using Tailwind CSS.`;

    const response = await getClient().chat.completions.create({
      model: model === "gpt-4o" ? "gpt-4o" : model,
      temperature: 0.2,
      max_tokens: 16000,
      messages: [
        { role: "system", content: FULL_APP_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateFullAppResponse;
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

    if (!parsed.plan) {
      parsed.plan = {
        pages: parsed.files
          .filter((f) => f.path.endsWith("/page.tsx") || f.path === "app/page.tsx")
          .map((f) => ({
            path: "/" + f.path.replace(/^app\//, "").replace(/\/page\.tsx$/, ""),
            name: f.path.split("/").slice(-2)[0] ?? "Page",
            description: `Generated page: ${f.path}`,
          })),
        components: parsed.files
          .filter((f) => f.path.startsWith("components/"))
          .map((f) => f.path.replace("components/", "").replace(/\.tsx$/, "")),
        database: [],
      };
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
