// lib/ai/batch-generator.ts — Generates files in safe batches from a ProjectManifest

import type { ProjectManifest } from './manifest';
import type { GeneratedFile } from './schema';
import type { ProgressEvent } from './progress-events';
import { ProgressStage, createProgressEvent } from './progress-events';
import { generateFileBatch } from './file-generator';

/**
 * Generate all files from a ProjectManifest by processing batches sequentially.
 */
export async function generateFromManifest(
  manifest: ProjectManifest,
  onProgress?: (event: ProgressEvent) => void,
  model = 'gpt-4o'
): Promise<GeneratedFile[]> {
  const allFiles: GeneratedFile[] = [];
  const totalBatches = manifest.batches.length;

  const projectContext = [
    `Project: ${manifest.prompt}`,
    `Total files: ${manifest.files.length}`,
    `Batches: ${totalBatches}`,
  ].join('\n');

  for (let i = 0; i < totalBatches; i++) {
    const batch = manifest.batches[i];

    onProgress?.(
      createProgressEvent(
        ProgressStage.GENERATING,
        `Generating batch ${i + 1}/${totalBatches} (${batch.files.length} files)`,
        Math.round(((i) / totalBatches) * 100),
        { batchIndex: i, fileCount: batch.files.length }
      )
    );

    batch.status = 'in_progress';

    const batchFiles = await generateFileBatch(batch, projectContext, allFiles, model);
    allFiles.push(...batchFiles);

    // Mark batch done
    batch.status = 'done';
    for (const f of batch.files) f.status = 'done';

    onProgress?.(
      createProgressEvent(
        ProgressStage.GENERATING,
        `Batch ${i + 1}/${totalBatches} complete — ${batchFiles.length} files generated`,
        Math.round(((i + 1) / totalBatches) * 100),
        { batchIndex: i, generated: batchFiles.map((f) => f.path) }
      )
    );
  }

  return allFiles;
}
