// lib/version-history.ts — Project version history with rollback and diff

import { computeDiff, type DiffHunk } from "./diff-engine";

const MAX_VERSIONS_PER_PROJECT = 20;

export interface VersionedFile {
  path: string;
  content: string;
}

export interface Version {
  id: string;
  projectId: string;
  label?: string;
  files: VersionedFile[];
  createdAt: string;
}

export interface FileDiff {
  path: string;
  hunks: DiffHunk[];
  added: boolean;
  removed: boolean;
}

let versionCounter = 0;
const historyStore = new Map<string, Version[]>();

/**
 * Manages versioned snapshots of project files.
 */
export class VersionHistory {
  /**
   * Creates a named snapshot of the given files for a project.
   * Evicts the oldest version if the limit of 20 is reached.
   */
  snapshot(projectId: string, files: VersionedFile[], label?: string): Version {
    const versions = historyStore.get(projectId) ?? [];
    const version: Version = {
      id: `v_${Date.now()}_${++versionCounter}`,
      projectId,
      label,
      files: files.map((f) => ({ ...f })),
      createdAt: new Date().toISOString(),
    };
    versions.push(version);
    if (versions.length > MAX_VERSIONS_PER_PROJECT) {
      versions.shift();
    }
    historyStore.set(projectId, versions);
    return version;
  }

  /** Returns all versions for a project, ordered oldest → newest. */
  getVersions(projectId: string): Version[] {
    return [...(historyStore.get(projectId) ?? [])];
  }

  /**
   * Returns the files from a specific version.
   * Throws if the version is not found.
   */
  rollback(projectId: string, versionId: string): VersionedFile[] {
    const versions = historyStore.get(projectId) ?? [];
    const target = versions.find((v) => v.id === versionId);
    if (!target) throw new Error(`Version ${versionId} not found for project ${projectId}`);
    return target.files.map((f) => ({ ...f }));
  }

  /**
   * Computes file-level diffs between two versions.
   * Returns an array of FileDiff objects showing what changed.
   */
  diff(projectId: string, v1Id: string, v2Id: string): FileDiff[] {
    const versions = historyStore.get(projectId) ?? [];
    const v1 = versions.find((v) => v.id === v1Id);
    const v2 = versions.find((v) => v.id === v2Id);
    if (!v1) throw new Error(`Version ${v1Id} not found`);
    if (!v2) throw new Error(`Version ${v2Id} not found`);

    const allPaths = new Set([...v1.files.map((f) => f.path), ...v2.files.map((f) => f.path)]);
    const diffs: FileDiff[] = [];

    for (const path of allPaths) {
      const oldFile = v1.files.find((f) => f.path === path);
      const newFile = v2.files.find((f) => f.path === path);
      const oldContent = oldFile?.content ?? "";
      const newContent = newFile?.content ?? "";

      if (oldContent === newContent) continue;

      diffs.push({
        path,
        hunks: computeDiff(oldContent, newContent),
        added: !oldFile,
        removed: !newFile,
      });
    }

    return diffs;
  }

  /** Clears all version history for a project. */
  clear(projectId: string): void {
    historyStore.delete(projectId);
  }
}

/** Default shared VersionHistory instance. */
export const versionHistory = new VersionHistory();
