import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export type WorkflowStepType =
  | "Generate Code"
  | "Ask AI"
  | "Transform"
  | "Summarize"
  | "Scrape URL"
  | "Deploy"
  | "Security Scan"
  | "Test Generation"
  | "API Mock"
  | "Database Schema"
  | "CI/CD Pipeline"
  | "Performance Audit";

export interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  input: string;
}

export interface WorkflowStepResult {
  id: string;
  type: WorkflowStepType;
  input: string;
  output: string;
  status: "done" | "error";
  error?: string;
}

async function runStep(step: WorkflowStep, previousOutput: string): Promise<WorkflowStepResult> {
  const contextNote = previousOutput
    ? `\n\nPrevious step output:\n${previousOutput.slice(0, 2000)}`
    : "";

  try {
    if (step.type === "Scrape URL") {
      // We cannot fetch external URLs server-side without issues; return placeholder
      return {
        id: step.id,
        type: step.type,
        input: step.input,
        output: `[URL scraping is not available in this environment. URL: ${step.input}]`,
        status: "done",
      };
    }

    if (step.type === "Deploy") {
      return {
        id: step.id,
        type: step.type,
        input: step.input,
        output: `[Deploy step: ${step.input || "No deployment target specified"}]`,
        status: "done",
      };
    }

    const systemPrompts: Record<string, string> = {
      "Generate Code": "You are ZIVO AI — an expert full-stack developer. Generate complete, working code based on the user's request.",
      "Ask AI": "You are ZIVO AI — a helpful assistant. Answer the user's question clearly and concisely.",
      "Transform": "You are ZIVO AI — a code transformation expert. Transform or refactor the provided code/content as requested.",
      "Summarize": "You are ZIVO AI — a summarization expert. Summarize the provided content clearly and concisely.",
      "Security Scan": `You are ZIVO AI — a world-class application security expert.
Analyze the provided code or description for security vulnerabilities.
Identify: injection flaws, XSS, CSRF, exposed secrets, auth issues, insecure dependencies, path traversal, and other OWASP Top 10 issues.
For each vulnerability found, provide: severity level, description, affected line/area, and specific remediation steps.
Format your response as a structured security report with severity-categorized findings.`,
      "Test Generation": `You are ZIVO AI — an expert in software testing (Vitest/Jest/Playwright).
Generate comprehensive unit and integration tests for the provided code.
Use Vitest by default. Include:
- Describe/it blocks with descriptive names
- Mock setup using vi.mock() for external dependencies
- Edge cases and error scenarios
- TypeScript types for test utilities
Output complete, runnable test files.`,
      "API Mock": `You are ZIVO AI — an expert in API mocking and testing infrastructure.
Generate a mock API server from the provided OpenAPI spec or description.
Output MSW (Mock Service Worker) handler files for browser + Node environments:
- handlers.ts — MSW request handlers
- browser.ts — Browser MSW setup
- server.ts — Node MSW setup for tests
Also include a json-server db.json if a simple REST mock is appropriate.`,
      "Database Schema": `You are ZIVO AI — an expert in database design and Prisma ORM.
Generate a complete Prisma schema + initial migration from the provided description.
Include:
- schema.prisma with all models, relations, and indexes
- seed.ts — Prisma seed file with realistic sample data
- Migration SQL (as a comment block)
- Repository pattern files (lib/db/[model].ts) with type-safe CRUD helpers
Follow Prisma best practices: use cuid() for IDs, proper relation naming, cascade deletes.`,
      "CI/CD Pipeline": `You are ZIVO AI — a DevOps and GitHub Actions expert.
Generate a complete GitHub Actions CI/CD workflow YAML for the provided project type.
Include:
- .github/workflows/ci.yml — lint, typecheck, test, build jobs
- .github/workflows/deploy.yml — deploy to Vercel/Railway on push to main
- Branch protection rules as comments
- Cache strategies for node_modules and build artifacts
- Environment variable configuration`,
      "Performance Audit": `You are ZIVO AI — a web performance and optimization expert.
Analyze the provided code for performance issues. Check for:
- N+1 database query patterns
- Missing database indexes
- Large bundle imports (suggest tree-shaking or lazy loading)
- Blocking renders and missing React.memo/useMemo/useCallback
- Missing Suspense boundaries and loading states
- Unoptimized images (missing next/image, no width/height)
- Memory leaks (missing cleanup in useEffect)
Format as a structured report with severity (Critical/High/Medium/Low) and specific fix suggestions.`,
    };

    const systemPrompt = systemPrompts[step.type] ?? "You are ZIVO AI — a helpful assistant.";
    const userContent = step.input + contextNote;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 2000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    });

    const output = response.choices?.[0]?.message?.content ?? "";
    return { id: step.id, type: step.type, input: step.input, output, status: "done" };
  } catch (err: unknown) {
    return {
      id: step.id,
      type: step.type,
      input: step.input,
      output: "",
      status: "error",
      error: (err as Error)?.message ?? "Step failed",
    };
  }
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const steps: WorkflowStep[] = Array.isArray(body?.steps) ? body.steps : [];
    const parallel: boolean = Boolean(body?.parallel);

    if (steps.length === 0) {
      return NextResponse.json({ error: "No steps provided" }, { status: 400 });
    }

    let results: WorkflowStepResult[];

    if (parallel) {
      // Execute all steps simultaneously — each step gets no prior context
      results = await Promise.all(steps.map((step) => runStep(step, "")));
    } else {
      // Sequential execution — each step receives the previous step's output
      results = [];
      let previousOutput = "";
      for (const step of steps) {
        const result = await runStep(step, previousOutput);
        results.push(result);
        if (result.status === "done") {
          previousOutput = result.output;
        }
      }
    }

    return NextResponse.json({ results });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
