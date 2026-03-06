// lib/project-memory.ts — Persistent project context with per-project message/file history

import type { ProjectBlueprint } from "./ai/passes/pass1-plan";

// ── New unified ProjectMemory record (used by /api/projects and context-snapshot) ──

export interface ProjectMemory {
  projectId: string;
  prompt: string;
  blueprint: ProjectBlueprint | null;
  files: { path: string; content: string; sha256?: string }[];
  techStack: string[];
  envVars: string[];
  dbSchema: string | null;
  authProvider: "supabase" | "nextauth" | "clerk" | null;
  createdAt: string;
  updatedAt: string;
  iterationCount: number;
  conversationHistory: { role: "user" | "assistant"; content: string; timestamp: string }[];
}

// In-memory store (resets on server restart — use Supabase/Redis in production)
const memoryStore = new Map<string, ProjectMemory>();

export function createProject(projectId: string, prompt: string): ProjectMemory {
  const now = new Date().toISOString();
  const memory: ProjectMemory = {
    projectId,
    prompt,
    blueprint: null,
    files: [],
    techStack: [],
    envVars: [],
    dbSchema: null,
    authProvider: null,
    createdAt: now,
    updatedAt: now,
    iterationCount: 0,
    conversationHistory: [],
  };
  memoryStore.set(projectId, memory);
  return memory;
}

export function getProject(projectId: string): ProjectMemory | undefined {
  return memoryStore.get(projectId);
}

export function updateProject(projectId: string, updates: Partial<ProjectMemory>): ProjectMemory {
  const existing = memoryStore.get(projectId);
  if (!existing) throw new Error(`Project ${projectId} not found`);
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  memoryStore.set(projectId, updated);
  return updated;
}

export function addFiles(projectId: string, newFiles: { path: string; content: string }[]): void {
  const project = memoryStore.get(projectId);
  if (!project) return;

  // Merge: update existing files, add new ones
  const fileMap = new Map(project.files.map((f) => [f.path, f]));
  for (const file of newFiles) {
    fileMap.set(file.path, file);
  }
  project.files = Array.from(fileMap.values());
  project.updatedAt = new Date().toISOString();
  project.iterationCount += 1;
}

export function addConversationTurn(
  projectId: string,
  role: "user" | "assistant",
  content: string
): void {
  const project = memoryStore.get(projectId);
  if (!project) return;
  project.conversationHistory.push({ role, content, timestamp: new Date().toISOString() });
  // Keep last 20 turns
  if (project.conversationHistory.length > 20) {
    project.conversationHistory = project.conversationHistory.slice(-20);
  }
}

export function listProjects(): ProjectMemory[] {
  return Array.from(memoryStore.values());
}

export function deleteProject(projectId: string): boolean {
  return memoryStore.delete(projectId);
}

// ── Legacy per-project file/message store (preserved for backward compatibility) ──

export interface ProjectFile {
  path: string;
  content: string;
  addedAt: string;
}

export interface ProjectMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export interface ProjectState {
  projectId: string;
  files: ProjectFile[];
  messages: ProjectMessage[];
  createdAt: string;
  updatedAt: string;
}

const MAX_FILES_PER_PROJECT = 20;
const MAX_MESSAGES_PER_PROJECT = 50;

// Module-level in-memory store
const projectStore = new Map<string, ProjectState>();

function getOrCreate(projectId: string): ProjectState {
  if (!projectStore.has(projectId)) {
    const now = new Date().toISOString();
    projectStore.set(projectId, {
      projectId,
      files: [],
      messages: [],
      createdAt: now,
      updatedAt: now,
    });
  }
  return projectStore.get(projectId)!;
}

/** Manages per-project memory: files and conversation history. */
export class ProjectMemoryStore {
  /**
   * Adds or replaces a file in the project's memory.
   * Evicts the oldest file if the limit of 20 is reached.
   */
  addFile(projectId: string, file: { path: string; content: string }): void {
    const state = getOrCreate(projectId);
    const existing = state.files.findIndex((f) => f.path === file.path);
    if (existing !== -1) {
      state.files[existing] = { ...file, addedAt: new Date().toISOString() };
    } else {
      if (state.files.length >= MAX_FILES_PER_PROJECT) {
        state.files.shift(); // evict oldest
      }
      state.files.push({ ...file, addedAt: new Date().toISOString() });
    }
    state.updatedAt = new Date().toISOString();
  }

  /** Returns all files stored for the project. */
  getFiles(projectId: string): ProjectFile[] {
    return getOrCreate(projectId).files;
  }

