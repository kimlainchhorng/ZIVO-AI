// Database Agent – PostgreSQL/Supabase schema generation, RLS policies,
// migration scripts, indexing strategies, and data seeding.

import OpenAI from "openai";
import { systemPrompts, SystemPromptOptions } from "@/lib/system-prompts";
import { parseAIOutput, CodeGenerationSchema } from "@/lib/structured-outputs";
import { storeMemory } from "@/lib/memory";

export interface DatabaseGenerateRequest {
  projectId: string;
  description: string;
  entities?: string[];
  includeRLS?: boolean;
  includeMigrations?: boolean;
  options?: SystemPromptOptions;
}

export interface DatabaseGenerateResult {
  code: CodeGenerationSchema | null;
  raw: string;
  error?: string;
}

export class DatabaseAgent {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generate(request: DatabaseGenerateRequest): Promise<DatabaseGenerateResult> {
    const {
      projectId,
      description,
      entities = [],
      includeRLS = true,
      includeMigrations = true,
      options,
    } = request;

    const userMessage = [
      `Generate a PostgreSQL/Supabase database schema:`,
      `\nDescription: ${description}`,
      entities.length > 0
        ? `\nEntities:\n${entities.map((e) => `- ${e}`).join("\n")}`
        : "",
      includeRLS ? "\nInclude Row-Level Security (RLS) policies." : "",
      includeMigrations ? "\nInclude migration SQL." : "",
    ].join("");

    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompts.database(options) },
          { role: "user", content: userMessage },
        ],
        temperature: 0.2,
      });

      const raw = response.choices[0]?.message?.content ?? "";
      const { data, error } = parseAIOutput(raw);

      if (error || !data || data.type !== "code_generation") {
        return { code: null, raw, error: error ?? "Invalid code generation output" };
      }

      const code = data as CodeGenerationSchema;
      for (const file of code.files) {
        storeMemory(projectId, "generated_artifact", file.path, { description });
      }

      return { code, raw };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "DatabaseAgent error";
      return { code: null, raw: "", error: msg };
    }
  }
}
