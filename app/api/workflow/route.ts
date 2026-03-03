import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Step =
  | { type: "chat"; prompt: string }
  | { type: "image"; prompt: string; size?: string };

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const steps: Step[] = body?.steps;

    if (!Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json({ error: "Missing steps[]" }, { status: 400 });
    }

    const results: any[] = [];

    for (const step of steps) {
      if (step?.type === "chat") {
        const r = await fetch(new URL("/api/chat", req.url), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: step.prompt }),
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) return NextResponse.json({ error: data?.error || "Chat step failed" }, { status: 500 });
        results.push({ type: "chat", result: data.result });
      } else if (step?.type === "image") {
        const r = await fetch(new URL("/api/image", req.url), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: step.prompt, size: step.size }),
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) return NextResponse.json({ error: data?.error || "Image step failed" }, { status: 500 });
        results.push({ type: "image", ...data });
      } else {
        return NextResponse.json({ error: "Unknown step type" }, { status: 400 });
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}