import OpenAI from "openai";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AIClientOptions {
  apiKey?: string;
  maxCallsPerMinute?: number;
}

export interface CostEstimate {
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
}

export class TooManyRequestsError extends Error {
  constructor(message = "Rate limit exceeded") {
    super(message);
    this.name = "TooManyRequestsError";
  }
}

// ─── Cache ────────────────────────────────────────────────────────────────────

interface CacheEntry {
  response: string;
  expiresAt: number;
}

const responseCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function getCacheKey(model: string, messages: OpenAI.ChatCompletionMessageParam[]): string {
  return `${model}::${JSON.stringify(messages)}`;
}

function getCached(key: string): string | null {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    responseCache.delete(key);
    return null;
  }
  return entry.response;
}

function setCache(key: string, response: string): void {
  responseCache.set(key, { response, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ─── Rate limiting ─────────────────────────────────────────────────────────────

const callTimestamps: number[] = [];

function checkRateLimit(maxCallsPerMinute: number): void {
  const now = Date.now();
  const oneMinuteAgo = now - 60_000;
  // Remove timestamps older than 1 minute
  while (callTimestamps.length > 0 && callTimestamps[0] < oneMinuteAgo) {
    callTimestamps.shift();
  }
  if (callTimestamps.length >= maxCallsPerMinute) {
    throw new TooManyRequestsError(
      `Rate limit: ${maxCallsPerMinute} calls/min exceeded`
    );
  }
  callTimestamps.push(now);
}

// ─── Cost estimation ───────────────────────────────────────────────────────────

// Approximate pricing per 1k tokens (USD) — update as pricing changes
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o":           { input: 0.0025, output: 0.01 },
  "gpt-4o-mini":      { input: 0.00015, output: 0.0006 },
  "o1-mini":          { input: 0.003, output: 0.012 },
  "o3":               { input: 0.015, output: 0.06 },
  "gpt-4.1":          { input: 0.002, output: 0.008 },
  "gpt-4.1-mini":     { input: 0.0004, output: 0.0016 },
};

export function estimateCost(
  model: string,
  inputText: string,
  maxOutputTokens: number
): CostEstimate {
  const inputTokens = Math.ceil(inputText.length / 4);
  const outputTokens = maxOutputTokens;
  const pricing = MODEL_PRICING[model] ?? { input: 0.002, output: 0.008 };
  const estimatedCostUsd =
    (inputTokens / 1000) * pricing.input +
    (outputTokens / 1000) * pricing.output;
  return { inputTokens, outputTokens, estimatedCostUsd };
}

// ─── Retry wrapper ─────────────────────────────────────────────────────────────

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function createWithRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  fallback?: () => Promise<T>
): Promise<T> {
  let lastError: unknown;
  const delays = [1000, 2000, 4000];
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const status = (err as { status?: number })?.status;
      // On rate limit with a fallback, try fallback immediately
      if (status === 429 && fallback && i === 0) {
        try {
          return await fallback();
        } catch {
          // fallback also failed, continue retrying original
        }
      }
      if (i < attempts - 1) {
        await sleep(delays[i] ?? 4000);
      }
    }
  }
  throw lastError;
}

// ─── Main client factory ───────────────────────────────────────────────────────

export function createAIClient(options: AIClientOptions = {}): {
  client: OpenAI;
  complete: (
    params: OpenAI.ChatCompletionCreateParamsNonStreaming,
    useCache?: boolean
  ) => Promise<string>;
} {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY ?? "";
  const maxCallsPerMinute = options.maxCallsPerMinute ?? 60;
  const client = new OpenAI({ apiKey });

  async function complete(
    params: OpenAI.ChatCompletionCreateParamsNonStreaming,
    useCache = false
  ): Promise<string> {
    checkRateLimit(maxCallsPerMinute);

    const cacheKey = useCache ? getCacheKey(params.model, params.messages) : "";
    if (useCache) {
      const cached = getCached(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    const primaryModel = params.model;
    const fallbackModel = primaryModel.startsWith("gpt-4o") ? "gpt-4o-mini" : undefined;

    const cost = estimateCost(
      params.model,
      params.messages.map((m) => (typeof m.content === "string" ? m.content : "")).join(" "),
      (params.max_tokens as number | undefined) ?? 4096
    );
    console.log(
      `[ai-client] ${params.model} — est. $${cost.estimatedCostUsd.toFixed(4)} (~${cost.inputTokens} in / ${cost.outputTokens} out tokens)`
    );

    const result = await createWithRetry(
      () => client.chat.completions.create(params),
      3,
      fallbackModel
        ? () => client.chat.completions.create({ ...params, model: fallbackModel })
        : undefined
    );

    const text = result.choices[0]?.message?.content ?? "";

    if (useCache) {
      setCache(cacheKey, text);
    }

    return text;
  }

  return { client, complete };
}
