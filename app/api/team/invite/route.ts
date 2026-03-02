import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { teamId, email, role } = body;

    if (!teamId || typeof teamId !== "string") {
      return NextResponse.json({ error: "Missing teamId" }, { status: 400 });
    }
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }
    if (!role || !["admin", "developer", "viewer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      inviteId: `invite-${Date.now()}`,
      message: `Invitation sent to ${email}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
