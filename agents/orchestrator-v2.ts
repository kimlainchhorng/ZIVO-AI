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

export async function runOrchestratorV2(
  prompt: string,
  existingFiles: AgentV2File[] = [],
  maxIterations = 5
): Promise<AgentV2Result> {
  const steps: AgentV2Step[] = [];
  let files: AgentV2File[] = [];
  let validation: ValidationResult = { valid: false, issues: [], summary: "" };
  let iterations = 0;

  const addStep = (step: string, status: AgentV2Step["status"], detail?: string) => {
    steps.push({ step, status, detail });
  };

  // Step 1: Plan + Generate
  addStep("Planning and generating code…", "running");
  const existingContext =
    existingFiles.length > 0
      ? `\n\nExisting files:\n${existingFiles
          .map((f) => `// ${f.path}\n${f.content.slice(0, 300)}`)
          .join("\n\n")}`
      : "";

  const response = await getClient().chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    max_tokens: 8192,
    messages: [
      { role: "system", content: ORCHESTRATOR_SYSTEM_PROMPT },
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

  // Step 2: Validate → Fix loop
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

      const fixRequests = Array.from(byFile.entries()).map(([filePath, issues]) => {
        const fileObj = files.find((f) => f.path === filePath);
        return { file: filePath, content: fileObj?.content ?? "", issues };
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
