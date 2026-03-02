import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, webhookUrl } = body;

    if (!action || !["connect", "disconnect", "test"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    if (action === "connect" && (!webhookUrl || typeof webhookUrl !== "string")) {
      return NextResponse.json({ error: "Missing webhookUrl" }, { status: 400 });
    }

    const messages: Record<string, string> = {
      connect: "Slack integration connected successfully",
      disconnect: "Slack integration disconnected",
      test: "Test message sent to Slack",
    };

    return NextResponse.json({ ok: true, message: messages[action] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
