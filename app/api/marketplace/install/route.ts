import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { pluginId, userId } = body;

    if (!pluginId || typeof pluginId !== "string") {
      return NextResponse.json({ error: "Missing pluginId" }, { status: 400 });
    }
    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: "Plugin installed" });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
