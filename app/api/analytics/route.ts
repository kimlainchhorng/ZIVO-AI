import { NextRequest, NextResponse } from "next/server";

function generateChartData(points: number): number[] {
  const data: number[] = [];
  let value = Math.floor(Math.random() * 5000) + 10000;
  for (let i = 0; i < points; i++) {
    value += Math.floor(Math.random() * 2000) - 800;
    data.push(Math.max(value, 1000));
  }
  return data;
}

const TOP_EVENTS = [
  "Page View",
  "Button Click",
  "Search Query",
  "API Call",
  "File Upload",
  "Login",
  "Signup",
  "Purchase",
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") ?? "30d";

  const multipliers: Record<string, number> = {
    "7d": 1,
    "30d": 4.3,
    "90d": 13,
    "1y": 52,
  };

  const m = multipliers[range] ?? 4.3;
  const points = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 52;

  return NextResponse.json({
    events: Math.floor(124300 * m),
    users: Math.floor(8420 * m),
    conversion: parseFloat((3.2 + Math.random() * 0.5).toFixed(1)),
    revenue: Math.floor(48200 * m),
    chartData: generateChartData(points),
    topEvents: TOP_EVENTS.map((name, i) => ({
      name,
      count: Math.floor((50000 - i * 5000) * m * (0.9 + Math.random() * 0.2)),
    })),
  });
}
