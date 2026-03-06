// Model routing logic for ZIVO-AI — maps task types to ordered model fallback chains.

export type TaskType = "code" | "suggestions" | "architecture" | "image";
export type ModelProvider = "openai" | "anthropic" | "google" | "meta";

export interface ModelConfig {
  id: string;
  name: string;
  provider: ModelProvider;
  costPer1kTokens: number;
  speed: "fast" | "medium" | "slow";
  quality: "high" | "medium" | "economy";
}

export const SUPPORTED_MODELS: Record<string, ModelConfig> = {
  "gpt-4o": {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    costPer1kTokens: 0.005,
    speed: "medium",
    quality: "high",
  },
  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    costPer1kTokens: 0.00015,
    speed: "fast",
    quality: "economy",
  },
  "o1-mini": {
    id: "o1-mini",
    name: "o1-mini",
    provider: "openai",
    costPer1kTokens: 0.003,
    speed: "slow",
    quality: "high",
  },
  "claude-3-5-sonnet": {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    costPer1kTokens: 0.003,
    speed: "medium",
    quality: "high",
  },
  "claude-3-haiku": {
    id: "claude-3-haiku",
    name: "Claude 3 Haiku",
    provider: "anthropic",
    costPer1kTokens: 0.00025,
    speed: "fast",
    quality: "economy",
  },
  "gemini-1-5-pro": {
    id: "gemini-1-5-pro",
    name: "Gemini 1.5 Pro",
    provider: "google",
    costPer1kTokens: 0.00125,
    speed: "medium",
    quality: "high",
  },
  "gemini-flash": {
    id: "gemini-flash",
    name: "Gemini Flash",
    provider: "google",
    costPer1kTokens: 0.000075,
    speed: "fast",
    quality: "medium",
  },
  "gemini-1.5-pro": {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "google",
    costPer1kTokens: 0.00125,
    speed: "medium",
    quality: "high",
  },
  "gemini-1.5-flash": {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    provider: "google",
    costPer1kTokens: 0.000075,
    speed: "fast",
    quality: "economy",
  },
  "llama-3": {
    id: "llama-3",
    name: "Llama 3",
    provider: "meta",
    costPer1kTokens: 0.0002,
    speed: "fast",
    quality: "medium",
  },
};

export const MODEL_ROUTING: Record<TaskType, string[]> = {
  code: ["gpt-4o", "claude-3-5-sonnet", "gemini-1-5-pro", "o1-mini"],
  suggestions: ["gpt-4o-mini", "gemini-flash", "claude-3-haiku", "llama-3"],
  architecture: ["o1-mini", "gpt-4o", "claude-3-5-sonnet", "gemini-1-5-pro"],
  image: ["gpt-4o", "gemini-1-5-pro", "claude-3-5-sonnet"],
};

export function getModelForTask(task: TaskType, preferredModel?: string): ModelConfig {
  const chain = MODEL_ROUTING[task];
  // Only honour the preferred model if it is supported AND valid for this task.
  if (preferredModel && chain.includes(preferredModel) && preferredModel in SUPPORTED_MODELS) {
    return SUPPORTED_MODELS[preferredModel];
  }
  return SUPPORTED_MODELS[chain[0]];
}

export function routeRequest(
  task: TaskType,
  preferredModel?: string
): { model: ModelConfig; fallbackChain: ModelConfig[] } {
  const model = getModelForTask(task, preferredModel);
  const fallbackChain = MODEL_ROUTING[task]
    .filter((id) => id !== model.id)
    .map((id) => SUPPORTED_MODELS[id]);
  return { model, fallbackChain };
}

export function trackUsage(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): { inputTokens: number; outputTokens: number; cost: number; modelId: string } {
  const config = SUPPORTED_MODELS[modelId];
  const rate = config?.costPer1kTokens ?? 0;
  const cost = ((inputTokens + outputTokens) / 1000) * rate;
  return { inputTokens, outputTokens, cost, modelId };
}

export interface ModelUsageStats {
  modelId: string;
  calls: number;
  totalTokens: number;
  totalCost: number;
  lastUsed: Date;
}

// NOTE: usageStore is in-memory and resets on server restart.
// For production persistence, replace with a database-backed store.
const usageStore = new Map<string, ModelUsageStats>();

export function recordUsage(modelId: string, tokens: number): void {
  const config = SUPPORTED_MODELS[modelId];
  const rate = config?.costPer1kTokens ?? 0;
  const cost = (tokens / 1000) * rate;
  const existing = usageStore.get(modelId);
  if (existing) {
    existing.calls += 1;
    existing.totalTokens += tokens;
    existing.totalCost += cost;
    existing.lastUsed = new Date();
  } else {
    usageStore.set(modelId, {
      modelId,
      calls: 1,
      totalTokens: tokens,
      totalCost: cost,
      lastUsed: new Date(),
    });
  }
}

export function getUsageStats(): ModelUsageStats[] {
  return Array.from(usageStore.values()).sort((a, b) => b.totalCost - a.totalCost);
}

export function getTotalCost(): number {
  return Array.from(usageStore.values()).reduce((sum, s) => sum + s.totalCost, 0);
}

export function getCheapestModel(task: TaskType): string {
  const chain = MODEL_ROUTING[task];
  return chain.reduce((cheapest, id) => {
    const cost = SUPPORTED_MODELS[id]?.costPer1kTokens ?? Infinity;
    const cheapestCost = SUPPORTED_MODELS[cheapest]?.costPer1kTokens ?? Infinity;
    return cost < cheapestCost ? id : cheapest;
  });
}

export function getBestModel(task: TaskType): string {
  return MODEL_ROUTING[task][0];
}