  /**
   * Appends a message to the project's conversation history.
   * Evicts the oldest message if the limit of 50 is reached.
   */
  addMessage(projectId: string, message: { role: "user" | "assistant" | "system"; content: string }): void {
    const state = getOrCreate(projectId);
    if (state.messages.length >= MAX_MESSAGES_PER_PROJECT) {
      state.messages.shift();
    }
    state.messages.push({ ...message, timestamp: new Date().toISOString() });
    state.updatedAt = new Date().toISOString();
  }

  /** Returns all messages stored for the project. */
  getMessages(projectId: string): ProjectMessage[] {
    return getOrCreate(projectId).messages;
  }

  /**
   * Returns a brief text summary of the project's current context.
   */
  getSummary(projectId: string): string {
    const state = getOrCreate(projectId);
    const fileList = state.files.map((f) => f.path).join(", ") || "none";
    const msgCount = state.messages.length;
    return `Project ${projectId}: ${state.files.length} file(s) [${fileList}], ${msgCount} message(s) in history.`;
  }

  /** Clears all data for the given project. */
  clear(projectId: string): void {
    projectStore.delete(projectId);
  }

  /** Returns the raw project state for the given project ID. */
  getState(projectId: string): ProjectState {
    return getOrCreate(projectId);
  }

  /** Returns all project IDs in memory. */
  listProjectIds(): string[] {
    return Array.from(projectStore.keys());
  }
}

/** Default shared ProjectMemoryStore instance. */
export const projectMemory = new ProjectMemoryStore();

// ── Lightweight global context store (cross-prompt project settings) ──────────

export interface ProjectContext {
  framework: string;
  uiLibrary: string;
  database: string;
  theme: string;
  pages: string[];
  components: string[];
  colorPrimary: string;
  lastPrompt: string;
  updatedAt: number;
}

const DEFAULT_CONTEXT: ProjectContext = {
  framework: "Next.js",
  uiLibrary: "shadcn/ui",
  database: "Supabase",
  theme: "dark",
  pages: [],
  components: [],
  colorPrimary: "#6366f1",
  lastPrompt: "",
  updatedAt: 0,
};

// Server-side in-memory store
let _serverContext: ProjectContext = { ...DEFAULT_CONTEXT };

function _isClient(): boolean {
  return typeof window !== "undefined";
}

function _loadFromStorage(): ProjectContext {
  if (!_isClient()) return _serverContext;
  try {
    const raw = window.localStorage.getItem("zivo_project_context");
    if (!raw) return { ...DEFAULT_CONTEXT };
    return JSON.parse(raw) as ProjectContext;
  } catch {
    return { ...DEFAULT_CONTEXT };
  }
}

function _saveToStorage(ctx: ProjectContext): void {
  if (!_isClient()) {
    _serverContext = ctx;
    return;
  }
  try {
    window.localStorage.setItem("zivo_project_context", JSON.stringify(ctx));
  } catch {
    // ignore storage errors
  }
}

/** Returns the current project context. */
export function getMemory(): ProjectContext {
  if (_isClient()) return _loadFromStorage();
  return { ..._serverContext };
}

/** Merges partial updates into the current project context. */
export function updateMemory(partial: Partial<ProjectContext>): void {
  const current = getMemory();
  const updated: ProjectContext = {
    ...current,
    ...partial,
    updatedAt: Date.now(),
  };
  _saveToStorage(updated);
}

/** Resets the project context to defaults. */
export function clearMemory(): void {
  const cleared: ProjectContext = { ...DEFAULT_CONTEXT, updatedAt: Date.now() };
  _saveToStorage(cleared);
}

/**
 * Returns a formatted string suitable for injection into AI prompts,
 * summarizing the current project context.
 */
export function buildMemoryContext(): string {
  const ctx = getMemory();
  const parts: string[] = [
    `Framework: ${ctx.framework}`,
    `UI Library: ${ctx.uiLibrary}`,
    `Database: ${ctx.database}`,
    `Theme: ${ctx.theme}`,
    `Primary Color: ${ctx.colorPrimary}`,
  ];
  if (ctx.pages.length > 0) parts.push(`Pages: ${ctx.pages.join(", ")}`);
  if (ctx.components.length > 0) parts.push(`Components: ${ctx.components.join(", ")}`);
  if (ctx.lastPrompt) parts.push(`Last Prompt: ${ctx.lastPrompt.slice(0, 120)}${ctx.lastPrompt.length > 120 ? "…" : ""}`);
  return parts.join("\n");
}
