// Memory & context management system.
// Provides short-term (session) and long-term (project) memory with context retrieval.

export interface MemoryEntry {
  id: string;
  projectId: string;
  type: MemoryType;
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type MemoryType =
  | "architecture_decision"
  | "generated_artifact"
  | "user_preference"
  | "error_history"
  | "dependency"
  | "deployment"
  | "file_tree"
  | "project_config"
  | "integration_status";

export interface ProjectMemory {
  projectId: string;
  metadata: Record<string, unknown>;
  techStack: string[];
  generatedFiles: string[];
  architectureDecisions: string[];
  integrations: string[];
  deploymentHistory: DeploymentRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface DeploymentRecord {
  id: string;
  target: string;
  status: "success" | "failed" | "pending";
  timestamp: string;
  url?: string;
}

// ── In-memory store (replace with a database in production) ─────────────────

const entries = new Map<string, MemoryEntry>();
const projects = new Map<string, ProjectMemory>();

// ── Helper ───────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── Memory operations ────────────────────────────────────────────────────────

export function storeMemory(
  projectId: string,
  type: MemoryType,
  content: string,
  metadata?: Record<string, unknown>
): MemoryEntry {
  const id = generateId();
  const now = new Date().toISOString();
  const entry: MemoryEntry = { id, projectId, type, content, metadata, createdAt: now, updatedAt: now };
  entries.set(id, entry);
  return entry;
}

export function retrieveMemory(projectId: string, type?: MemoryType): MemoryEntry[] {
  const results: MemoryEntry[] = [];
  for (const entry of entries.values()) {
    if (entry.projectId === projectId && (!type || entry.type === type)) {
      results.push(entry);
    }
  }
  return results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function deleteMemory(id: string): boolean {
  return entries.delete(id);
}

// ── Project memory ───────────────────────────────────────────────────────────

export function getOrCreateProjectMemory(projectId: string): ProjectMemory {
  if (!projects.has(projectId)) {
    const now = new Date().toISOString();
    projects.set(projectId, {
      projectId,
      metadata: {},
      techStack: [],
      generatedFiles: [],
      architectureDecisions: [],
      integrations: [],
      deploymentHistory: [],
      createdAt: now,
      updatedAt: now,
    });
  }
  return projects.get(projectId)!;
}

export function updateProjectMemory(
  projectId: string,
  updates: Partial<Omit<ProjectMemory, "projectId" | "createdAt">>
): ProjectMemory {
  const existing = getOrCreateProjectMemory(projectId);
  const updated: ProjectMemory = {
    ...existing,
    ...updates,
    projectId,
    updatedAt: new Date().toISOString(),
  };
  projects.set(projectId, updated);
  return updated;
}

export function getAllProjectMemory(projectId: string): {
  project: ProjectMemory;
  entries: MemoryEntry[];
} {
  return {
    project: getOrCreateProjectMemory(projectId),
    entries: retrieveMemory(projectId),
  };
}

// ── Context window optimisation ──────────────────────────────────────────────

/**
 * Returns the most relevant memory entries for a given query.
 * Uses simple keyword matching (replace with embedding search in production).
 */
export function retrieveRelevantContext(
  projectId: string,
  query: string,
  maxEntries = 10
): MemoryEntry[] {
  const keywords = query.toLowerCase().split(/\s+/);
  const all = retrieveMemory(projectId);

  const scored = all.map((entry) => {
    const text = `${entry.type} ${entry.content}`.toLowerCase();
    const score = keywords.filter((k) => text.includes(k)).length;
    return { entry, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxEntries)
    .map((s) => s.entry);
}

/**
 * Compress memory entries into a single summary string for context window efficiency.
 */
export function compressMemory(entries: MemoryEntry[]): string {
  const grouped: Record<string, string[]> = {};
  for (const e of entries) {
    if (!grouped[e.type]) grouped[e.type] = [];
    grouped[e.type].push(e.content.slice(0, 200));
  }
  return Object.entries(grouped)
    .map(([type, contents]) => `[${type}] ${contents.join(" | ")}`)
    .join("\n");
}
