// ZIVO AI – Code Generator Agent
// Generates complete files (Bolt-style) rather than snippets

import OpenAI from "openai";
import type { FileOutput, GenerateFilesRequest, GenerateFilesResponse } from "../lib/types";

export class CodeGenerator {
  /** Simple template interpolation */
  static generateCode(template: string, data: Record<string, unknown>): string {
    let code = template;
    for (const key in data) {
      const placeholder = `{{${key}}}`;
      code = code.replace(new RegExp(placeholder, "g"), String(data[key]));
    }
    return code;
  }

  /** Parse AI output that may contain fenced code blocks with file paths */
  static parseFileBlocks(raw: string): FileOutput[] {
    const files: FileOutput[] = [];

    // Match ```<lang> filepath\n...code...``` blocks
    const blockRegex = /```(?:\w+)?\s+([\w./\-]+)\n([\s\S]*?)```/g;
    let match: RegExpExecArray | null;

    while ((match = blockRegex.exec(raw)) !== null) {
      const path = match[1].trim();
      const content = match[2].trim();
      if (path && content) {
        files.push({ path, content, action: "create" });
      }
    }

    return files;
  }
}

export class CodeGeneratorAgent {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model = "gpt-4.1-mini") {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generateFiles(
    req: GenerateFilesRequest
  ): Promise<GenerateFilesResponse> {
    const techContext = req.context?.tech_stack?.join(", ") ?? "Next.js, TypeScript, Tailwind CSS";
    const existingFiles = req.context?.existing_files?.join("\n") ?? "none";

    const systemPrompt = `You are a production-grade code generator for ZIVO AI.
Tech stack: ${techContext}
Existing files:
${existingFiles}

Rules:
- Return COMPLETE files, never snippets
- Use fenced code blocks with the file path on the first line: \`\`\`tsx path/to/file.tsx
- Include ALL imports
- Follow TypeScript strict mode
- Use Tailwind CSS for styling
- Make components accessible (ARIA attributes)
- After all files, add a JSON block for metadata: \`\`\`json __meta__
{ "deletions": [], "renames": [], "dependencies": [], "action_items": [] }
\`\`\``;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: req.prompt },
      ],
      max_tokens: 4096,
    });

    const raw = response.choices[0]?.message?.content ?? "";
    const files = CodeGenerator.parseFileBlocks(raw);

    // Extract metadata block
    const metaMatch = raw.match(/```json\s+__meta__\n([\s\S]*?)```/);
    let meta: Partial<GenerateFilesResponse> = {};
    if (metaMatch) {
      try {
        meta = JSON.parse(metaMatch[1]);
      } catch {
        // ignore parse errors
      }
    }

    return {
      files,
      deletions: meta.deletions ?? [],
      renames: meta.renames ?? [],
      dependencies: meta.dependencies ?? [],
      action_items: meta.action_items ?? [],
    };
  }
}

export default CodeGeneratorAgent;
