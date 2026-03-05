// lib/ai/ui-polish.ts — Apply targeted improvements using diff-patcher

import { generatePatchesFromPrompt, applyPatch } from './diff-patcher';
import type { FilePatch } from './diff-patcher';
import type { GeneratedFile } from './schema';
import type { Issue } from './ui-evaluator';

export interface PolishResult {
  files: GeneratedFile[];
  patchedPaths: string[];
  summary: string;
}

export interface PolishOpts {
  model?: string;
  maxFilesPerPass?: number;
}

/**
 * Apply targeted UI improvements to files based on evaluator issues.
 * Uses diff-patcher to generate and apply minimal patches.
 */
export async function applyUIPolish(
  files: GeneratedFile[],
  issues: Issue[],
  opts: PolishOpts = {}
): Promise<PolishResult> {
  const model = opts.model ?? 'gpt-4o';
  const maxFiles = opts.maxFilesPerPass ?? 6;

  if (issues.length === 0) {
    return { files, patchedPaths: [], summary: 'No issues to fix.' };
  }

  // Group issues by file — only patch files that need changes
  const issuesByFile = new Map<string, Issue[]>();
  for (const issue of issues) {
    const filePath = issue.file ?? 'unknown';
    if (!issuesByFile.has(filePath)) issuesByFile.set(filePath, []);
    issuesByFile.get(filePath)!.push(issue);
  }

  // Build patch prompt
  const filePaths = [...issuesByFile.keys()].slice(0, maxFiles);
  const targetFiles = files.filter((f) => filePaths.includes(f.path));

  if (targetFiles.length === 0) {
    return { files, patchedPaths: [], summary: 'No patchable files found for reported issues.' };
  }

  const issueDescriptions = filePaths
    .flatMap((fp) => (issuesByFile.get(fp) ?? []).map((i) => `[${i.type}] ${i.suggestion}`))
    .join('\n');

  const patchPrompt = `Fix these UI quality issues in the provided files:

${issueDescriptions}

Rules:
- Use CSS custom properties / token variables instead of raw hex colors
- Ensure ARIA roles on navigation elements
- Add loading/empty state handling for screens that are missing them
- Replace Lorem Ipsum with meaningful placeholder content
- Remove TODO comments by implementing them or removing placeholder code
- Keep changes minimal and targeted`;

  const existingFilesForPatcher = targetFiles.map((f) => ({
    path: f.path,
    content: f.content,
  }));

  const { patches, summary } = await generatePatchesFromPrompt(
    patchPrompt,
    existingFilesForPatcher,
    model
  );

  // Apply patches to the file list
  const updatedFiles = applyPatches(files, patches);
  const patchedPaths = patches.map((p: FilePatch) => p.path);

  return {
    files: updatedFiles,
    patchedPaths,
    summary: summary || `Applied ${patches.length} patch(es) to ${patchedPaths.length} file(s).`,
  };
}

/** Apply an array of FilePatch objects to a list of GeneratedFile objects */
function applyPatches(
  files: GeneratedFile[],
  patches: FilePatch[]
): GeneratedFile[] {
  const fileMap = new Map(files.map((f) => [f.path, f]));

  for (const patch of patches) {
    const existing = fileMap.get(patch.path);
    if (patch.type === 'create') {
      fileMap.set(patch.path, {
        path: patch.path,
        content: patch.content ?? '',
        action: 'create',
      });
    } else if (patch.type === 'delete') {
      fileMap.delete(patch.path);
    } else if (patch.type === 'update' && existing) {
      const newContent = applyPatch(existing.content, patch);
      fileMap.set(patch.path, { ...existing, content: newContent, action: 'update' });
    }
  }

  return [...fileMap.values()];
}
