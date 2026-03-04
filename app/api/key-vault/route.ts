import { NextResponse } from "next/server";

export const runtime = "nodejs";

// NOTE: This is an in-memory mock for demonstration purposes only.
// Production use requires per-user isolation and a real secrets backend.
const mockVault: Record<string, string> = {};

export async function GET() {
  return NextResponse.json({
    description:
      "Key Vault management API. POST { action: string, keyName: string, value?: string } — actions: get, set, delete, list",
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "";
    const keyName = typeof body.keyName === "string" ? body.keyName : "";
    const value = typeof body.value === "string" ? body.value : undefined;

    if (!action) {
      return NextResponse.json({ error: "action is required" }, { status: 400 });
    }

    switch (action) {
      case "set": {
        if (!keyName) return NextResponse.json({ error: "keyName is required" }, { status: 400 });
        if (value === undefined)
          return NextResponse.json({ error: "value is required for set" }, { status: 400 });
        mockVault[keyName] = value;
        return NextResponse.json({ success: true, keyName, action: "set" });
      }
      case "get": {
        if (!keyName) return NextResponse.json({ error: "keyName is required" }, { status: 400 });
        if (!(keyName in mockVault))
          return NextResponse.json({ error: "Key not found" }, { status: 404 });
        return NextResponse.json({ keyName, value: mockVault[keyName] });
      }
      case "delete": {
        if (!keyName) return NextResponse.json({ error: "keyName is required" }, { status: 400 });
        if (!(keyName in mockVault))
          return NextResponse.json({ error: "Key not found" }, { status: 404 });
        delete mockVault[keyName];
        return NextResponse.json({ success: true, keyName, action: "delete" });
      }
      case "list": {
        return NextResponse.json({ keys: Object.keys(mockVault) });
      }
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid: get, set, delete, list` },
          { status: 400 }
        );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
