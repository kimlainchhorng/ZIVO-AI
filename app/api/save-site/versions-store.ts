// Shared in-memory store for project versions.
// Extracted into its own module so it can be imported by other route files
// without conflicting with Next.js Route export validation.

export interface ProjectVersion {
  id: string;
  projectId: string;
  htmlContent: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// Memory storage for versions (fallback when Supabase is not configured)
export const versions: ProjectVersion[] = [];

// Get all versions sorted newest-first
export function getVersions(): ProjectVersion[] {
  return [...versions].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// Delete a version by id; returns true if found and removed
export function deleteVersion(id: string): boolean {
  const index = versions.findIndex((v) => v.id === id);
  if (index !== -1) {
    versions.splice(index, 1);
    return true;
  }
  return false;
}
