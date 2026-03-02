// UI/Frontend Agent – React component generation, Tailwind layouts,
// accessibility, responsive design, and design system consistency.

import OpenAI from "openai";
import { systemPrompts, SystemPromptOptions } from "@/lib/system-prompts";
import { parseAIOutput, CodeGenerationSchema } from "@/lib/structured-outputs";
import { storeMemory } from "@/lib/memory";

export interface UIGenerateRequest {
  projectId: string;
  description: string;
  componentName?: string;
  existingFiles?: string[];
  options?: SystemPromptOptions;
}

export interface UIGenerateResult {
  code: CodeGenerationSchema | null;
  raw: string;
  error?: string;
}

export class UIAgent {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generate(request: UIGenerateRequest): Promise<UIGenerateResult> {
    const { projectId, description, componentName, existingFiles = [], options } = request;

    const userMessage = [
      `Generate a React/TypeScript UI component:`,
      `\nDescription: ${description}`,
      componentName ? `\nComponent name: ${componentName}` : "",
      existingFiles.length > 0
        ? `\nExisting files to consider:\n${existingFiles.map((f) => `- ${f}`).join("\n")}`
        : "",
    ].join("");

    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompts.uiFrontend(options) },
          { role: "user", content: userMessage },
        ],
        temperature: 0.4,
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
      const msg = err instanceof Error ? err.message : "UIAgent error";
      return { code: null, raw: "", error: msg };
    }
  }
}
