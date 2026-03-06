import { NextResponse } from "next/server";
import { FEATURE_FLAGS, setFlag } from "@/lib/feature-flags";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ flags: FEATURE_FLAGS });
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({})) as { flagId?: string; enabled?: boolean };
  const { flagId, enabled } = body;
  if (!flagId || typeof enabled !== "boolean") {
    return NextResponse.json({ error: "flagId and enabled required" }, { status: 400 });
  }
  const flag = FEATURE_FLAGS.find((f) => f.id === flagId);
  if (!flag) return NextResponse.json({ error: "Flag not found" }, { status: 404 });
  setFlag(flagId, enabled);
  return NextResponse.json({ flagId, enabled });
}
