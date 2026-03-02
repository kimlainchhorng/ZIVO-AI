// Architect Agent – system design, API architecture, database schema design,
// technology stack decisions, and scalability planning.

import OpenAI from "openai";
import { systemPrompts, SystemPromptOptions } from "@/lib/system-prompts";
import { parseAIOutput, ArchitectureSchema } from "@/lib/structured-outputs";
import { storeMemory } from "@/lib/memory";

export interface ArchitectRequest {
  projectId: string;
  description: string;
  requirements?: string[];
  options?: SystemPromptOptions;
}

export interface ArchitectResult {
  architecture: ArchitectureSchema | null;
  raw: string;
  error?: string;
}

export class ArchitectAgent {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async plan(request: ArchitectRequest): Promise<ArchitectResult> {
    const { projectId, description, requirements = [], options } = request;

    const userMessage = [
      `Design the system architecture for the following project:`,
      `\nDescription: ${description}`,
      requirements.length > 0 ? `\nRequirements:\n${requirements.map((r) => `- ${r}`).join("\n")}` : "",
    ].join("");

    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompts.architect(options) },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
      });

      const raw = response.choices[0]?.message?.content ?? "";
      const { data, error } = parseAIOutput(raw);

      if (error || !data || data.type !== "architecture") {
        return { architecture: null, raw, error: error ?? "Invalid architecture output" };
      }

      // Store architecture decision in project memory
      storeMemory(projectId, "architecture_decision", JSON.stringify(data), {
        description,
      });

      return { architecture: data as ArchitectureSchema, raw };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "ArchitectAgent error";
      return { architecture: null, raw: "", error: msg };
    }
  }
}
