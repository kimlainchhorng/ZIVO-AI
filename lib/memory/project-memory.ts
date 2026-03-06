export interface ProjectMemory {
  projectId: string;
  techStack: {
    framework?: string;
    styling?: string;
    database?: string;
    auth?: string;
  };
  codingStyle: {
    componentStyle?: "functional" | "class";
    arrowFunctions?: boolean;
    semicolons?: boolean;
    quotes?: "single" | "double";
  };
  designPreferences: {
    colorPalette?: string[];
    fontFamily?: string;
    darkMode?: boolean;
  };
  pastGenerations: Array<{
    id: string;
    prompt: string;
    files: string[];
    createdAt: string;
  }>;
  errorPatterns: Array<{
    error: string;
    fix: string;
    context: string;
  }>;
  updatedAt: string;
}

export function createDefaultMemory(projectId: string): ProjectMemory {
  return {
    projectId,
    techStack: {},
    codingStyle: {
      componentStyle: "functional",
      arrowFunctions: true,
      semicolons: true,
      quotes: "double",
    },
    designPreferences: {
      darkMode: false,
      colorPalette: [],
    },
    pastGenerations: [],
    errorPatterns: [],
    updatedAt: new Date().toISOString(),
  };
}

export function mergeMemory(
  existing: ProjectMemory,
  updates: Partial<ProjectMemory>
): ProjectMemory {
  return {
    ...existing,
    ...updates,
    techStack: { ...existing.techStack, ...updates.techStack },
    codingStyle: { ...existing.codingStyle, ...updates.codingStyle },
    designPreferences: {
      ...existing.designPreferences,
      ...updates.designPreferences,
    },
    pastGenerations: updates.pastGenerations ?? existing.pastGenerations,
    errorPatterns: updates.errorPatterns ?? existing.errorPatterns,
    updatedAt: new Date().toISOString(),
  };
}

// ─── Extended memory types and manager ────────────────────────────────────────

export interface MemoryDecision {
  timestamp: string;
  decision: string;
  reason: string;
}

export interface MemoryChange {
  timestamp: string;
  summary: string;
  files: string[];
}

export interface ExtendedProjectMemory {
  projectId: string;
  techStack: string[];
  conventions: string[];
  decisions: MemoryDecision[];
  recentChanges: MemoryChange[];
}

export class ProjectMemoryManager {
  private readonly projectId: string;
  private memory: ExtendedProjectMemory;

  constructor(projectId: string) {
    this.projectId = projectId;
    this.memory = this._load();
  }

  private _load(): ExtendedProjectMemory {
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(`zivo_memory_${this.projectId}`);
        if (stored) return JSON.parse(stored) as ExtendedProjectMemory;
      }
    } catch { /* ignore */ }
    return {
      projectId: this.projectId,
      techStack: [],
      conventions: [],
      decisions: [],
      recentChanges: [],
    };
  }

  private _save(): void {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          `zivo_memory_${this.projectId}`,
          JSON.stringify(this.memory)
        );
      }
    } catch { /* ignore */ }
  }

  async remember(
    type: "decision" | "convention" | "change",
    data: unknown
  ): Promise<void> {
    if (type === "decision") {
      const d = data as { decision: string; reason: string };
      this.memory.decisions.push({
        timestamp: new Date().toISOString(),
        decision: d.decision,
        reason: d.reason,
      });
    } else if (type === "convention") {
      this.memory.conventions.push(String(data));
    } else if (type === "change") {
      const c = data as { summary: string; files: string[] };
      this.memory.recentChanges.push({
        timestamp: new Date().toISOString(),
        summary: c.summary,
        files: c.files,
      });
      if (this.memory.recentChanges.length > 20) this.memory.recentChanges.shift();
    }
    this._save();
  }

  async recall(query: string): Promise<string> {
    const all = [
      ...this.memory.conventions,
      ...this.memory.decisions.map((d) => `${d.decision}: ${d.reason}`),
      ...this.memory.recentChanges.map(
        (c) => `Changed: ${c.summary} (${c.files.join(", ")})`
      ),
    ];
    const q = query.toLowerCase();
    const relevant = all.filter((item) => item.toLowerCase().includes(q));
    return relevant.length > 0
      ? relevant.slice(0, 5).join("\n")
      : "No relevant memory found.";
  }

  async getContext(): Promise<string> {
    return [
      `Tech Stack: ${this.memory.techStack.join(", ") || "unknown"}`,
      `Conventions: ${this.memory.conventions.slice(0, 5).join("; ") || "none"}`,
      `Recent changes: ${
        this.memory.recentChanges
          .slice(-3)
          .map((c) => c.summary)
          .join("; ") || "none"
      }`,
    ].join("\n");
  }

  async summarizeLastChanges(
    files: { path: string; content: string }[]
  ): Promise<string> {
    return `Updated ${files.length} file(s): ${files.map((f) => f.path).join(", ")}`;
  }

  async updateAfterBuild(patches: unknown[], result: unknown): Promise<void> {
    const patchList = patches as Array<{ path?: string }>;
    const files = patchList.map((p) => p.path ?? "unknown");
    const success = (result as { success?: boolean })?.success ?? false;
    await this.remember("change", {
      summary: `Build ${success ? "succeeded" : "failed"} with ${patches.length} patch(es)`,
      files,
    });
  }
}
