// lib/test-runner.ts — Test generation utilities

import OpenAI from "openai";

export interface GeneratedFile {
  path: string;
  content: string;
  action?: "create" | "update" | "delete";
  language?: string;
}

export interface TestCoverage {
  estimated: number;
}

export interface TestRunResult {
  tests: GeneratedFile[];
  summary: string;
  coverage: TestCoverage;
}

const TEST_GENERATOR_PROMPT = `You are an expert test engineer. Given source files, generate comprehensive unit tests.
Rules:
- Use the specified test framework (vitest or jest — default vitest)
- Generate tests for all exported functions and components
- Include edge cases and error scenarios
- For React components use @testing-library/react
- For pure functions test all branches
- Name test files as <source>.test.ts or <source>.test.tsx
- Respond with a JSON array: [{"path":"...","content":"..."}]`;

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Generates unit tests for the provided files using GPT-4o.
 * If test files already exist in the input, they are returned as-is.
 */
export async function generateTests(
  files: GeneratedFile[],
  framework: "vitest" | "jest" = "vitest"
): Promise<TestRunResult> {
  // Check if tests already exist
  const existingTests = files.filter((f) => /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(f.path));
  if (existingTests.length > 0) {
    return {
      tests: existingTests,
      summary: `Found ${existingTests.length} existing test file(s).`,
      coverage: { estimated: 60 },
    };
  }

  const sourceFiles = files.filter(
    (f) =>
      /\.(ts|tsx|js|jsx)$/.test(f.path) &&
      !/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(f.path)
  );

  if (sourceFiles.length === 0) {
    return { tests: [], summary: "No source files to generate tests for.", coverage: { estimated: 0 } };
  }

  const filesSummary = sourceFiles
    .slice(0, 10) // limit to avoid token overflow
    .map((f) => `// File: ${f.path}\n${f.content.slice(0, 800)}`)
    .join("\n\n---\n\n");

  const completion = await getClient().chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    max_tokens: 4096,
    messages: [
      { role: "system", content: TEST_GENERATOR_PROMPT },
      {
        role: "user",
        content: `Framework: ${framework}\n\nSource files:\n${filesSummary}\n\nGenerate unit tests. Respond ONLY with a JSON array.`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "[]";
  let tests: GeneratedFile[] = [];

  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(cleaned) as Array<{ path: string; content: string }>;
    tests = parsed.map((t) => ({ path: t.path, content: t.content, action: "create" as const }));
  } catch {
    tests = [];
  }

  const estimated = Math.min(80, tests.length * 15 + 20);
  const summary = `Generated ${tests.length} test file(s) using ${framework}.`;

  return { tests, summary, coverage: { estimated } };
}
