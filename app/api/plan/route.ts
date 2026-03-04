// POST { prompt: string; model?: string }
// Returns ProjectPlan JSON
import { NextResponse } from "next/server";
import { createProjectPlan } from "@/lib/ai/project-planner";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({})) as { prompt?: string; model?: string };
    const { prompt, model } = body;
    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }
    const plan = await createProjectPlan(prompt, model);
    return NextResponse.json(plan);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error)?.message ?? "Server error" }, { status: 500 });
  }
}
