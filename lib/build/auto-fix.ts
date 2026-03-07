import OpenAI from "openai";
import type { ParsedBuildError } from "./error-parser";

export interface AutoFixResult {
  file: string;
  originalContent: string;
  fixedContent: string;
  appliedFixes: string[];
  success: boolean;
  noChange: boolean;
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
- Replace any axios imports/calls with native fetch API — axios is not available

Return ONLY the complete fixed file content — no explanations, no markdown fences.`;

const AUTO_FIX_PROMPT_BROAD = `You are an expert TypeScript/React developer performing an aggressive full-file rewrite.

Rewrite this entire file from scratch to be valid, production-ready TypeScript/React.
Fix ALL listed errors and proactively eliminate any other potential issues.

Rules you MUST follow:
- NEVER use axios for HTTP requests — replace all axios imports/calls with native fetch API with async/await
- Remove any imports of packages that may not be installed — use only built-in browser/Node APIs and common React/Next.js APIs
- Replace all patterns that could cause TypeScript or ESLint errors
- Add missing type annotations (never use 'any' — infer proper types)
- Fix React hook dependency arrays
- Add explicit return types to exported functions
- Remove unused variables (prefix with _ if needed)
- Add proper null checks and error handling

Return ONLY the complete rewritten file content — no explanations, no markdown fences.`;

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

  const changed = fixedContent !== fileContent;
  return {
    file: filePath,
    originalContent: fileContent,
    fixedContent,
    appliedFixes: errors.map(e => `Fixed: ${e.message}${e.line ? ` (line ${e.line})` : ""}`),
    success: changed,
    noChange: !changed,
  };
}

export async function autoFixFileBroad(
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
      { role: "system", content: AUTO_FIX_PROMPT_BROAD },
      {
        role: "user",
        content: `File: ${filePath}\n\nErrors:\n${errorList}\n\nOriginal code:\n\`\`\`\n${fileContent}\n\`\`\`${contextSection}`,
      },
    ],
    temperature: 0.2,
    max_tokens: 8192,
  });

  const raw = response.choices[0]?.message?.content ?? fileContent;
  const fixedContent = raw
    .replace(/^```(?:typescript|tsx|ts|javascript|jsx|js)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  const changed = fixedContent !== fileContent;
  return {
    file: filePath,
    originalContent: fileContent,
    fixedContent,
    appliedFixes: errors.map(e => `Broad-fixed: ${e.message}${e.line ? ` (line ${e.line})` : ""}`),
    success: changed,
    noChange: !changed,
  };
}

export async function autoFixFiles(
  filesWithErrors: { path: string; content: string; errors: ParsedBuildError[] }[],
  model = "gpt-4o",
  options?: { broad?: boolean }
): Promise<AutoFixResult[]> {
  const fixFn = options?.broad ? autoFixFileBroad : autoFixFile;
  return Promise.all(
    filesWithErrors.map(f => fixFn(f.path, f.content, f.errors, undefined, model))
  );
}
