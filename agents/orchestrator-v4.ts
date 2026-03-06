// agents/orchestrator-v4.ts — Full pipeline orchestrator: Prompt → Blueprint → Architecture → Manifest → Batch → Validate → Fix → Done

import { generateBlueprint, type Blueprint } from '@/lib/ai/blueprint-generator';
import { planArchitecture, type ArchitecturePlan } from '@/lib/ai/architecture-planner';
import { generateFileList } from '@/lib/ai/file-list-generator';
import { createManifest, type ProjectManifest } from '@/lib/ai/manifest';
import { generateFromManifest } from '@/lib/ai/batch-generator';
import { ProgressStage, createProgressEvent, type ProgressEvent } from '@/lib/ai/progress-events';
import { projectMemoryStore, type ProjectMemory } from '@/lib/ai/project-memory';
import { buildRepoIndex, findRelevantFiles, type RepoIndex } from '@/lib/ai/repo-index';
import { validateFiles } from '@/agents/validator';
import { fixFiles } from '@/agents/code-fixer';
import type { GeneratedFile } from '@/lib/ai/schema';
import type { ValidationResult } from '@/agents/validator';

export interface AgentV4Step {
  step: string;
  status: 'pending' | 'running' | 'done' | 'error';
  detail?: string;
}

export interface AgentV4Result {
  files: GeneratedFile[];
  steps: AgentV4Step[];
  validation: ValidationResult;
  summary: string;
  iterations: number;
  blueprint: Blueprint;
  manifest: ProjectManifest;
  memory: ProjectMemory | null;
}

type OnProgress = (event: ProgressEvent) => void;

function makeStep(step: string): AgentV4Step {
  return { step, status: 'pending' };
}

function emit(
  onProgress: OnProgress | undefined,
  stage: ProgressStage,
  message: string,
  progress: number,
  data?: unknown
): void {
  onProgress?.(createProgressEvent(stage, message, progress, data));
}

/**
 * Run the full V4 orchestrator pipeline.
 *
 * @param prompt - User prompt describing the app to build
 * @param existingFiles - Existing files for follow-up iterations
 * @param projectMemory - Existing project memory for follow-up builds
 * @param onProgress - Optional progress event callback
 * @param model - OpenAI model to use
 * @param maxFixIterations - Maximum number of fix loop iterations (default 5)
 */
