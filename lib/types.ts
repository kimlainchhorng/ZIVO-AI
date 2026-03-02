// Core types for the multi-agent AI system

export type AgentRole =
  | "architect"
  | "ui"
  | "backend"
  | "database"
  | "security"
  | "performance"
  | "devops"
  | "code-review";

export interface AgentMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  result: unknown;
  error?: string;
}

export interface ReasoningStep {
  id: string;
  agentRole: AgentRole;
  thought: string;
  action?: ToolCall;
  result?: ToolResult;
  dependencies: string[];
  status: "pending" | "running" | "completed" | "failed";
  startedAt?: string;
  completedAt?: string;
}

export interface DependencyGraph {
  steps: ReasoningStep[];
}

export interface AgentResponse {
  agentRole: AgentRole;
  reasoning: string;
  output: Record<string, unknown>;
  toolCalls: ToolCall[];
  nextSteps?: string[];
}

export interface ProjectMemory {
  projectId: string;
  shortTerm: {
    recentMessages: AgentMessage[];
    activeAgents: AgentRole[];
    currentTask?: string;
  };
  longTerm: {
    architecture?: string;
    techStack?: string[];
    decisions: Array<{
      timestamp: string;
      agent: AgentRole;
      decision: string;
      rationale: string;
    }>;
    generatedFiles: Array<{
      path: string;
      type: string;
      description: string;
      lastModified: string;
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface JobStatus {
  jobId: string;
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  result?: unknown;
  error?: string;
  createdAt: string;
  updatedAt: string;
}
