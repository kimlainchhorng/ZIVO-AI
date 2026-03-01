import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const title = (body?.title || "Untitled") as string;
    const html = body?.html as string;

    if (!html || typeof html !== "string") {
      return NextResponse.json({ error: "Missing html" }, { status: 400 });
    }

    // TODO: Save to Supabase
    // For now, return success

    return NextResponse.json({ 
      ok: true, 
      item: { 
        id: Math.random().toString(36).slice(2), 
        title, 
        created_at: new Date().toISOString() 
      } 
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Save failed" },
      { status: 500 }
    );
  }
}