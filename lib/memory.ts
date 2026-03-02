import type { ProjectMemory, AgentMessage, AgentRole } from "./types";

// In-memory store (per-process). In production, use a database like Supabase.
const memoryStore = new Map<string, ProjectMemory>();

export function getOrCreateMemory(projectId: string): ProjectMemory {
  if (!memoryStore.has(projectId)) {
    const now = new Date().toISOString();
    memoryStore.set(projectId, {
      projectId,
      shortTerm: {
        recentMessages: [],
        activeAgents: [],
      },
      longTerm: {
        decisions: [],
        generatedFiles: [],
      },
      createdAt: now,
      updatedAt: now,
    });
  }
  return memoryStore.get(projectId)!;
}

export function getMemory(projectId: string): ProjectMemory | null {
  return memoryStore.get(projectId) ?? null;
}

export function updateShortTerm(
  projectId: string,
  message: AgentMessage,
  agentRole?: AgentRole
): ProjectMemory {
  const memory = getOrCreateMemory(projectId);

  // Keep only the last 20 messages in short-term memory
  memory.shortTerm.recentMessages = [
    ...memory.shortTerm.recentMessages.slice(-19),
    message,
  ];

  if (agentRole && !memory.shortTerm.activeAgents.includes(agentRole)) {
    memory.shortTerm.activeAgents.push(agentRole);
  }

  memory.updatedAt = new Date().toISOString();
  return memory;
}

export function recordDecision(
  projectId: string,
  agent: AgentRole,
  decision: string,
  rationale: string
): void {
  const memory = getOrCreateMemory(projectId);
  memory.longTerm.decisions.push({
    timestamp: new Date().toISOString(),
    agent,
    decision,
    rationale,
  });
  memory.updatedAt = new Date().toISOString();
}

export function recordGeneratedFile(
  projectId: string,
  filePath: string,
  fileType: string,
  description: string
): void {
  const memory = getOrCreateMemory(projectId);
  const existing = memory.longTerm.generatedFiles.findIndex(
    (f) => f.path === filePath
  );
  const entry = {
    path: filePath,
    type: fileType,
    description,
    lastModified: new Date().toISOString(),
  };

  if (existing !== -1) {
    memory.longTerm.generatedFiles[existing] = entry;
  } else {
    memory.longTerm.generatedFiles.push(entry);
  }

  memory.updatedAt = new Date().toISOString();
}

export function setArchitecture(projectId: string, architecture: string, techStack: string[]): void {
  const memory = getOrCreateMemory(projectId);
  memory.longTerm.architecture = architecture;
  memory.longTerm.techStack = techStack;
  memory.updatedAt = new Date().toISOString();
}

export function setCurrentTask(projectId: string, task: string): void {
  const memory = getOrCreateMemory(projectId);
  memory.shortTerm.currentTask = task;
  memory.updatedAt = new Date().toISOString();
}

export function clearShortTerm(projectId: string): void {
  const memory = getOrCreateMemory(projectId);
  memory.shortTerm.recentMessages = [];
  memory.shortTerm.activeAgents = [];
  memory.shortTerm.currentTask = undefined;
  memory.updatedAt = new Date().toISOString();
}

export function listProjects(): string[] {
  return Array.from(memoryStore.keys());
}
