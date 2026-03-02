// Code Review Agent – code quality checks, TypeScript type safety,
// best practices validation, and refactoring suggestions.

import OpenAI from "openai";
import { systemPrompts, SystemPromptOptions } from "@/lib/system-prompts";
import { parseAIOutput, RefactoringSchema } from "@/lib/structured-outputs";

export interface CodeReviewRequest {
  projectId: string;
  code: string;
  filePath?: string;
  context?: string;
  options?: SystemPromptOptions;
}

export interface CodeReviewResult {
  review: RefactoringSchema | null;
  raw: string;
  error?: string;
}

export class CodeReviewAgent {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async review(request: CodeReviewRequest): Promise<CodeReviewResult> {
    const { code, filePath, context, options } = request;

    const userMessage = [
      `Review the following code:`,
      filePath ? `\nFile: ${filePath}` : "",
      context ? `\nContext: ${context}` : "",
      `\n\nCode:\n\`\`\`\n${code}\n\`\`\``,
    ].join("");

    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompts.codeReview(options) },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
      });

      const raw = response.choices[0]?.message?.content ?? "";
      const { data, error } = parseAIOutput(raw);

      if (error || !data || data.type !== "refactoring") {
        return { review: null, raw, error: error ?? "Invalid code review output" };
      }

      return { review: data as RefactoringSchema, raw };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "CodeReviewAgent error";
      return { review: null, raw: "", error: msg };
    }
  }
}
