// POST { prompt: string; model?: string }
// Returns ArchitecturePlan JSON
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export interface TechStackItem {
  name: string;
  purpose: string;
}

export interface PagePlan {
  name: string;
  path: string;
  description: string;
}

export interface ComponentPlan {
  name: string;
  description: string;
}

export interface DatabaseTable {
  name: string;
  description: string;
}

export interface DatabasePlan {
  tables: DatabaseTable[];
  provider: string;
}

export interface AuthPlan {
  required: boolean;
  provider: string;
  methods: string[];
}

export interface ArchitecturePlan {
  projectType: string;
  techStack: TechStackItem[];
  pages: PagePlan[];
  components: ComponentPlan[];
  database: DatabasePlan;
  auth: AuthPlan;
  thirdPartyServices: string[];
  estimatedFiles: number;
  complexity: "simple" | "medium" | "complex";
}

const ARCH_PLAN_PROMPT = `You are a senior software architect. Given a user prompt, produce a structured architecture plan.
Return ONLY valid JSON matching this schema (no markdown fences):
{
  "projectType": "SaaS | E-commerce | Dashboard | Landing Page | Portfolio | Blog | Mobile App | Other",
  "techStack": [{ "name": "Next.js 15", "purpose": "React framework for full-stack" }],
  "pages": [{ "name": "Home", "path": "/", "description": "Landing page with hero and features" }],
  "components": [{ "name": "Navbar", "description": "Top navigation with auth state" }],
  "database": {
    "tables": [{ "name": "users", "description": "User accounts" }],
    "provider": "Supabase | PlanetScale | None"
  },
  "auth": {
    "required": true,
    "provider": "Supabase Auth | NextAuth | None",
    "methods": ["email", "google"]
  },
  "thirdPartyServices": ["Stripe", "Resend"],
  "estimatedFiles": 12,
  "complexity": "simple | medium | complex"
}`;

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY environment variable is not set");
  return new OpenAI({ apiKey });
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({})) as { prompt?: string; model?: string };
    const { prompt, model = "gpt-4o" } = body;
    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const response = await getClient().chat.completions.create({
      model,
      temperature: 0.3,
      max_tokens: 2048,
      messages: [
        { role: "system", content: ARCH_PLAN_PROMPT },
        { role: "user", content: `Create an architecture plan for: ${prompt}` },
      ],
    });

    const raw = response.choices?.[0]?.message?.content ?? "{}";
    const match = raw.match(/\{[\s\S]*\}/);
    try {
      const parsed = JSON.parse(match ? match[0] : raw) as ArchitecturePlan;
      const plan: ArchitecturePlan = {
        projectType: parsed.projectType ?? "Web App",
        techStack: Array.isArray(parsed.techStack) ? parsed.techStack : [],
        pages: Array.isArray(parsed.pages) ? parsed.pages : [],
        components: Array.isArray(parsed.components) ? parsed.components : [],
        database: parsed.database ?? { tables: [], provider: "None" },
        auth: parsed.auth ?? { required: false, provider: "None", methods: [] },
        thirdPartyServices: Array.isArray(parsed.thirdPartyServices) ? parsed.thirdPartyServices : [],
        estimatedFiles: parsed.estimatedFiles ?? 5,
        complexity: parsed.complexity ?? "medium",
      };
      return NextResponse.json(plan);
    } catch {
      return NextResponse.json({ error: "Failed to parse plan" }, { status: 502 });
    }
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error)?.message ?? "Server error" }, { status: 500 });
  }
}
