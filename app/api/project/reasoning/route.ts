import { NextResponse } from "next/server";
import {
  buildDefaultChain,
  createReasoningChain,
  getReasoningChain,
  listReasoningChains,
} from "@/lib/reasoning";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const chainId = searchParams.get("chainId");

    if (chainId) {
      const chain = getReasoningChain(chainId);
      if (!chain) {
        return NextResponse.json({ error: "Chain not found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, chain });
    }

    if (!projectId) {
      return NextResponse.json({ error: "projectId or chainId is required" }, { status: 400 });
    }

    const chains = listReasoningChains(projectId);
    return NextResponse.json({ ok: true, chains });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { projectId, goal, steps, useDefault } = body;

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }
    if (!goal || typeof goal !== "string") {
      return NextResponse.json({ error: "goal is required" }, { status: 400 });
    }

    const chain =
      useDefault || !steps
        ? buildDefaultChain(projectId, goal)
        : createReasoningChain(projectId, goal, steps);

    return NextResponse.json({ ok: true, chain });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
