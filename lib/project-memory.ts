// lib/project-memory.ts — Persistent project context with per-project message/file history

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
export class ProjectMemory {
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
  listProjects(): string[] {
    return Array.from(projectStore.keys());
  }
}

/** Default shared ProjectMemory instance. */
export const projectMemory = new ProjectMemory();
