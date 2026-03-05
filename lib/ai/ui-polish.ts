// lib/ai/ui-polish.ts — UI polish pass using diff-patcher
// Applies targeted improvements to generated files based on UIEvalResult.

import { applyPatch, generatePatchesFromPrompt, type FilePatch } from "@/lib/ai/diff-patcher";
import { evaluateUI, type UIEvalResult, type UIIssue } from "@/lib/ai/ui-evaluator";
import type { GeneratedFile } from "@/lib/ai/schema";

export interface PolishOptions {
  model?: string;
  maxIterations?: number;
  scoreThreshold?: number;
}

export interface PolishResult {
  files: GeneratedFile[];
  evalResult: UIEvalResult;
  iterations: number;
  improved: boolean;
}

/**
 * Apply UI polish passes to a set of generated files.
 * Runs up to maxIterations cycles of evaluate → patch if score < scoreThreshold.
 */
export async function polishUI(
  files: GeneratedFile[],
  options: PolishOptions = {}
): Promise<PolishResult> {
  const {
    model = "gpt-4o",
    maxIterations = 2,
    scoreThreshold = 85,
  } = options;

  let currentFiles = files.map((f) => ({ ...f }));
  let evalResult = evaluateUI(currentFiles);
  let iterations = 0;
  const initialScore = evalResult.score;

  while (evalResult.score < scoreThreshold && iterations < maxIterations) {
    const prompt = buildPolishPrompt(evalResult.issues, currentFiles);
    const { patches } = await generatePatchesFromPrompt(
      prompt,
      currentFiles.map((f) => ({ path: f.path, content: f.content })),
      model
    );

    if (patches.length === 0) break;

    currentFiles = applyPatches(currentFiles, patches);
    evalResult = evaluateUI(currentFiles);
    iterations++;
  }

  return {
    files: currentFiles,
    evalResult,
    iterations,
    improved: evalResult.score > initialScore,
  };
}

function buildPolishPrompt(issues: UIIssue[], files: GeneratedFile[]): string {
  const issueSummary = issues
    .slice(0, 15) // top 15 issues
    .map((i) => `- [${i.type}] ${i.file ? `${i.file}:${i.line ?? "?"} ` : ""}${i.suggestion}`)
    .join("\n");

  const fileCount = files.length;
  return `Polish the following generated UI code to fix these issues:\n\n${issueSummary}\n\n` +
    `The project has ${fileCount} file(s). Apply the minimal changes needed to improve quality:\n` +
    `- Replace hardcoded hex colors with Tailwind classes or CSS variables\n` +
    `- Replace inline layout styles (flex, grid, margin, padding) with Tailwind classes\n` +
    `- Replace emoji in icon/label fields with lucide-react <Icon name="..." /> components\n` +
    `- Add descriptive alt text to images\n` +
    `- Add loading/empty/error states where missing in screen components\n` +
    `- Replace Lorem ipsum placeholder text with realistic copy\n` +
    `Make surgical, minimal changes only. Do not rewrite entire files.`;
}

function applyPatches(files: GeneratedFile[], patches: FilePatch[]): GeneratedFile[] {
  const fileMap = new Map<string, GeneratedFile>(files.map((f) => [f.path, { ...f }]));

  for (const patch of patches) {
    if (patch.type === "delete") {
      fileMap.delete(patch.path);
      continue;
    }
    const existing = fileMap.get(patch.path);
    if (patch.type === "create" || !existing) {
      fileMap.set(patch.path, {
        path: patch.path,
        content: patch.content ?? "",
        action: "create",
      });
      continue;
    }
    // Update existing file
    const patched = applyPatch(existing.content, patch);
    fileMap.set(patch.path, { ...existing, content: patched, action: "update" });
  }

  return Array.from(fileMap.values());
}
