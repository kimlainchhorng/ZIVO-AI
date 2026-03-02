// Backend/API Agent – Next.js API route generation, database operations,
// business logic, validation, and third-party integrations.

import OpenAI from "openai";
import { systemPrompts, SystemPromptOptions } from "@/lib/system-prompts";
import { parseAIOutput, CodeGenerationSchema } from "@/lib/structured-outputs";
import { storeMemory } from "@/lib/memory";

export interface BackendGenerateRequest {
  projectId: string;
  description: string;
  apiPaths?: string[];
  databaseSchema?: string;
  options?: SystemPromptOptions;
}

export interface BackendGenerateResult {
  code: CodeGenerationSchema | null;
  raw: string;
  error?: string;
}

export class BackendAgent {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generate(request: BackendGenerateRequest): Promise<BackendGenerateResult> {
    const { projectId, description, apiPaths = [], databaseSchema, options } = request;

    const userMessage = [
      `Generate backend API code:`,
      `\nDescription: ${description}`,
      apiPaths.length > 0
        ? `\nAPI paths:\n${apiPaths.map((p) => `- ${p}`).join("\n")}`
        : "",
      databaseSchema ? `\nDatabase schema:\n${databaseSchema}` : "",
    ].join("");

    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompts.backendApi(options) },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
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
      const msg = err instanceof Error ? err.message : "BackendAgent error";
      return { code: null, raw: "", error: msg };
    }
  }
}
