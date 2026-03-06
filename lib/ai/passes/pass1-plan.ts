import OpenAI from "openai";
import { z } from "zod";

export interface ProjectBlueprint {
  goal: string;
  techStack: string[];
  pages: { route: string; description: string; auth?: boolean }[];
  apiRoutes: { path: string; methods: string[]; description: string }[];
  components: { name: string; path: string; description: string }[];
  databaseModels: { name: string; fields: string[] }[];
  envVars: string[];
  estimatedFileCount: number;
}

const PLAN_SYSTEM_PROMPT = `You are a senior software architect. Given a user's app idea, create a detailed project blueprint.

Return ONLY valid JSON:
{
  "goal": "one sentence summary",
  "techStack": ["Next.js 15", "TypeScript", "Tailwind", "Supabase", "Prisma"],
  "pages": [
    { "route": "/", "description": "Landing page", "auth": false },
    { "route": "/dashboard", "description": "Main dashboard", "auth": true }
  ],
  "apiRoutes": [
    { "path": "/api/users", "methods": ["GET", "POST"], "description": "User CRUD" }
  ],
  "components": [
    { "name": "Sidebar", "path": "components/Sidebar.tsx", "description": "Navigation sidebar" }
  ],
  "databaseModels": [
    { "name": "User", "fields": ["id: string", "email: string", "createdAt: DateTime"] }
  ],
  "envVars": ["DATABASE_URL", "NEXTAUTH_SECRET"],
  "estimatedFileCount": 35
}`;

const ProjectBlueprintSchema = z.object({
  goal: z.string(),
  techStack: z.array(z.string()),
  pages: z.array(
    z.object({
      route: z.string(),
      description: z.string(),
      auth: z.boolean().optional(),
    })
  ),
  apiRoutes: z.array(
    z.object({
      path: z.string(),
      methods: z.array(z.string()),
      description: z.string(),
    })
  ),
  components: z.array(
    z.object({
      name: z.string(),
      path: z.string(),
      description: z.string(),
    })
  ),
  databaseModels: z.array(
    z.object({
      name: z.string(),
      fields: z.array(z.string()),
    })
  ),
  envVars: z.array(z.string()),
  estimatedFileCount: z.number(),
});

export async function runPass1Plan(prompt: string, model = "gpt-4o"): Promise<ProjectBlueprint> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: PLAN_SYSTEM_PROMPT },
      { role: "user", content: `Plan this app: ${prompt}` },
    ],
    temperature: 0.3,
    max_tokens: 4096,
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const match = raw.match(/\{[\s\S]*\}/);
  return ProjectBlueprintSchema.parse(JSON.parse(match ? match[0] : raw));
}
