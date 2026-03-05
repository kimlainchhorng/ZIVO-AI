// lib/ai/project-memory.ts — Persistent project memory for follow-up builds

import type { Blueprint } from './blueprint-generator';
import type { ArchitecturePlan } from './architecture-planner';
import type { ProjectManifest } from './manifest';
import type { GeneratedFile } from './schema';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Decision {
  key: string;
  value: string;
  reason: string;
  timestamp: string;
}

export interface ProjectMemory {
  projectId: string;
  prompt: string;
  blueprint: Blueprint;
  architecture: ArchitecturePlan;
  manifest: ProjectManifest;
  files: GeneratedFile[];
  decisions: Decision[];
  conversationHistory: Message[];
  techStack: string[];
  createdAt: string;
  updatedAt: string;
}

const MAX_CONTEXT_FILE_PATHS = 100;
const CHARS_PER_TOKEN_ESTIMATE = 4;

/** In-memory store (server-side) */
const memoryStore = new Map<string, ProjectMemory>();

/** Persistent project memory store — localStorage on client, in-memory on server */
export class ProjectMemoryStore {
  private readonly store: Map<string, ProjectMemory>;

  constructor() {
    this.store = memoryStore;
  }

  /** Persist a project memory entry */
  save(memory: ProjectMemory): void {
    this.store.set(memory.projectId, { ...memory, updatedAt: new Date().toISOString() });
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(`zivo-memory-${memory.projectId}`, JSON.stringify(memory));
      } catch {
        // localStorage may be unavailable or full
      }
    }
  }

  /** Load a project memory entry by projectId */
  load(projectId: string): ProjectMemory | null {
    if (this.store.has(projectId)) {
      return this.store.get(projectId) ?? null;
    }
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(`zivo-memory-${projectId}`);
        if (raw) {
          const parsed = JSON.parse(raw) as ProjectMemory;
          this.store.set(projectId, parsed);
          return parsed;
        }
      } catch {
        // JSON parse error or localStorage unavailable
      }
    }
    return null;
  }

  /** Apply a partial update to an existing memory entry */
  update(projectId: string, patch: Partial<ProjectMemory>): void {
    const existing = this.load(projectId);
    if (!existing) return;
    const updated: ProjectMemory = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    this.save(updated);
  }

  /** Add a generated file to a project memory */
  addFile(projectId: string, file: GeneratedFile): void {
    const memory = this.load(projectId);
    if (!memory) return;
    const idx = memory.files.findIndex((f) => f.path === file.path);
    if (idx >= 0) {
      memory.files[idx] = file;
    } else {
      memory.files.push(file);
    }
    this.save(memory);
  }

  /** Record a design decision */
  addDecision(projectId: string, decision: Decision): void {
    const memory = this.load(projectId);
    if (!memory) return;
    memory.decisions.push(decision);
    this.save(memory);
  }

  /** Add a conversation message */
  addMessage(projectId: string, message: Message): void {
    const memory = this.load(projectId);
    if (!memory) return;
    memory.conversationHistory.push(message);
    this.save(memory);
  }

  /**
   * Get a compact context string for use as LLM prompt context.
   * Truncates to approximately maxTokens tokens.
   */
  getContext(projectId: string, maxTokens = 2000): string {
    const memory = this.load(projectId);
    if (!memory) return '';

    const maxChars = maxTokens * CHARS_PER_TOKEN_ESTIMATE;
    const filePaths = memory.files
      .slice(0, MAX_CONTEXT_FILE_PATHS)
      .map((f) => `- ${f.path}`)
      .join('\n');

    const recentMessages = memory.conversationHistory
      .slice(-4)
      .map((m) => `${m.role}: ${m.content.slice(0, 200)}`)
      .join('\n');

    const context = [
      `Project: ${memory.prompt}`,
      `Tech stack: ${memory.techStack.join(', ')}`,
      `Files (${memory.files.length} total):\n${filePaths}`,
      recentMessages ? `Recent conversation:\n${recentMessages}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    return context.slice(0, maxChars);
  }
}

/** Singleton instance */
export const projectMemoryStore = new ProjectMemoryStore();
