// Security Agent – security analysis, vulnerability detection, RLS review,
// CORS configuration, and security header recommendations.

import OpenAI from "openai";
import { systemPrompts, SystemPromptOptions } from "@/lib/system-prompts";
import { parseAIOutput, SecuritySchema } from "@/lib/structured-outputs";
import { storeMemory } from "@/lib/memory";

export interface SecurityAuditRequest {
  projectId: string;
  code: string;
  context?: string;
  options?: SystemPromptOptions;
}

export interface SecurityAuditResult {
  report: SecuritySchema | null;
  raw: string;
  error?: string;
}

export class SecurityAgent {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async audit(request: SecurityAuditRequest): Promise<SecurityAuditResult> {
    const { projectId, code, context, options } = request;

    const userMessage = [
      `Perform a security audit on the following code:`,
      context ? `\nContext: ${context}` : "",
      `\n\nCode:\n\`\`\`\n${code}\n\`\`\``,
    ].join("");

    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompts.security(options) },
          { role: "user", content: userMessage },
        ],
        temperature: 0.2,
      });

      const raw = response.choices[0]?.message?.content ?? "";
      const { data, error } = parseAIOutput(raw);

      if (error || !data || data.type !== "security") {
        return { report: null, raw, error: error ?? "Invalid security output" };
      }

      const report = data as SecuritySchema;
      storeMemory(projectId, "architecture_decision", `Security audit: ${report.riskLevel}`, {
        findingsCount: report.findings.length,
      });

      return { report, raw };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "SecurityAgent error";
      return { report: null, raw: "", error: msg };
    }
  }
}
