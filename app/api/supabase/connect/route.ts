import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { url, anonKey } = body;

    if (!url || !anonKey) {
      return NextResponse.json({ error: "Supabase URL and anon key are required" }, { status: 400 });
    }

    // Validate connection by calling Supabase health endpoint
    try {
      const res = await fetch(`${url}/rest/v1/`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      });
      if (res.ok || res.status === 404) {
        return NextResponse.json({ ok: true, message: "Connected to Supabase successfully", url });
      }
      return NextResponse.json({ error: "Failed to connect to Supabase", status: res.status }, { status: 400 });
    } catch {
      return NextResponse.json({ error: "Could not reach Supabase instance" }, { status: 400 });
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Connection failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
