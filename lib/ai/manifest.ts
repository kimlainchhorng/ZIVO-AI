// lib/ai/manifest.ts — ProjectManifest: single source of truth for all files a project must produce

export type FileType = 'page' | 'component' | 'api' | 'db' | 'auth' | 'config' | 'style' | 'test' | 'util';
export type FileStatus = 'pending' | 'generating' | 'done' | 'error';
export type ManifestStatus = 'pending' | 'in_progress' | 'done' | 'error';

export interface ManifestFile {
  path: string;
  type: FileType;
  description: string;
  dependencies: string[];
  priority: number;
  status: FileStatus;
  batchIndex: number;
}

export interface ManifestBatch {
  index: number;
  files: ManifestFile[];
  status: 'pending' | 'in_progress' | 'done' | 'error';
}

export interface ProjectManifest {
  projectId: string;
  prompt: string;
  blueprint: unknown;
  files: ManifestFile[];
  batches: ManifestBatch[];
  status: ManifestStatus;
  createdAt: string;
}

/** Create a new ProjectManifest from a list of files */
export function createManifest(
  projectId: string,
  prompt: string,
  files: ManifestFile[],
  blueprint: unknown = null,
  batchSize = 5
): ProjectManifest {
  const batches = groupIntoBatches(files, batchSize);
  return {
    projectId,
    prompt,
    blueprint,
    files,
    batches,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
}

/** Group files into batches of batchSize, sorted by priority ascending */
export function groupIntoBatches(files: ManifestFile[], batchSize = 5): ManifestBatch[] {
  const sorted = [...files].sort((a, b) => a.priority - b.priority);
  const batches: ManifestBatch[] = [];
  for (let i = 0; i < sorted.length; i += batchSize) {
    const batchFiles = sorted.slice(i, i + batchSize).map((f) => ({ ...f, batchIndex: batches.length }));
    batches.push({ index: batches.length, files: batchFiles, status: 'pending' });
  }
  return batches;
}

/** Get the next pending batch from a manifest */
export function getNextBatch(manifest: ProjectManifest): ManifestBatch | null {
  return manifest.batches.find((b) => b.status === 'pending') ?? null;
}

/** Mark a file as complete in the manifest (mutates manifest) */
export function markFileComplete(manifest: ProjectManifest, path: string): void {
  const file = manifest.files.find((f) => f.path === path);
  if (file) file.status = 'done';
  for (const batch of manifest.batches) {
    const batchFile = batch.files.find((f) => f.path === path);
    if (batchFile) batchFile.status = 'done';
  }
}

/** Return progress as a number 0–100 */
export function manifestProgress(manifest: ProjectManifest): number {
  if (manifest.files.length === 0) return 0;
  const done = manifest.files.filter((f) => f.status === 'done').length;
  return Math.round((done / manifest.files.length) * 100);
}
