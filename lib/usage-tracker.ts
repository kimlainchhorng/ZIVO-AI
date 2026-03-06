// lib/usage-tracker.ts — API usage and cost tracking

export interface UsageEvent {
  endpoint: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  timestamp: string;
}

export interface EndpointStats {
  endpoint: string;
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  lastCalledAt: string;
}

export interface UsageSummary {
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  byModel: Record<string, { calls: number; costUsd: number }>;
  since: string;
}

// In-memory store — resets on server restart
const events: UsageEvent[] = [];

/**
 * Records a usage event.
 */
export function track(event: Omit<UsageEvent, "timestamp">): void {
  events.push({ ...event, timestamp: new Date().toISOString() });
  // Keep last 10,000 events — evict oldest one at a time to avoid O(n) splice
  if (events.length > 10_000) {
    events.shift();
  }
}

/**
 * Returns a summary of all tracked usage.
 */
export function getSummary(): UsageSummary {
  const byModel: Record<string, { calls: number; costUsd: number }> = {};

  let totalCalls = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCostUsd = 0;

  for (const e of events) {
    totalCalls++;
    totalInputTokens += e.inputTokens;
    totalOutputTokens += e.outputTokens;
    totalCostUsd += e.costUsd;

    if (!byModel[e.model]) {
      byModel[e.model] = { calls: 0, costUsd: 0 };
    }
    byModel[e.model].calls++;
    byModel[e.model].costUsd += e.costUsd;
  }

  return {
    totalCalls,
    totalInputTokens,
    totalOutputTokens,
    totalCostUsd,
    byModel,
    since: events[0]?.timestamp ?? new Date().toISOString(),
  };
}

/**
 * Returns usage statistics grouped by endpoint.
 */
export function getByEndpoint(): Record<string, EndpointStats> {
  const result: Record<string, EndpointStats> = {};

  for (const e of events) {
    if (!result[e.endpoint]) {
      result[e.endpoint] = {
        endpoint: e.endpoint,
        totalCalls: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCostUsd: 0,
        lastCalledAt: e.timestamp,
      };
    }
    const s = result[e.endpoint];
    s.totalCalls++;
    s.totalInputTokens += e.inputTokens;
    s.totalOutputTokens += e.outputTokens;
    s.totalCostUsd += e.costUsd;
    s.lastCalledAt = e.timestamp;
  }

  return result;
}

/**
 * Returns all raw usage events.
 */
export function getAllEvents(): UsageEvent[] {
  return [...events];
}
