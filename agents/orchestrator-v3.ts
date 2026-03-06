// agents/orchestrator-v3.ts — Auto Fix Build Loop: Generate → Validate → Fix → Rebuild (up to 8 iterations)

import OpenAI from "openai";
import { validateFiles, type ValidationResult } from "./validator";
import { fixFiles } from "./code-fixer";

export interface AgentV3File {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface AgentV3Step {
  step: string;
  status: "pending" | "running" | "done" | "error";
  detail?: string;
}

export interface FixHistoryEntry {
  iteration: number;
  errorsFound: number;
  errorsFixed: number;
}

export interface AgentV3Result {
  files: AgentV3File[];
  steps: AgentV3Step[];
  validation: ValidationResult;
  summary: string;
  iterations: number;
  fixHistory: FixHistoryEntry[];
}

const ORCHESTRATOR_V3_SYSTEM_PROMPT = `You are ZIVO Agent v3 — an autonomous full-stack engineer with a self-correcting build loop.

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

const EXISTING_FILES_TRUNCATE_LENGTH = 400;
const FIX_CONTEXT_TRUNCATE_LENGTH = 200;

function buildExistingFilesContext(existingFiles: AgentV3File[]): string {
  if (existingFiles.length === 0) return "";
  const summaries = existingFiles
    .map(
      (f) =>
        `// ${f.path}\n${f.content.slice(0, EXISTING_FILES_TRUNCATE_LENGTH)}${
          f.content.length > EXISTING_FILES_TRUNCATE_LENGTH ? "\n// ... (truncated)" : ""
        }`
    )
    .join("\n\n");
  return `\n\nExisting project files (${existingFiles.length} total):\n${summaries}`;
}

/**
 * OrchestratorV3: Generate → Validate → Fix → Rebuild loop.
 * Key improvements over V2:
 * - Uses lib/ai/fix-loop.ts abstraction for build error grouping
 * - Tracks fixHistory (iteration, errorsFound, errorsFixed)
 * - Groups errors by file and fixes in parallel
 * - maxIterations defaults to 8 (configurable)
 */
export async function runOrchestratorV3(
  prompt: string,
  existingFiles: AgentV3File[] = [],
  maxIterations = 8,
  projectContext?: string
): Promise<AgentV3Result> {
  const steps: AgentV3Step[] = [];
  const fixHistory: FixHistoryEntry[] = [];
  let files: AgentV3File[] = [];
  let validation: ValidationResult = { valid: false, issues: [], summary: "" };
  let iterations = 0;

  const addStep = (step: string, status: AgentV3Step["status"], detail?: string): void => {
    steps.push({ step, status, detail });
  };

  // Step 1: Plan + Generate
  addStep("🧠 Planning and generating code…", "running");
  const existingContext = buildExistingFilesContext(existingFiles);
  const systemPrompt = projectContext
    ? `${ORCHESTRATOR_V3_SYSTEM_PROMPT}\n\nProject Context:\n${projectContext}`
    : ORCHESTRATOR_V3_SYSTEM_PROMPT;

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
  let parsed: { files: AgentV3File[]; plan: string[]; summary: string };

  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
  } catch {
    addStep("🧠 Planning and generating code…", "error", "Failed to parse AI response");
    return {
      files: [],
      steps,
      validation: { valid: false, issues: [], summary: "Parse error" },
      summary: "Generation failed",
      iterations: 0,
      fixHistory: [],
    };
  }

  files = parsed.files ?? [];
  addStep("🧠 Planning and generating code…", "done", parsed.plan?.join("; "));

  // Step 2: Ensure package.json exists for Node/Next.js projects
  const hasPackageJson = files.some(
    (f) => f.path === "package.json" || f.path.endsWith("/package.json")
  );
  const hasTsOrJsFiles = files.some((f) => f.path.match(/\.(ts|tsx|js|jsx)$/));
  if (!hasPackageJson && hasTsOrJsFiles) {
    addStep("⚙️ Generating missing package.json…", "running");
    const pkgResponse = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1,
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content:
            "You are a package.json generator. Return ONLY a valid JSON object for package.json, no markdown.",
        },
        {
          role: "user",
          content: `Generate a package.json for a Next.js 15 project based on these files:\n${files
            .map((f) => f.path)
            .join("\n")}`,
        },
      ],
    });
    const pkgContent = (pkgResponse.choices?.[0]?.message?.content ?? "{}")
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();
    files.push({ path: "package.json", content: pkgContent, action: "create" });
    addStep("⚙️ Generating missing package.json…", "done");
  }

  // Step 3: Validate → Fix loop (up to maxIterations, default 8)
  for (let i = 0; i < maxIterations; i++) {
    iterations++;
    addStep(`🔧 Validation pass ${i + 1}/${maxIterations}…`, "running");
    validation = validateFiles(files);

    const errorIssues = validation.issues.filter((iss) => iss.type === "error");

    if (validation.valid || errorIssues.length === 0) {
      addStep(`🔧 Validation pass ${i + 1}/${maxIterations}…`, "done", validation.summary);
      fixHistory.push({ iteration: i + 1, errorsFound: 0, errorsFixed: 0 });
      break;
    }

    addStep(`🔧 Validation pass ${i + 1}/${maxIterations}…`, "error", validation.summary);

    if (i < maxIterations - 1) {
      addStep(`🔧 Auto-fixing ${errorIssues.length} error(s) (iteration ${i + 1})…`, "running");

      // Group issues by file for parallel fixing
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
        return {
          file: filePath,
          content: fileObj?.content ?? "",
          issues,
          projectContext: fixContext,
        };
      });

      // Fix all files in parallel (grouped by file)
      const fixResults = await fixFiles(fixRequests);
      let errorsFixed = 0;
      for (const fix of fixResults) {
        const idx = files.findIndex((f) => f.path === fix.file);
        if (idx >= 0) {
          files[idx] = { ...files[idx], content: fix.fixedContent };
          errorsFixed += fix.appliedFixes.length;
        }
      }

      fixHistory.push({
        iteration: i + 1,
        errorsFound: errorIssues.length,
        errorsFixed,
      });

      addStep(
        `🔧 Auto-fixing ${errorIssues.length} error(s) (iteration ${i + 1})…`,
        "done",
        `Applied ${errorsFixed} fixes across ${fixResults.length} file(s)`
      );
    } else {
      fixHistory.push({ iteration: i + 1, errorsFound: errorIssues.length, errorsFixed: 0 });
    }
  }

  addStep("✅ Build complete", "done", `${files.length} file(s) generated`);

  return {
    files,
    steps,
    validation,
    summary: parsed.summary ?? "Generation complete",
    iterations,
    fixHistory,
  };
}

/**
 * Streaming version of runOrchestratorV3.
 * Yields step update objects and progress events as the build progresses.
 */
export async function* runOrchestratorV3Streamed(
  prompt: string,
  existingFiles: AgentV3File[] = [],
  maxIterations = 8,
  projectContext?: string
): AsyncGenerator<
  | AgentV3Step
  | { type: "result"; result: AgentV3Result }
  | { type: "progress"; percent: number; stage: string }
  | { type: "fixIteration"; entry: FixHistoryEntry },
  void,
  unknown
> {
  const steps: AgentV3Step[] = [];
  const fixHistory: FixHistoryEntry[] = [];
  let files: AgentV3File[] = [];
  let validation: ValidationResult = { valid: false, issues: [], summary: "" };
  let iterations = 0;

  const emitStep = (
    step: string,
    status: AgentV3Step["status"],
    detail?: string
  ): AgentV3Step => {
    const s: AgentV3Step = { step, status, detail };
    steps.push(s);
    return s;
  };

  // Stage 1: Planning
  yield { type: "progress", percent: 5, stage: "🧠 Planning" };
  yield emitStep("🧠 Planning and generating code…", "running");

  const existingContext = buildExistingFilesContext(existingFiles);
  const systemPrompt = projectContext
    ? `${ORCHESTRATOR_V3_SYSTEM_PROMPT}\n\nProject Context:\n${projectContext}`
    : ORCHESTRATOR_V3_SYSTEM_PROMPT;

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
  let parsed: { files: AgentV3File[]; plan: string[]; summary: string };

  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
  } catch {
    yield emitStep("🧠 Planning and generating code…", "error", "Failed to parse AI response");
    yield {
      type: "result",
      result: {
        files: [],
        steps,
        validation: { valid: false, issues: [], summary: "Parse error" },
        summary: "Generation failed",
        iterations: 0,
        fixHistory: [],
      },
    };
    return;
  }

  // Stage 2: Generating files
  yield { type: "progress", percent: 30, stage: "⚙️ Generating files" };
  files = parsed.files ?? [];
  yield emitStep("🧠 Planning and generating code…", "done", parsed.plan?.join("; "));

  // Ensure package.json
  const hasPackageJson = files.some(
    (f) => f.path === "package.json" || f.path.endsWith("/package.json")
  );
  const hasTsOrJsFiles = files.some((f) => f.path.match(/\.(ts|tsx|js|jsx)$/));
  if (!hasPackageJson && hasTsOrJsFiles) {
    yield emitStep("⚙️ Generating missing package.json…", "running");
    const pkgResponse = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1,
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content:
            "You are a package.json generator. Return ONLY a valid JSON object for package.json, no markdown.",
        },
        {
          role: "user",
          content: `Generate a package.json for a Next.js 15 project based on these files:\n${files
            .map((f) => f.path)
            .join("\n")}`,
        },
      ],
    });
    const pkgContent = (pkgResponse.choices?.[0]?.message?.content ?? "{}")
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();
    files.push({ path: "package.json", content: pkgContent, action: "create" });
    yield emitStep("⚙️ Generating missing package.json…", "done");
  }

  // Stage 3: Fix loop
  yield { type: "progress", percent: 40, stage: "🔧 Fixing errors" };

  for (let i = 0; i < maxIterations; i++) {
    iterations++;
    yield emitStep(`🔧 Validation pass ${i + 1}/${maxIterations}…`, "running");
    const progressPercent = Math.round(40 + (i / maxIterations) * 55);
    yield { type: "progress", percent: progressPercent, stage: `🔧 Fixing errors (pass ${i + 1})` };

    validation = validateFiles(files);
    const errorIssues = validation.issues.filter((iss) => iss.type === "error");

    if (validation.valid || errorIssues.length === 0) {
      yield emitStep(`🔧 Validation pass ${i + 1}/${maxIterations}…`, "done", validation.summary);
      const entry: FixHistoryEntry = { iteration: i + 1, errorsFound: 0, errorsFixed: 0 };
      fixHistory.push(entry);
      yield { type: "fixIteration", entry };
      yield { type: "progress", percent: 95, stage: "✅ Preview ready" };
      break;
    }

    yield emitStep(`🔧 Validation pass ${i + 1}/${maxIterations}…`, "error", validation.summary);

    if (i < maxIterations - 1) {
      yield emitStep(
        `🔧 Auto-fixing ${errorIssues.length} error(s) (iteration ${i + 1})…`,
        "running"
      );

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
        return {
          file: filePath,
          content: fileObj?.content ?? "",
          issues,
          projectContext: fixContext,
        };
      });

      const fixResults = await fixFiles(fixRequests);
      let errorsFixed = 0;
      for (const fix of fixResults) {
        const idx = files.findIndex((f) => f.path === fix.file);
        if (idx >= 0) {
          files[idx] = { ...files[idx], content: fix.fixedContent };
          errorsFixed += fix.appliedFixes.length;
        }
      }

      const entry: FixHistoryEntry = {
        iteration: i + 1,
        errorsFound: errorIssues.length,
        errorsFixed,
      };
      fixHistory.push(entry);
      yield { type: "fixIteration", entry };

      yield emitStep(
        `🔧 Auto-fixing ${errorIssues.length} error(s) (iteration ${i + 1})…`,
        "done",
        `Applied ${errorsFixed} fixes across ${fixResults.length} file(s)`
      );
    } else {
      const entry: FixHistoryEntry = {
        iteration: i + 1,
        errorsFound: errorIssues.length,
        errorsFixed: 0,
      };
      fixHistory.push(entry);
      yield { type: "fixIteration", entry };
    }
  }

  // Stage 4: Done
  yield { type: "progress", percent: 100, stage: "✅ Preview ready" };
  yield emitStep("✅ Build complete", "done", `${files.length} file(s) generated`);

  yield {
    type: "result",
    result: {
      files,
      steps,
      validation,
      summary: parsed.summary ?? "Generation complete",
      iterations,
      fixHistory,
    },
  };
}
