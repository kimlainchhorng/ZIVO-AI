import { NextResponse } from "next/server";
import {
  SUPPORTED_MODELS,
  MODEL_ROUTING,
  routeRequest,
  type TaskType,
} from "@/lib/ai/model-router";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ models: SUPPORTED_MODELS, routing: MODEL_ROUTING });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { task?: TaskType; preferredModel?: string };
    const { task, preferredModel } = body;

    if (!task) {
      return NextResponse.json({ error: "Missing required field: task" }, { status: 400 });
    }

    const validTasks: TaskType[] = ["code", "suggestions", "architecture", "image"];
    if (!validTasks.includes(task)) {
      return NextResponse.json(
        { error: `Invalid task. Must be one of: ${validTasks.join(", ")}` },
        { status: 400 }
      );
    }

    const result = routeRequest(task, preferredModel);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
