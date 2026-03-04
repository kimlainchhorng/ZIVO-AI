import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ description: "Save and export theme CSS variables." });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { theme?: Record<string, string>; mode?: "dark" | "light" };
    const { theme = {}, mode = "dark" } = body;

    const cssLines = Object.entries(theme)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join("\n");

    const css = `/* Theme: ${mode} */\n:root {\n${cssLines}\n}`;

    return NextResponse.json({ success: true, mode, css });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
