// agents/orchestrator-v2.ts — Autonomous full-stack builder: plan → generate → validate → fix → iterate

import OpenAI from "openai";
import { validateFiles, type ValidationResult } from "./validator";
import { fixFiles } from "./code-fixer";

export interface AgentV2File {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface AgentV2Step {
  step: string;
  status: "pending" | "running" | "done" | "error";
  detail?: string;
}

export interface AgentV2Result {
  files: AgentV2File[];
  steps: AgentV2Step[];
  validation: ValidationResult;
  summary: string;
  iterations: number;
}

const ORCHESTRATOR_SYSTEM_PROMPT = `You are ZIVO Agent v2 — an autonomous full-stack engineer with a self-correcting build loop.

For every task you:
1. PLAN — break into numbered sub-tasks
2. RESEARCH — identify best libraries/patterns
3. GENERATE — create all necessary files with TypeScript strict mode
4. Respond with valid JSON only

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path.ts", "content": "...", "action": "create" | "update" | "delete" }
  ],
  "plan": ["1. ...", "2. ...", "3. ..."],
  "summary": "Brief summary"
}

Rules:
- Use strict TypeScript — no implicit any, explicit return types on all exports
- No console.log in production code
- All React hooks must have complete dependency arrays
- All imports must be present
- Return ONLY valid JSON, no markdown fences.`;

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/** Max chars to include per-file when summarising existing files as generation context. */
const EXISTING_FILES_TRUNCATE_LENGTH = 400;

/** Max chars to include per-file when building project context passed to the code fixer. */
const FIX_CONTEXT_TRUNCATE_LENGTH = 200;

/**
 * Summarise existing files to provide context for generation/fixing without
 * sending the full content (which may exceed token limits).
 */
function buildExistingFilesContext(existingFiles: AgentV2File[]): string {
  if (existingFiles.length === 0) return "";
  const summaries = existingFiles
    .map((f) => `// ${f.path}\n${f.content.slice(0, EXISTING_FILES_TRUNCATE_LENGTH)}${f.content.length > EXISTING_FILES_TRUNCATE_LENGTH ? "\n// ... (truncated)" : ""}`)
    .join("\n\n");
  return `\n\nExisting project files (${existingFiles.length} total):\n${summaries}`;
}

export async function runOrchestratorV2(
  prompt: string,
  existingFiles: AgentV2File[] = [],
  maxIterations = 10,
  projectContext?: string
): Promise<AgentV2Result> {
  const steps: AgentV2Step[] = [];
  let files: AgentV2File[] = [];
  let validation: ValidationResult = { valid: false, issues: [], summary: "" };
  let iterations = 0;

  const addStep = (step: string, status: AgentV2Step["status"], detail?: string): void => {
    steps.push({ step, status, detail });
  };

  // Step 1: Plan + Generate
  addStep("Planning and generating code…", "running");
  const existingContext = buildExistingFilesContext(existingFiles);
  const systemPrompt = projectContext
    ? `${ORCHESTRATOR_SYSTEM_PROMPT}\n\nProject Context:\n${projectContext}`
    : ORCHESTRATOR_SYSTEM_PROMPT;

  const response = await getClient().chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    max_tokens: 8192,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `${prompt}${existingContext}` },
    ],
  });

  const rawText = response.choices?.[0]?.message?.content ?? "";
  let parsed: { files: AgentV2File[]; plan: string[]; summary: string };

  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
  } catch {
    addStep("Planning and generating code…", "error", "Failed to parse AI response");
    return { files: [], steps, validation: { valid: false, issues: [], summary: "Parse error" }, summary: "Generation failed", iterations: 0 };
  }

  files = parsed.files ?? [];
  addStep("Planning and generating code…", "done", parsed.plan?.join("; "));

  // Step 2: Ensure package.json exists for Node/Next.js projects
  const hasPackageJson = files.some((f) => f.path === "package.json" || f.path.endsWith("/package.json"));
  const hasTsOrJsFiles = files.some((f) => f.path.match(/\.(ts|tsx|js|jsx)$/));
  if (!hasPackageJson && hasTsOrJsFiles) {
    addStep("Generating missing package.json…", "running");
    const pkgResponse = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1,
      max_tokens: 1024,
      messages: [
        { role: "system", content: "You are a package.json generator. Return ONLY a valid JSON object for package.json, no markdown." },
        {
          role: "user",
          content: `Generate a package.json for a Next.js 15 project based on these files:\n${files.map((f) => f.path).join("\n")}`,
        },
      ],
    });
    const pkgContent = (pkgResponse.choices?.[0]?.message?.content ?? "{}").replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    files.push({ path: "package.json", content: pkgContent, action: "create" });
    addStep("Generating missing package.json…", "done");
  }

  // Step 3: Validate → Fix loop
  for (let i = 0; i < maxIterations; i++) {
    iterations++;
    addStep(`Validation pass ${i + 1}…`, "running");
    validation = validateFiles(files);

    if (validation.valid) {
      addStep(`Validation pass ${i + 1}…`, "done", validation.summary);
      break;
    }

    const errorIssues = validation.issues.filter((iss) => iss.type === "error");
    if (errorIssues.length === 0) {
      addStep(`Validation pass ${i + 1}…`, "done", validation.summary);
      break;
    }

    addStep(`Validation pass ${i + 1}…`, "error", validation.summary);

    if (i < maxIterations - 1) {
      addStep(`Auto-fixing ${errorIssues.length} error(s)…`, "running");

      // Group issues by file
      const byFile = new Map<string, typeof errorIssues>();
      for (const issue of errorIssues) {
        const list = byFile.get(issue.file) ?? [];
        list.push(issue);
        byFile.set(issue.file, list);
      }

      // Pass full project context to the fixer alongside individual file issues
      const projectContext = files
        .map((f) => `// ${f.path}\n${f.content.slice(0, FIX_CONTEXT_TRUNCATE_LENGTH)}`)
        .join("\n\n");

      const fixRequests = Array.from(byFile.entries()).map(([filePath, issues]) => {
        const fileObj = files.find((f) => f.path === filePath);
        return {
          file: filePath,
          content: fileObj?.content ?? "",
          issues,
          projectContext,
        };
      });

      const fixResults = await fixFiles(fixRequests);
      for (const fix of fixResults) {
        const idx = files.findIndex((f) => f.path === fix.file);
        if (idx >= 0) {
          files[idx] = { ...files[idx], content: fix.fixedContent };
        }
      }
      addStep(`Auto-fixing ${errorIssues.length} error(s)…`, "done", `Applied ${fixResults.flatMap((r) => r.appliedFixes).length} fixes`);
    }
  }

  return {
    files,
    steps,
    validation,
    summary: parsed.summary ?? "Generation complete",
    iterations,
  };
}

