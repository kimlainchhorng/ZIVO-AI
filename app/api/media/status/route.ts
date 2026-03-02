import { NextResponse } from "next/server";
import { getMedia } from "@/lib/media-store";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    const item = getMedia(id);
    if (!item) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const videoStatus = item.metadata?.status ?? "completed";
    const status = item.type === "video" ? videoStatus : "completed";

    return NextResponse.json({
      id,
      type: item.type,
      status,
      url: item.url || undefined,
      createdAt: item.createdAt,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
