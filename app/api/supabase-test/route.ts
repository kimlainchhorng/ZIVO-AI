import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const supabaseUrl: string = body?.supabaseUrl;
    const supabaseAnonKey: string = body?.supabaseAnonKey;

    if (!supabaseUrl || typeof supabaseUrl !== "string") {
      return NextResponse.json({ error: "Missing supabaseUrl" }, { status: 400 });
    }
    if (!supabaseAnonKey || typeof supabaseAnonKey !== "string") {
      return NextResponse.json({ error: "Missing supabaseAnonKey" }, { status: 400 });
    }

    // Validate the URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(supabaseUrl);
    } catch {
      return NextResponse.json({ error: "Invalid Supabase URL" }, { status: 400 });
    }

    // Ping the Supabase REST health endpoint to verify credentials
    const healthUrl = `${parsedUrl.origin}/rest/v1/`;
    const r = await fetch(healthUrl, {
      method: "GET",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });

    if (r.ok) {
      return NextResponse.json({ connected: true });
    }

    // 401/403 means the key is wrong, anything else means connectivity issue
    if (r.status === 401 || r.status === 403) {
      return NextResponse.json({ error: "Invalid Supabase anon key" }, { status: 401 });
    }

    return NextResponse.json({ error: `Supabase returned status ${r.status}` }, { status: 502 });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error)?.message || "Failed to connect to Supabase" }, { status: 500 });
  }
}
