import { NextResponse } from "next/server";
import { executeToolCall, TOOLS } from "@/lib/tools";

export const runtime = "nodejs";

export async function GET() {
  const tools = Object.values(TOOLS).map((t) => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters,
  }));
  return NextResponse.json({ ok: true, tools });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, arguments: args = {}, id } = body as {
      name?: string;
      arguments?: Record<string, unknown>;
      id?: string;
    };

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Tool name is required" }, { status: 400 });
    }

    if (!TOOLS[name]) {
      return NextResponse.json(
        { error: `Unknown tool: ${name}. Available: ${Object.keys(TOOLS).join(", ")}` },
        { status: 400 }
      );
    }

    const toolCallId = id ?? `manual-${Date.now()}`;
    const result = await executeToolCall({ id: toolCallId, name, arguments: args });

    return NextResponse.json({
      ok: !result.error,
      toolCallId,
      result: result.result,
      error: result.error,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Tool execution error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
