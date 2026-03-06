// agents/code-fixer.ts — Auto-fix TypeScript/ESLint errors in generated code

import OpenAI from "openai";

export interface FixRequest {
  file: string;
  content: string;
  issues: Array<{ line?: number; message: string; rule?: string }>;
  /** Optional: summary of other files in the project for cross-file context. */
  projectContext?: string;
  /** When true, perform an aggressive full-file rewrite instead of targeted fixes. */
  broadFix?: boolean;
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
- Replace any axios imports/calls with native fetch — axios is NOT installed

Respond ONLY with the fixed file content — no explanations, no markdown fences, just the raw code.`;

const CODE_FIXER_BROAD_SYSTEM_PROMPT = `You are an expert TypeScript/React developer performing an aggressive full-file rewrite.
Rewrite the entire file from scratch to be valid, production-ready TypeScript/React.
Fix ALL listed issues and proactively eliminate any other potential problems.

Rules you MUST follow:
- NEVER use axios for HTTP requests — replace all axios imports/calls with native fetch API with async/await
- Remove any imports of packages that may not be installed — use only built-in browser/Node APIs and common React/Next.js APIs
- Replace all patterns that could cause TypeScript or ESLint errors
- Add missing type annotations (never use 'any' — infer proper types)
- Fix React hook dependency arrays
- Add explicit return types to exported functions
- Remove unused variables (prefix with _ if needed)
- Add proper null checks and error handling

Respond ONLY with the complete rewritten file content — no explanations, no markdown fences, just the raw code.`;

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function fixFile(request: FixRequest): Promise<FixResult> {
  const issueList = request.issues
    .map((i) => `- Line ${i.line ?? "?"}: [${i.rule ?? "rule"}] ${i.message}`)
    .join("\n");

  const contextSection = request.projectContext
    ? `\n\nProject context (other files, truncated):\n${request.projectContext}`
    : "";

  const systemPrompt = request.broadFix
    ? CODE_FIXER_BROAD_SYSTEM_PROMPT
    : CODE_FIXER_SYSTEM_PROMPT;

  const completion = await getClient().chat.completions.create({
    model: "gpt-4o",
    // Slightly higher temperature for broad rewrites encourages more creative solutions
    // when the targeted approach (temperature 0.1) produced no change
    temperature: request.broadFix ? 0.2 : 0.1,
    max_tokens: 4096,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `File: ${request.file}\n\nIssues to fix:\n${issueList}\n\nOriginal code:\n${request.content}${contextSection}`,
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
