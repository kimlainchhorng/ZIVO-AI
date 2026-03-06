import { NextResponse } from "next/server";
import { analyzePerformance } from "@/lib/ai/performance-analyzer";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    files?: { path: string; content: string }[];
    packageJson?: string;
  };
  const report = analyzePerformance(body.files ?? [], body.packageJson);
  return NextResponse.json(report);
}
