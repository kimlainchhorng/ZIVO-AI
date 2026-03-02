// Debug Agent – error parsing and root-cause analysis,
// stack-trace interpretation, solution suggestions, and code fixes.

import OpenAI from "openai";
import { systemPrompts, SystemPromptOptions } from "@/lib/system-prompts";
import { parseAIOutput, ErrorSchema } from "@/lib/structured-outputs";
import { storeMemory } from "@/lib/memory";

export interface DebugRequest {
  projectId: string;
  error: string;
  code?: string;
  stackTrace?: string;
  options?: SystemPromptOptions;
}

export interface DebugResult {
  analysis: ErrorSchema | null;
  raw: string;
  error?: string;
}

export class DebugAgent {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async debug(request: DebugRequest): Promise<DebugResult> {
    const { projectId, error, code, stackTrace, options } = request;

    const userMessage = [
      `Debug the following error:`,
      `\nError: ${error}`,
      stackTrace ? `\nStack trace:\n${stackTrace}` : "",
      code ? `\n\nRelevant code:\n\`\`\`\n${code}\n\`\`\`` : "",
    ].join("");

    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompts.debug(options) },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
      });

      const raw = response.choices[0]?.message?.content ?? "";
      const { data, parseError } = (() => {
        const result = parseAIOutput(raw);
        return { data: result.data, parseError: result.error };
      })();

      if (parseError || !data || data.type !== "error_analysis") {
        return { analysis: null, raw, error: parseError ?? "Invalid debug output" };
      }

      storeMemory(projectId, "error_history", error, { rootCause: (data as ErrorSchema).rootCause });

      return { analysis: data as ErrorSchema, raw };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "DebugAgent error";
      return { analysis: null, raw: "", error: msg };
    }
  }
}
