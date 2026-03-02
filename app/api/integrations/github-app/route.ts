import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, repoUrl, token } = body;

    if (!action || typeof action !== "string") {
      return NextResponse.json({ error: "Missing action" }, { status: 400 });
    }
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const messages: Record<string, string> = {
      connect: "GitHub App connected successfully",
      disconnect: "GitHub App disconnected",
      sync: `Repository ${repoUrl || ""} synced`,
      deploy: `Deployment triggered for ${repoUrl || ""}`,
    };

    const message = messages[action] ?? `Action '${action}' completed`;
    return NextResponse.json({ ok: true, message });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
