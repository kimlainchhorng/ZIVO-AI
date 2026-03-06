import OpenAI from "openai";
import type { ProjectBlueprint } from "./pass1-plan";
import { AIOutputSchema, type AIOutput } from "../schema";

export async function runPass2Generate(
  prompt: string,
  blueprint: ProjectBlueprint,
  existingFiles: { path: string; content: string }[] = [],
  model = "gpt-4o"
): Promise<AIOutput> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const blueprintContext = `
## PROJECT BLUEPRINT (follow this exactly)
Goal: ${blueprint.goal}
Tech Stack: ${blueprint.techStack.join(", ")}

Pages to generate (ALL required):
${blueprint.pages.map(p => `- ${p.route}: ${p.description}${p.auth ? " [requires auth]" : ""}`).join("\n")}

API Routes to generate (ALL required):
${blueprint.apiRoutes.map(r => `- ${r.path} [${r.methods.join(", ")}]: ${r.description}`).join("\n")}

Components to generate:
${blueprint.components.map(c => `- ${c.path}: ${c.description}`).join("\n")}

Database Models:
${blueprint.databaseModels.map(m => `- ${m.name}: ${m.fields.join(", ")}`).join("\n")}

Required env vars: ${blueprint.envVars.join(", ")}
Target file count: ${blueprint.estimatedFileCount}+ files

IMPORTANT: Generate ALL pages, routes, and components listed above. Do not skip any.`;

  const existingContext = existingFiles.length > 0
    ? `\nExisting files (update these):\n${existingFiles.map(f => `- ${f.path}`).join("\n")}`
    : "";

  const systemPrompt = `You are ZIVO AI — world-class full-stack developer.

Return ONLY valid JSON:
{
  "thinking": "analysis",
  "files": [{ "path": "...", "content": "COMPLETE file content", "action": "create", "language": "typescript" }],
  "env": ["VAR=value"],
  "routes": ["/", "/dashboard"],
  "commands": ["npm install"],
  "warnings": [],
  "missing_env": [],
  "next_steps": [],
  "summary": "what was built"
}

RULES:
- EVERY file has COMPLETE content, no placeholders
- Use TypeScript strict mode
- Beautiful Tailwind UI
- Handle loading, error, empty states
- Generate ALL files from the blueprint`;

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `${blueprintContext}\n\nUser request: ${prompt}${existingContext}` },
    ],
    temperature: 0.2,
    max_tokens: 32000,
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(match ? match[0] : cleaned);
  return AIOutputSchema.parse(parsed);
}
