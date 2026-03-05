import OpenAI from "openai";
import type { ParsedBuildError } from "./error-parser";

export interface AutoFixResult {
  file: string;
  originalContent: string;
  fixedContent: string;
  appliedFixes: string[];
  success: boolean;
}

const AUTO_FIX_PROMPT = `You are an expert TypeScript/React auto-fixer.

Given a file with build errors, fix ALL errors listed.

Common fixes:
- Add missing type annotations (never use 'any' — infer proper types)
- Add missing import statements
- Fix React hook dependency arrays
- Add explicit return types to exported functions
- Remove unused variables (prefix with _ if needed)
- Fix incorrect prop types
- Fix missing semicolons or syntax errors
- Add proper null checks

Return ONLY the complete fixed file content — no explanations, no markdown fences.`;

export async function autoFixFile(
  filePath: string,
  fileContent: string,
  errors: ParsedBuildError[],
  projectContext?: string,
  model = "gpt-4o"
): Promise<AutoFixResult> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const errorList = errors
    .map(e => `- Line ${e.line ?? "?"}: [${e.rule ?? e.source}] ${e.message}`)
    .join("\n");

  const contextSection = projectContext
    ? `\n\nProject context:\n${projectContext}`
    : "";

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: AUTO_FIX_PROMPT },
      {
        role: "user",
        content: `File: ${filePath}\n\nErrors:\n${errorList}\n\nOriginal code:\n\`\`\`\n${fileContent}\n\`\`\`${contextSection}`,
      },
    ],
    temperature: 0.1,
    max_tokens: 8192,
  });

  const raw = response.choices[0]?.message?.content ?? fileContent;
  const fixedContent = raw
    .replace(/^```(?:typescript|tsx|ts|javascript|jsx|js)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  return {
    file: filePath,
    originalContent: fileContent,
    fixedContent,
    appliedFixes: errors.map(e => `Fixed: ${e.message}${e.line ? ` (line ${e.line})` : ""}`),
    success: fixedContent !== fileContent,
  };
}

export async function autoFixFiles(
  filesWithErrors: { path: string; content: string; errors: ParsedBuildError[] }[],
  model = "gpt-4o"
): Promise<AutoFixResult[]> {
  return Promise.all(
    filesWithErrors.map(f => autoFixFile(f.path, f.content, f.errors, undefined, model))
  );
}
