import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    generationCount: 1284,
    successRate: 97.3,
    totalCost: 42.18,
    avgGenerationTime: 3.2,
    apiUsage: [
      { date: "2025-07-01", calls: 148, tokens: 210400, cost: 5.26 },
      { date: "2025-07-02", calls: 172, tokens: 244800, cost: 6.12 },
      { date: "2025-07-03", calls: 139, tokens: 198200, cost: 4.96 },
      { date: "2025-07-04", calls: 95,  tokens: 135100, cost: 3.38 },
      { date: "2025-07-05", calls: 201, tokens: 286400, cost: 7.16 },
      { date: "2025-07-06", calls: 188, tokens: 267900, cost: 6.70 },
      { date: "2025-07-07", calls: 167, tokens: 237800, cost: 5.94 },
    ],
    trends: [
      { week: "Week 1", generations: 342, avgTime: 3.5, successRate: 96.2 },
      { week: "Week 2", generations: 418, avgTime: 3.3, successRate: 97.1 },
      { week: "Week 3", generations: 524, avgTime: 3.1, successRate: 97.8 },
    ],
  });
}
