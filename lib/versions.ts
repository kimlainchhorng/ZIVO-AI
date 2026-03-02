// Shared in-memory version store.
// Used by save-site, backup-list, live-version, delete-version, and version/history routes.

export interface ProjectVersion {
  id: string;
  projectId: string;
  htmlContent: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// In-memory store (replace with a database in production)
let versions: ProjectVersion[] = [];

export function getVersions(): ProjectVersion[] {
  return [...versions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function addVersion(version: ProjectVersion): void {
  versions.push(version);
}

export function deleteVersion(id: string): boolean {
  const index = versions.findIndex((v) => v.id === id);
  if (index !== -1) {
    versions.splice(index, 1);
    return true;
  }
  return false;
}
