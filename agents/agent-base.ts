import OpenAI from "openai";
import type { AgentMessage, AgentType, FileOutput } from "../lib/types";

export interface AgentConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export abstract class BaseAgentV2 {
  protected type: AgentType;
  protected systemPrompt: string;
  protected config: AgentConfig;

  constructor(
    type: AgentType,
    systemPrompt: string,
    config: AgentConfig = {}
  ) {
    this.type = type;
    this.systemPrompt = systemPrompt;
    this.config = { model: "gpt-4.1-mini", temperature: 0.2, maxTokens: 4096, ...config };
  }

  protected getClient(): OpenAI {
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async run(prompt: string, context?: Record<string, unknown>): Promise<AgentMessage> {
    const contextStr = context ? `\n\nContext:\n${JSON.stringify(context, null, 2)}` : "";
    const client = this.getClient();

    const r = await client.responses.create({
      model: this.config.model ?? "gpt-4.1-mini",
      input: [
        { role: "system", content: this.systemPrompt },
        { role: "user", content: `${prompt}${contextStr}` },
      ],
    } as Parameters<typeof client.responses.create>[0]);

    const content = (r as { output_text?: string }).output_text ?? "";
    const files = this.parseFiles(content);

    return {
      agent: this.type,
      content,
      files,
    };
  }

  /** Parse ```file:path/to/file ... ``` blocks from the response */
  protected parseFiles(content: string): FileOutput[] {
    const files: FileOutput[] = [];
    const regex = /```(?:file:([^\n]+)|([a-z]+)\s*\/\/\s*([^\n]+))\n([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const path = match[1] ?? match[3];
      if (path) {
        files.push({
          path: path.trim(),
          content: match[4].trim(),
          action: "create",
          language: match[2] ?? this.detectLanguage(path.trim()),
        });
      }
    }
    return files;
  }

  protected detectLanguage(path: string): string {
    const ext = path.split(".").pop() ?? "";
    const map: Record<string, string> = {
      ts: "typescript", tsx: "typescript", js: "javascript",
      jsx: "javascript", css: "css", html: "html", json: "json",
      sql: "sql", md: "markdown", py: "python",
    };
    return map[ext] ?? "text";
  }
}
