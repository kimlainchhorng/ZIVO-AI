import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "GitHub OAuth not configured. Set GITHUB_CLIENT_ID in environment." }, { status: 503 });
  }
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  if (code) {
    try {
      const res = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, client_secret: process.env.GITHUB_CLIENT_SECRET, code }),
      });
      const data = await res.json();
      if (data.access_token) {
        return NextResponse.json({ ok: true, token: data.access_token });
      }
      return NextResponse.json({ error: "Token exchange failed", details: data }, { status: 400 });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "OAuth exchange failed";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo,user`;
  return NextResponse.json({ authUrl });
}
