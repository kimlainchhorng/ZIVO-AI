/**
 * ProjectMemoryManager
 *
 * In-memory store (keyed by projectId) that persists architectural decisions,
 * generated file contents, and free-form context across multiple agent calls
 * within the same server process.
 */

export interface ProjectMemory {
  projectId: string;
  /** Arbitrary context bag – tech stack, requirements, etc. */
  context: Record<string, unknown>;
  /** Generated / tracked file contents keyed by relative path */
  files: Record<string, string>;
  /** Log of important decisions taken by agents */
  decisions: string[];
  createdAt: string;
  updatedAt: string;
}

export class ProjectMemoryManager {
  private store: Map<string, ProjectMemory> = new Map();

  /** Retrieve or initialise a memory record for the given project. */
  getOrCreate(projectId: string): ProjectMemory {
    if (!this.store.has(projectId)) {
      const now = new Date().toISOString();
      this.store.set(projectId, {
        projectId,
        context: {},
        files: {},
        decisions: [],
        createdAt: now,
        updatedAt: now,
      });
    }
    return this.store.get(projectId)!;
  }

  /** Merge partial updates into the project memory. */
  update(projectId: string, updates: Partial<Omit<ProjectMemory, "projectId" | "createdAt">>): void {
    const mem = this.getOrCreate(projectId);
    if (updates.context) {
      Object.assign(mem.context, updates.context);
    }
    if (updates.files) {
      Object.assign(mem.files, updates.files);
    }
    if (updates.decisions) {
      mem.decisions.push(...updates.decisions);
    }
    mem.updatedAt = new Date().toISOString();
  }

  /** Append a single architectural / design decision. */
  addDecision(projectId: string, decision: string): void {
    const mem = this.getOrCreate(projectId);
    mem.decisions.push(decision);
    mem.updatedAt = new Date().toISOString();
  }

  /** Store or overwrite a generated file in memory. */
  setFile(projectId: string, filePath: string, content: string): void {
    const mem = this.getOrCreate(projectId);
    mem.files[filePath] = content;
    mem.updatedAt = new Date().toISOString();
  }

  /** Set a context key/value pair. */
  setContext(projectId: string, key: string, value: unknown): void {
    const mem = this.getOrCreate(projectId);
    mem.context[key] = value;
    mem.updatedAt = new Date().toISOString();
  }

  /** List all tracked project IDs. */
  listProjects(): string[] {
    return Array.from(this.store.keys());
  }

  /** Return a copy of the memory (safe for serialisation). */
  snapshot(projectId: string): ProjectMemory | null {
    const mem = this.store.get(projectId);
    if (!mem) return null;
    return JSON.parse(JSON.stringify(mem)) as ProjectMemory;
  }

  /** Delete a project's memory. */
  delete(projectId: string): void {
    this.store.delete(projectId);
  }
}

/** Singleton instance shared across the process */
export const projectMemory = new ProjectMemoryManager();