/**
 * Streaming version of runOrchestratorV2.
 * Yields step update objects as the build progresses so callers can display
 * real-time progress without waiting for the full result.
 */
export async function* runOrchestratorV2Streamed(
  prompt: string,
  existingFiles: AgentV2File[] = [],
  maxIterations = 10,
  projectContext?: string
): AsyncGenerator<AgentV2Step | { type: "result"; result: AgentV2Result } | { type: "progress"; percent: number }, void, unknown> {
  const steps: AgentV2Step[] = [];
  let files: AgentV2File[] = [];
  let validation: ValidationResult = { valid: false, issues: [], summary: "" };
  let iterations = 0;

  const emitStep = (step: string, status: AgentV2Step["status"], detail?: string): AgentV2Step => {
    const s: AgentV2Step = { step, status, detail };
    steps.push(s);
    return s;
  };

  yield emitStep("Planning and generating code…", "running");
  const existingContext = buildExistingFilesContext(existingFiles);
  const systemPrompt = projectContext
    ? `${ORCHESTRATOR_SYSTEM_PROMPT}\n\nProject Context:\n${projectContext}`
    : ORCHESTRATOR_SYSTEM_PROMPT;

  const response = await getClient().chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    max_tokens: 8192,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `${prompt}${existingContext}` },
    ],
  });

  const rawText = response.choices?.[0]?.message?.content ?? "";
  let parsed: { files: AgentV2File[]; plan: string[]; summary: string };

  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
  } catch {
    yield emitStep("Planning and generating code…", "error", "Failed to parse AI response");
    yield {
      type: "result",
      result: {
        files: [],
        steps,
        validation: { valid: false, issues: [], summary: "Parse error" },
        summary: "Generation failed",
        iterations: 0,
      },
    };
    return;
  }

  files = parsed.files ?? [];
  yield emitStep("Planning and generating code…", "done", parsed.plan?.join("; "));

  // Ensure package.json exists for TS/JS projects
  const hasPackageJson = files.some((f) => f.path === "package.json" || f.path.endsWith("/package.json"));
  const hasTsOrJsFiles = files.some((f) => f.path.match(/\.(ts|tsx|js|jsx)$/));
  if (!hasPackageJson && hasTsOrJsFiles) {
    yield emitStep("Generating missing package.json…", "running");
    const pkgResponse = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1,
      max_tokens: 1024,
      messages: [
        { role: "system", content: "You are a package.json generator. Return ONLY a valid JSON object for package.json, no markdown." },
        {
          role: "user",
          content: `Generate a package.json for a Next.js 15 project based on these files:\n${files.map((f) => f.path).join("\n")}`,
        },
      ],
    });
    const pkgContent = (pkgResponse.choices?.[0]?.message?.content ?? "{}").replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    files.push({ path: "package.json", content: pkgContent, action: "create" });
    yield emitStep("Generating missing package.json…", "done");
  }

  for (let i = 0; i < maxIterations; i++) {
    iterations++;
    yield emitStep(`Validation pass ${i + 1}…`, "running");
    // Emit progress: generation is at ~30%, each validation pass adds progress toward 95%
    yield { type: "progress", percent: Math.round(30 + (i / maxIterations) * 65) };
    validation = validateFiles(files);

    if (validation.valid) {
      yield emitStep(`Validation pass ${i + 1}…`, "done", validation.summary);
      yield { type: "progress", percent: 100 };
      break;
    }

    const errorIssues = validation.issues.filter((iss) => iss.type === "error");
    if (errorIssues.length === 0) {
      yield emitStep(`Validation pass ${i + 1}…`, "done", validation.summary);
      yield { type: "progress", percent: 100 };
      break;
    }

    yield emitStep(`Validation pass ${i + 1}…`, "error", validation.summary);

    if (i < maxIterations - 1) {
      yield emitStep(`Auto-fixing ${errorIssues.length} error(s)…`, "running");

      const byFile = new Map<string, typeof errorIssues>();
      for (const issue of errorIssues) {
        const list = byFile.get(issue.file) ?? [];
        list.push(issue);
        byFile.set(issue.file, list);
      }

      const fixContext = files
        .map((f) => `// ${f.path}\n${f.content.slice(0, FIX_CONTEXT_TRUNCATE_LENGTH)}`)
        .join("\n\n");

      const fixRequests = Array.from(byFile.entries()).map(([filePath, issues]) => {
        const fileObj = files.find((f) => f.path === filePath);
        return { file: filePath, content: fileObj?.content ?? "", issues, projectContext: fixContext };
      });

      const fixResults = await fixFiles(fixRequests);
      for (const fix of fixResults) {
        const idx = files.findIndex((f) => f.path === fix.file);
        if (idx >= 0) {
          files[idx] = { ...files[idx], content: fix.fixedContent };
        }
      }
      yield emitStep(
        `Auto-fixing ${errorIssues.length} error(s)…`,
        "done",
        `Applied ${fixResults.flatMap((r) => r.appliedFixes).length} fixes`
      );
    }
  }

  yield {
    type: "result",
    result: {
      files,
      steps,
      validation,
      summary: parsed.summary ?? "Generation complete",
      iterations,
    },
  };
}

