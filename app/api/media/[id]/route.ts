import { NextResponse } from "next/server";
import { getMedia, deleteMedia } from "@/lib/media-store";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = getMedia(id);
    if (!item) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = deleteMedia(id);
    if (!deleted) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
