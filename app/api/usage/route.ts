import { NextResponse } from "next/server";
import {
  getUsageStats,
  getTotalCost,
  getCheapestModel,
  getBestModel,
  type ModelUsageStats,
} from "@/lib/ai/model-router";

export const runtime = "nodejs";

const TASK_TYPES = ["code", "suggestions", "architecture", "image"] as const;

// NOTE: requestsPerDay is mock data. Replace with real request-count storage.
function buildRequestsPerDay(): { date: string; count: number }[] {
  const days: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toISOString().slice(0, 10),
      count: Math.floor(Math.random() * 120 + 20),
    });
  }
  return days;
}

export async function GET(): Promise<Response> {
  const stats: ModelUsageStats[] = getUsageStats();
  const totalCost = getTotalCost();
  const totalTokens = stats.reduce((sum, s) => sum + s.totalTokens, 0);

  const modelRecommendations = TASK_TYPES.map((task) => ({
    task,
    recommended: getBestModel(task),
    cheapest: getCheapestModel(task),
  }));

  return NextResponse.json({
    totalTokens,
    totalCost,
    byModel: stats,
    requestsPerDay: buildRequestsPerDay(),
    modelRecommendations,
  });
}
