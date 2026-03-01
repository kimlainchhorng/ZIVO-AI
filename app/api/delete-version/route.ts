import { NextResponse } from "next/server";
import { deleteVersion } from "../save-site/route";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = body?.id as string;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    deleteVersion(id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Delete failed" }, { status: 500 });
  }
}