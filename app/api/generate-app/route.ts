import { getOpenAIClient } from "@/lib/openai-client";
import { NextResponse } from "next/server";
import { addProject, GeneratedProject } from "../projects/route";

export const runtime = "nodejs";


const SYSTEM_PROMPT = `You are an expert full-stack developer. Generate a complete production-ready React + Supabase application based on the user's description.

Return a JSON object with this exact structure:
{
  "projectName": "string",
  "description": "string",
  "files": {
    "src/App.tsx": "...",
    "src/main.tsx": "...",
    "src/components/ui/Button.tsx": "...",
    "src/lib/supabase.ts": "...",
    "src/types/index.ts": "...",
    "supabase/migrations/001_init.sql": "...",
    "package.json": "...",
    "vite.config.ts": "...",
    "tailwind.config.ts": "...",
    "index.html": "...",
    ".env.local.example": "VITE_SUPABASE_URL=\\nVITE_SUPABASE_ANON_KEY=\\n",
    "README.md": "..."
  },
  "schema": {
    "tables": [{ "name": "string", "columns": [{ "name": "string", "type": "string", "constraints": "string" }] }]
  },
  "features": ["string"]
}

Always include:
- TypeScript throughout
- Tailwind CSS for styling
- Supabase client setup
- Authentication (email/password at minimum)
- Row Level Security (RLS) policies in migrations
- Responsive mobile-first design
- Proper error handling`;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { prompt, template, features } = body;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY in .env.local" }, { status: 500 });
    }
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const userMessage = [
      `Build a full-stack React + Supabase application: ${prompt}`,
      template ? `Use template: ${template}` : "",
      features?.length ? `Include these features: ${features.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const r = await getOpenAIClient().responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    });

    const text = (r as any).output_text ?? "";

    let parsed: any = null;
    try {
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[1] : text);
    } catch {
      parsed = { raw: text };
    }

    const projectId = `proj_${Date.now()}`;
    const project: GeneratedProject = {
      id: projectId,
      name: parsed.projectName || "Generated App",
      description: parsed.description || prompt,
      prompt,
      template: template || "custom",
      features: parsed.features || features || [],
      files: parsed.files || {},
      schema: parsed.schema || null,
      createdAt: new Date().toISOString(),
    };
    addProject(project);

    return NextResponse.json({ ok: true, projectId, project: parsed });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Generation failed" }, { status: 500 });
  }
}
