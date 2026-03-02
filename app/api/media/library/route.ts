import { NextResponse } from "next/server";
import { listMedia, getStorageStats, type MediaType, type MediaCategory } from "@/lib/media-store";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as MediaType | null;
    const category = searchParams.get("category") as MediaCategory | null;
    const projectId = searchParams.get("projectId") ?? undefined;

    const items = listMedia({
      ...(type ? { type } : {}),
      ...(category ? { category } : {}),
      ...(projectId ? { projectId } : {}),
    });

    const stats = getStorageStats();

    return NextResponse.json({ items, stats });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
