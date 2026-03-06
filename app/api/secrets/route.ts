import { NextResponse } from "next/server";
import { secretsManager } from "../../../lib/secrets-manager";

export const runtime = "nodejs";

// GET /api/secrets — list secret names only (never values)
export async function GET() {
  return NextResponse.json({ secrets: secretsManager.list() });
}

// POST /api/secrets — set a secret
export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { name, value } = body as { name?: string; value?: string };

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (value === undefined || typeof value !== "string") {
      return NextResponse.json({ error: "value is required" }, { status: 400 });
    }
    if (!/^[A-Z0-9_]+$/i.test(name)) {
      return NextResponse.json({ error: "name must contain only alphanumeric characters and underscores" }, { status: 400 });
    }

    secretsManager.set(name, value);
    return NextResponse.json({ success: true, name });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/secrets?name=xxx
export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const name = url.searchParams.get("name");

  if (!name) {
    return NextResponse.json({ error: "name query parameter is required" }, { status: 400 });
  }

  const deleted = secretsManager.delete(name);
  if (!deleted) {
    return NextResponse.json({ error: `Secret '${name}' not found` }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
