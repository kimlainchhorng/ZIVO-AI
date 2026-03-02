import OpenAI from "openai";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const framework = searchParams.get("framework") || "jest";

  const frameworks = {
    jest: { name: "Jest", type: "unit", config: "jest.config.ts" },
    cypress: { name: "Cypress", type: "e2e", config: "cypress.config.ts" },
    playwright: { name: "Playwright", type: "e2e", config: "playwright.config.ts" },
    k6: { name: "k6", type: "load", config: "k6.config.js" },
    vitest: { name: "Vitest", type: "unit", config: "vitest.config.ts" },
  };

  const stats = {
    totalTests: 1847,
    passRate: 98.7,
    coverage: 94.2,
    avgRunTime: 192,
    lastRun: new Date().toISOString(),
  };

  return NextResponse.json({ ok: true, framework: frameworks[framework as keyof typeof frameworks] || frameworks.jest, stats });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, sourceCode, framework, testType } = body;

    if (!action) {
      return NextResponse.json({ error: "Action required" }, { status: 400 });
    }

    if (action === "generate-tests") {
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
      }
      if (!sourceCode) {
        return NextResponse.json({ error: "Source code required" }, { status: 400 });
      }

      const fw = framework || "jest";
      const tt = testType || "unit";

      const r = await getClient().responses.create({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: `You are a testing expert. Generate comprehensive ${tt} tests using ${fw}. Return ONLY the test code.`,
          },
          {
            role: "user",
            content: `Generate ${tt} tests for this code:\n\n${sourceCode}`,
          },
        ],
      });

      const tests = (r as any).output_text ?? "";
      return NextResponse.json({
        ok: true,
        action,
        tests: {
          id: `test-${Date.now()}`,
          framework: fw,
          type: tt,
          code: tests,
          generatedAt: new Date().toISOString(),
        },
      });
    }

    if (action === "generate-mock-data") {
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
      }

      const schema = body.schema || "user object";
      const r = await getClient().responses.create({
        model: "gpt-4.1-mini",
        input: `Generate realistic mock data factory using Faker.js for: ${schema}. Return ONLY JavaScript/TypeScript code.`,
      });

      const code = (r as any).output_text ?? "";
      return NextResponse.json({ ok: true, action, mockData: { code, schema } });
    }

    return NextResponse.json({ ok: true, action, result: `${action} completed` });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Testing action failed" }, { status: 500 });
  }
}
