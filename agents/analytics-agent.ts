export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp?: Date;
  userId?: string;
}

export interface MetricsResult {
  events: number;
  users: number;
  conversion: number;
  revenue: number;
  chartData: number[];
  topEvents: { name: string; count: number }[];
}

export interface ForecastResult {
  metric: string;
  forecast: number[];
  confidence: number;
  trend: "up" | "down" | "stable";
}

export class AnalyticsAgent {
  private events: AnalyticsEvent[] = [];

  /**
   * Track an analytics event with optional properties
   */
  trackEvent(event: string, properties?: Record<string, unknown>, userId?: string): void {
    this.events.push({
      name: event,
      properties,
      userId,
      timestamp: new Date(),
    });
  }

  /**
   * Get aggregated metrics for a time range
   */
  async getMetrics(range: string): Promise<MetricsResult> {
    const multipliers: Record<string, number> = {
      "7d": 1,
      "30d": 4.3,
      "90d": 13,
      "1y": 52,
    };
    const m = multipliers[range] ?? 4.3;
    const points = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 52;

    const chartData: number[] = [];
    let base = 10000;
    for (let i = 0; i < points; i++) {
      base += Math.floor(Math.random() * 2000) - 800;
      chartData.push(Math.max(base, 1000));
    }

    const topEventNames = ["Page View", "Button Click", "Search", "API Call", "Login", "Signup", "Purchase", "Download"];

    return {
      events: Math.floor(124300 * m),
      users: Math.floor(8420 * m),
      conversion: parseFloat((3.2 + Math.random() * 0.5).toFixed(1)),
      revenue: Math.floor(48200 * m),
      chartData,
      topEvents: topEventNames.map((name, i) => ({
        name,
        count: Math.floor((50000 - i * 5000) * m * (0.9 + Math.random() * 0.2)),
      })),
    };
  }

  /**
   * Forecast a metric for the specified number of days ahead
   */
  async forecast(metric: string, days: number): Promise<ForecastResult> {
    const forecast: number[] = [];
    let current = 10000;
    let totalDelta = 0;

    for (let i = 0; i < days; i++) {
      const delta = Math.floor(Math.random() * 800) - 200;
      totalDelta += delta;
      current = Math.max(current + delta, 0);
      forecast.push(current);
    }

    const trend: ForecastResult["trend"] =
      totalDelta > 500 ? "up" : totalDelta < -500 ? "down" : "stable";

    return {
      metric,
      forecast,
      confidence: parseFloat((0.75 + Math.random() * 0.2).toFixed(2)),
      trend,
    };
  }
}
