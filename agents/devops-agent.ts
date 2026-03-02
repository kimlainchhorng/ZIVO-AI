// DevOps/Deployment Agent – Vercel/Docker deployment configuration,
// CI/CD pipeline setup, environment management, and monitoring configuration.

import OpenAI from "openai";
import { systemPrompts, SystemPromptOptions } from "@/lib/system-prompts";
import { parseAIOutput, CodeGenerationSchema } from "@/lib/structured-outputs";
import { storeMemory, updateProjectMemory, DeploymentRecord } from "@/lib/memory";

export interface DeploymentRequest {
  projectId: string;
  target: "vercel" | "docker" | "custom";
  appDescription: string;
  environmentVariables?: string[];
  options?: SystemPromptOptions;
}

export interface DeploymentResult {
  config: CodeGenerationSchema | null;
  raw: string;
  error?: string;
}

export class DevOpsAgent {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateConfig(request: DeploymentRequest): Promise<DeploymentResult> {
    const { projectId, target, appDescription, environmentVariables = [], options } = request;

    const userMessage = [
      `Generate deployment configuration for target: ${target}`,
      `\nApp: ${appDescription}`,
      environmentVariables.length > 0
        ? `\nEnvironment variables needed:\n${environmentVariables.map((v) => `- ${v}`).join("\n")}`
        : "",
    ].join("");

    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompts.devops(options) },
          { role: "user", content: userMessage },
        ],
        temperature: 0.2,
      });

      const raw = response.choices[0]?.message?.content ?? "";
      const { data, error } = parseAIOutput(raw);

      if (error || !data || data.type !== "code_generation") {
        return { config: null, raw, error: error ?? "Invalid deployment config output" };
      }

      const record: DeploymentRecord = {
        id: `${Date.now()}`,
        target,
        status: "pending",
        timestamp: new Date().toISOString(),
      };
      const pm = { deploymentHistory: [record] };
      updateProjectMemory(projectId, pm);
      storeMemory(projectId, "deployment", `Deployment config generated for ${target}`, { target });

      return { config: data as CodeGenerationSchema, raw };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "DevOpsAgent error";
      return { config: null, raw: "", error: msg };
    }
  }
}
