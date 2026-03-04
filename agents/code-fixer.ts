// agents/code-fixer.ts — Auto-fix TypeScript/ESLint errors in generated code

import OpenAI from "openai";

export interface FixRequest {
  file: string;
  content: string;
  issues: Array<{ line?: number; message: string; rule?: string }>;
}

export interface FixResult {
  file: string;
  fixedContent: string;
  appliedFixes: string[];
}

const CODE_FIXER_SYSTEM_PROMPT = `You are an expert TypeScript/ESLint auto-fixer.
Given a TypeScript file and a list of issues, fix ALL of them.
Common fixes you must apply:
- Add missing type annotations (replace implicit any with proper types)
- Add missing import statements
- Fix React hook dependency arrays
- Fix async/await patterns
- Remove unused variables (prefix with _ if needed)
- Add missing return type annotations on exported functions
- Remove or replace console.log in production code

Respond ONLY with the fixed file content — no explanations, no markdown fences, just the raw code.`;

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function fixFile(request: FixRequest): Promise<FixResult> {
  const issueList = request.issues
    .map((i) => `- Line ${i.line ?? "?"}: [${i.rule ?? "rule"}] ${i.message}`)
    .join("\n");

  const completion = await getClient().chat.completions.create({
    model: "gpt-4o",
    temperature: 0.1,
    max_tokens: 4096,
    messages: [
      { role: "system", content: CODE_FIXER_SYSTEM_PROMPT },
      {
        role: "user",
        content: `File: ${request.file}\n\nIssues to fix:\n${issueList}\n\nOriginal code:\n${request.content}`,
      },
    ],
  });

  const fixedContent = (completion.choices[0]?.message?.content ?? request.content)
    .replace(/^```(?:typescript|tsx|ts)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  const appliedFixes = request.issues.map(
    (i) => `Fixed: ${i.message}${i.line ? ` (line ${i.line})` : ""}`
  );

  return { file: request.file, fixedContent, appliedFixes };
}

export async function fixFiles(requests: FixRequest[]): Promise<FixResult[]> {
  return Promise.all(requests.map(fixFile));
}
