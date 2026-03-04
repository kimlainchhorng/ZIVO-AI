// lib/model-router.ts — Model selection for AI tasks (lib-level entry point)

export type AITaskType =
  | "code-generation"
  | "code-fix"
  | "explanation"
  | "planning"
  | "embedding"
  | "fast-response";

export type BudgetLevel = "economy" | "balanced" | "premium";

export interface ModelCapability {
  model: string;
  contextWindow: number;
  inputPricePer1kTokens: number;
  outputPricePer1kTokens: number;
  supportsStreaming: boolean;
  supportsVision: boolean;
}

export interface ModelSelection {
  model: string;
  maxTokens: number;
  temperature: number;
  reasoning: string;
}

// ─── Model capabilities registry ─────────────────────────────────────────────

export const MODEL_CAPABILITIES: Record<string, ModelCapability> = {
  "gpt-4o": {
    model: "gpt-4o",
    contextWindow: 128_000,
    inputPricePer1kTokens: 0.005,
    outputPricePer1kTokens: 0.015,
    supportsStreaming: true,
    supportsVision: true,
  },
  "gpt-4o-mini": {
    model: "gpt-4o-mini",
    contextWindow: 128_000,
    inputPricePer1kTokens: 0.00015,
    outputPricePer1kTokens: 0.0006,
    supportsStreaming: true,
    supportsVision: true,
  },
  "o1-mini": {
    model: "o1-mini",
    contextWindow: 128_000,
    inputPricePer1kTokens: 0.003,
    outputPricePer1kTokens: 0.012,
    supportsStreaming: false,
    supportsVision: false,
  },
  "text-embedding-3-small": {
    model: "text-embedding-3-small",
    contextWindow: 8_191,
    inputPricePer1kTokens: 0.00002,
    outputPricePer1kTokens: 0,
    supportsStreaming: false,
    supportsVision: false,
  },
};

// ─── Routing table ────────────────────────────────────────────────────────────

type BudgetMap = Record<BudgetLevel, { model: string; maxTokens: number; temperature: number; reasoning: string }>;
const ROUTING_TABLE: Record<AITaskType, BudgetMap> = {
  "code-generation": {
    economy: { model: "gpt-4o-mini", maxTokens: 4096, temperature: 0.2, reasoning: "Economy model: fast and cheap for straightforward code gen" },
    balanced: { model: "gpt-4o", maxTokens: 8192, temperature: 0.2, reasoning: "Balanced: high quality code generation with good cost" },
    premium: { model: "gpt-4o", maxTokens: 16384, temperature: 0.1, reasoning: "Premium: maximum context for complex codebases" },
  },
  "code-fix": {
    economy: { model: "gpt-4o-mini", maxTokens: 2048, temperature: 0.1, reasoning: "Economy: fast fixes for simple issues" },
    balanced: { model: "gpt-4o", maxTokens: 4096, temperature: 0.1, reasoning: "Balanced: reliable error correction" },
    premium: { model: "gpt-4o", maxTokens: 8192, temperature: 0.05, reasoning: "Premium: deterministic fixes for complex issues" },
  },
  "explanation": {
    economy: { model: "gpt-4o-mini", maxTokens: 1024, temperature: 0.7, reasoning: "Economy: concise explanations" },
    balanced: { model: "gpt-4o-mini", maxTokens: 2048, temperature: 0.5, reasoning: "Balanced: clear and detailed explanations" },
    premium: { model: "gpt-4o", maxTokens: 4096, temperature: 0.3, reasoning: "Premium: comprehensive in-depth explanations" },
  },
  "planning": {
    economy: { model: "gpt-4o-mini", maxTokens: 2048, temperature: 0.4, reasoning: "Economy: quick project outlines" },
    balanced: { model: "gpt-4o", maxTokens: 4096, temperature: 0.3, reasoning: "Balanced: thoughtful architecture planning" },
    premium: { model: "o1-mini", maxTokens: 8192, temperature: 1, reasoning: "Premium: deep reasoning for complex system design" },
  },
  "embedding": {
    economy: { model: "text-embedding-3-small", maxTokens: 8191, temperature: 0, reasoning: "Only embedding model available" },
    balanced: { model: "text-embedding-3-small", maxTokens: 8191, temperature: 0, reasoning: "Only embedding model available" },
    premium: { model: "text-embedding-3-small", maxTokens: 8191, temperature: 0, reasoning: "Only embedding model available" },
  },
  "fast-response": {
    economy: { model: "gpt-4o-mini", maxTokens: 512, temperature: 0.7, reasoning: "Economy: fastest response" },
    balanced: { model: "gpt-4o-mini", maxTokens: 1024, temperature: 0.5, reasoning: "Balanced: fast with good quality" },
    premium: { model: "gpt-4o", maxTokens: 2048, temperature: 0.5, reasoning: "Premium: fast and high quality" },
  },
};

/**
 * Selects the best model for a given task type and budget level.
 */
export function selectModel(task: AITaskType, budget: BudgetLevel = "balanced"): ModelSelection {
  return ROUTING_TABLE[task][budget];
}

/**
 * Returns the model capabilities registry.
 */
export function getModelCapabilities(): Record<string, ModelCapability> {
  return MODEL_CAPABILITIES;
}