export async function runOrchestratorV4(
  prompt: string,
  existingFiles: GeneratedFile[] = [],
  projectMemory: ProjectMemory | null = null,
  onProgress?: OnProgress,
  model = 'gpt-4o',
  maxFixIterations = 5
): Promise<AgentV4Result> {
  const projectId = projectMemory?.projectId ?? `proj-${Date.now()}`;
  const steps: AgentV4Step[] = [
    makeStep('Blueprint'),
    makeStep('Architecture'),
    makeStep('Manifest'),
    makeStep('Generate'),
    makeStep('Validate'),
    makeStep('Fix'),
    makeStep('Done'),
  ];

  // ── Stage 1: Blueprint ────────────────────────────────────────────────────
  steps[0].status = 'running';
  emit(onProgress, ProgressStage.BLUEPRINT, 'Generating blueprint…', 5);

  let blueprint: Blueprint;
  let repoIndex: RepoIndex | null = null;

  if (projectMemory) {
    blueprint = projectMemory.blueprint;
    repoIndex = buildRepoIndex(existingFiles, projectId);
    const relevantPaths = findRelevantFiles(repoIndex, prompt);
    emit(onProgress, ProgressStage.BLUEPRINT, `Using existing blueprint. Relevant files: ${relevantPaths.length}`, 10, { relevantPaths });
  } else {
    blueprint = await generateBlueprint(prompt, model);
  }

  steps[0].status = 'done';
  emit(onProgress, ProgressStage.BLUEPRINT, 'Blueprint ready', 15, blueprint);

  // ── Stage 2: Architecture ────────────────────────────────────────────────
  steps[1].status = 'running';
  emit(onProgress, ProgressStage.ARCHITECTURE, 'Planning architecture…', 18);

  const architecture: ArchitecturePlan = projectMemory?.architecture ?? (await planArchitecture(blueprint, model));

  steps[1].status = 'done';
  emit(onProgress, ProgressStage.ARCHITECTURE, 'Architecture planned', 22, architecture);

  // ── Stage 3: Manifest ────────────────────────────────────────────────────
  steps[2].status = 'running';
  emit(onProgress, ProgressStage.MANIFEST, 'Generating file manifest…', 25);

  const manifestFiles = await generateFileList(prompt, blueprint, model);
  const manifest = createManifest(projectId, prompt, manifestFiles, blueprint);

  steps[2].status = 'done';
  emit(onProgress, ProgressStage.MANIFEST, `Manifest ready — ${manifestFiles.length} files in ${manifest.batches.length} batches`, 30, {
    fileCount: manifestFiles.length,
    batchCount: manifest.batches.length,
  });

  // ── Stage 4: Batch Generate ───────────────────────────────────────────────
  steps[3].status = 'running';
  emit(onProgress, ProgressStage.GENERATING, 'Starting batch generation…', 32);

  const startingFiles = existingFiles.length > 0 ? existingFiles : [];

  const generatedFiles = await generateFromManifest(
    manifest,
    (evt) => {
      // Re-emit with adjusted progress range 32–75
      const adjusted = createProgressEvent(
        evt.stage,
        evt.message,
        32 + Math.round((evt.progress / 100) * 43),
        evt.data
      );
      onProgress?.(adjusted);
    },
    model
  );

  // Merge existing files (follow-up) with newly generated files
  const allFiles = mergeFiles(startingFiles, generatedFiles);

  steps[3].status = 'done';
  emit(onProgress, ProgressStage.GENERATING, `Generated ${generatedFiles.length} files`, 76, {
    fileCount: generatedFiles.length,
  });

  // ── Stage 5: Validate ────────────────────────────────────────────────────
  steps[4].status = 'running';
  emit(onProgress, ProgressStage.VALIDATING, 'Validating generated files…', 78);

  let validation = validateFiles(allFiles);
  let iterations = 0;

  steps[4].status = 'done';
  emit(onProgress, ProgressStage.VALIDATING, `Validation: ${validation.valid ? 'passed' : `${validation.issues.length} issue(s)`}`, 80, {
    valid: validation.valid,
    issueCount: validation.issues.length,
  });

  // ── Stage 6: Fix Loop ────────────────────────────────────────────────────
  steps[5].status = 'running';
  const currentFiles = allFiles;

  while (!validation.valid && iterations < maxFixIterations) {
    iterations++;
    const errorIssues = validation.issues.filter((i) => i.type === 'error');
    if (errorIssues.length === 0) break;

    emit(onProgress, ProgressStage.FIXING, `Fix iteration ${iterations}/${maxFixIterations} — ${errorIssues.length} error(s)`, 80 + iterations * 2);

    const byFile = new Map<string, typeof errorIssues>();
    for (const issue of errorIssues) {
      const list = byFile.get(issue.file) ?? [];
      list.push(issue);
      byFile.set(issue.file, list);
    }

    // Build context only from files referenced in this fix batch to avoid token bloat
    const fixFilePaths = new Set(byFile.keys());
    const fixContext = currentFiles
      .filter((f) => fixFilePaths.has(f.path))
      .map((f) => `// ${f.path}\n${f.content.slice(0, 1500)}`)
      .join('\n\n');

    const fixRequests = Array.from(byFile.entries()).map(([filePath, issues]) => {
      const fileObj = currentFiles.find((f) => f.path === filePath);
      return {
        file: filePath,
        content: fileObj?.content ?? '',
        issues,
        projectContext: fixContext,
      };
    });

    const fixResults = await fixFiles(fixRequests);
    for (const fix of fixResults) {
      const idx = currentFiles.findIndex((f) => f.path === fix.file);
      if (idx >= 0) {
        currentFiles[idx] = { ...currentFiles[idx], content: fix.fixedContent };
      }
    }

    validation = validateFiles(currentFiles);
  }

  steps[5].status = 'done';
  emit(onProgress, ProgressStage.FIXING, `Fix loop complete after ${iterations} iteration(s)`, 92);

  // ── Stage 7: Save Memory ─────────────────────────────────────────────────
  steps[6].status = 'running';

  const memory: ProjectMemory = {
    projectId,
    prompt,
    blueprint,
    architecture,
    manifest,
    files: currentFiles,
    decisions: projectMemory?.decisions ?? [],
    conversationHistory: projectMemory?.conversationHistory ?? [],
    techStack: blueprint.features,
    createdAt: projectMemory?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  projectMemoryStore.save(memory);

  steps[6].status = 'done';
  emit(onProgress, ProgressStage.DONE, `Build complete — ${currentFiles.length} files`, 100, {
    fileCount: currentFiles.length,
    projectId,
  });

  const summary = `Built ${currentFiles.length} files for "${blueprint.goal}". ${
    iterations > 0 ? `Applied ${iterations} fix iteration(s).` : 'No fixes needed.'
  }`;

  return {
    files: currentFiles,
    steps,
    validation,
    summary,
    iterations,
    blueprint,
    manifest,
    memory,
  };
}

/** Merge existing files with new files, new files taking precedence by path */
function mergeFiles(existing: GeneratedFile[], incoming: GeneratedFile[]): GeneratedFile[] {
  const map = new Map<string, GeneratedFile>();
  for (const f of existing) map.set(f.path, f);
  for (const f of incoming) map.set(f.path, f);
  return Array.from(map.values());
}
