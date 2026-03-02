// Performance Optimizer Agent – code and query optimisation, bundle analysis,
// caching strategies, lazy loading, and API response optimisation.

import OpenAI from "openai";
import { systemPrompts, SystemPromptOptions } from "@/lib/system-prompts";
import { parseAIOutput, PerformanceSchema } from "@/lib/structured-outputs";

export interface PerformanceOptimizeRequest {
  projectId: string;
  code: string;
  context?: string;
  options?: SystemPromptOptions;
}

export interface PerformanceOptimizeResult {
  report: PerformanceSchema | null;
  raw: string;
  error?: string;
}

export class PerformanceAgent {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async optimize(request: PerformanceOptimizeRequest): Promise<PerformanceOptimizeResult> {
    const { code, context, options } = request;

    const userMessage = [
      `Analyse the following code for performance issues:`,
      context ? `\nContext: ${context}` : "",
      `\n\nCode:\n\`\`\`\n${code}\n\`\`\``,
    ].join("");

    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompts.performance(options) },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
      });

      const raw = response.choices[0]?.message?.content ?? "";
      const { data, error } = parseAIOutput(raw);

      if (error || !data || data.type !== "performance") {
        return { report: null, raw, error: error ?? "Invalid performance output" };
      }

      return { report: data as PerformanceSchema, raw };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "PerformanceAgent error";
      return { report: null, raw: "", error: msg };
    }
  }
}
