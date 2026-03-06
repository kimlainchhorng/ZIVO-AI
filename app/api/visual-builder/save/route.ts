import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ description: "Save visual builder state (components + layout)." });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { components?: unknown[]; layout?: unknown };
    const { components = [], layout = {} } = body;
    return NextResponse.json({ success: true, saved: { componentCount: (components as unknown[]).length, layout } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
