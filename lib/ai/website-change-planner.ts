// lib/ai/website-change-planner.ts — AI planner for selective website file regeneration

import { z } from "zod";
import OpenAI from "openai";
import type { WebsitePlan } from "./website-plan";

// ─── Zod Schema ───────────────────────────────────────────────────────────────

export const NewFileSpecSchema = z.object({
  path: z.string().describe("Relative file path, e.g. app/team/page.tsx"),
  description: z.string().describe("What this new file should contain"),
});
export type NewFileSpec = z.infer<typeof NewFileSpecSchema>;

export const ChangePlanSchema = z.object({
  touchedFiles: z
    .array(z.string())
    .max(20, "touchedFiles must not exceed 20 entries")
    .describe("Existing file paths that need to be regenerated"),
  createFiles: z
    .array(NewFileSpecSchema)
    .describe("New files that need to be created"),
  deleteFiles: z
    .array(z.string())
    .describe("Existing file paths that should be removed (rare)"),
  notes: z.string().describe("Short explanation of the planned changes"),
});
export type ChangePlan = z.infer<typeof ChangePlanSchema>;

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `You are a website change planner. Given a user change request, a website plan (brand + pages), and the current list of project files, you decide which files need to be regenerated, created, or deleted.

Return ONLY valid JSON matching this schema:
{
  "touchedFiles": ["string"],        // existing files to regenerate (max 20)
  "createFiles": [                   // new files to create
    { "path": "string", "description": "string" }
  ],
  "deleteFiles": ["string"],         // existing files to remove (rare; omit if none)
  "notes": "string"                  // short plain-text summary of the plan
}

Rules:
- Be conservative: only include files that directly implement the requested change.
- Always include layout wiring files (components/site/Header.tsx, components/site/Footer.tsx, app/layout.tsx) when navigation or routes change.
- DO NOT include config files (next.config.ts, tailwind.config.ts, tsconfig.json) unless explicitly asked.
- DO NOT include lib/assets.ts, lib/design/tokens.ts unless the brand/colors change.
- Keep touchedFiles ≤ 20.
- If the request is minor (copy/text change), prefer 1–3 files.
- If the request adds a page, include the new page file plus Header/Footer.
- deleteFiles should be empty unless the request explicitly removes functionality.`;
}

// ─── Planner function ─────────────────────────────────────────────────────────

export interface PlannerInput {
  changeRequest: string;
  plan: WebsitePlan;
  existingFilePaths: string[];
  model?: string;
}

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY environment variable is not set");
  return new OpenAI({ apiKey });
}
/**
 * Ask an LLM to decide which files need to be regenerated for a given change request.
 * Returns a validated ChangePlan capped at 20 touched files.
 */
export async function planWebsiteChanges(input: PlannerInput): Promise<ChangePlan> {
  const { changeRequest, plan, existingFilePaths, model = "gpt-4o" } = input;

  const client = getClient();

  const userMessage = `Change request: ${changeRequest}

Website plan:
- Brand: ${plan.brand.name} — "${plan.brand.tagline}"
- Pages: ${plan.pages.map((p) => `${p.route} (${p.title})`).join(", ")}

Existing project files (${existingFilePaths.length} total):
${existingFilePaths.join("\n")}`;

  const response = await client.chat.completions.create({
    model,
    temperature: 0.2,
    max_tokens: 1024,
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: userMessage },
    ],
  });

  const raw = response.choices?.[0]?.message?.content ?? "{}";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  } catch {
    // Return a safe no-op plan on JSON parse failure
    return {
      touchedFiles: [],
      createFiles: [],
      deleteFiles: [],
      notes: "Planner failed to parse response; no changes planned.",
    };
  }

  try {
    const plan = ChangePlanSchema.parse(parsed);
    // Enforce cap even if schema allows it (belt + suspenders)
    return {
      ...plan,
      touchedFiles: plan.touchedFiles.slice(0, 20),
    };
  } catch {
    // Return a safe no-op plan on validation failure
    return {
      touchedFiles: [],
      createFiles: [],
      deleteFiles: [],
      notes: "Planner returned invalid schema; no changes planned.",
    };
  }
}
