const STORAGE_KEY = "zivo_analytics";

export interface AnalyticsData {
  totalBuilds: number;
  modelUsage: Record<string, number>;
  generationTimes: number[];
  lastUpdated: string;
}

function getDefault(): AnalyticsData {
  return {
    totalBuilds: 0,
    modelUsage: {},
    generationTimes: [],
    lastUpdated: new Date().toISOString(),
  };
}

export function getAnalytics(): AnalyticsData {
  if (typeof window === "undefined") return getDefault();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AnalyticsData) : getDefault();
  } catch {
    return getDefault();
  }
}

export function recordBuild(model: string, durationMs: number): void {
  if (typeof window === "undefined") return;
  const data = getAnalytics();
  data.totalBuilds += 1;
  data.modelUsage[model] = (data.modelUsage[model] ?? 0) + 1;
  data.generationTimes.push(durationMs);
  // Keep only last 100 generation times
  if (data.generationTimes.length > 100) {
    data.generationTimes = data.generationTimes.slice(-100);
  }
  data.lastUpdated = new Date().toISOString();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage quota exceeded — ignore
  }
}

export function getAverageGenerationTime(data: AnalyticsData): number {
  if (data.generationTimes.length === 0) return 0;
  const sum = data.generationTimes.reduce((a, b) => a + b, 0);
  return Math.round(sum / data.generationTimes.length);
}

export function clearAnalytics(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
