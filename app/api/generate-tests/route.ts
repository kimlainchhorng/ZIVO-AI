import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface TestFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateTestsRequest {
  framework?: "jest" | "vitest" | "playwright" | "cypress" | "all";
  description?: string;
  sourceFiles?: Array<{ path: string; content: string }>;
}

export interface GenerateTestsResponse {
  files: TestFile[];
  summary: string;
  coverageConfig: string;
}

const TESTS_SYSTEM_PROMPT = `You are ZIVO AI — an expert in software testing and quality assurance.

Generate comprehensive test suites for a Next.js App Router project.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "coverageConfig": "Coverage configuration summary"
}

Always include:
- jest.config.ts — Jest configuration with coverage settings
- __tests__/ — Unit tests for utility functions (Jest + TypeScript)
- __tests__/components/ — React Testing Library component tests
- e2e/ — Playwright E2E tests for critical user flows
- __tests__/api/ — API route tests with mocked fetch
- playwright.config.ts — Playwright configuration

Follow testing best practices: AAA pattern, descriptive test names, proper mocking.
Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      framework = "all",
      description = "Next.js full-stack application",
      sourceFiles = [],
    }: GenerateTestsRequest = body;

    const sourceContext =
      sourceFiles.length > 0
        ? `\n\nSource files to test:\n${sourceFiles
            .map((f) => `// ${f.path}\n${f.content.slice(0, 500)}`)
            .join("\n\n")}`
        : "";

    const userPrompt = `Generate a comprehensive test suite for: "${description}"
Test framework(s): ${framework}${sourceContext}

Generate:
1. jest.config.ts — Jest configuration with TypeScript and coverage
2. Unit tests for utility functions (__tests__/utils/)
3. React Testing Library component tests (__tests__/components/)
4. API route tests with mocked fetch (__tests__/api/)
5. Playwright E2E tests (e2e/auth.spec.ts, e2e/navigation.spec.ts)
6. playwright.config.ts — Playwright configuration`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: TESTS_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateTestsResponse;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json(
          { error: "AI did not return valid JSON" },
          { status: 502 }
        );
      }
      parsed = JSON.parse(match[0]);
    }

    if (!Array.isArray(parsed.files)) {
      return NextResponse.json(
        { error: "Invalid response structure: missing files array" },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
