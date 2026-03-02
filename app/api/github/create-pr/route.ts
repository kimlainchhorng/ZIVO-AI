import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { token, owner, repo, title, body: prBody, head, base = "main" } = body;

    if (!token) return NextResponse.json({ error: "GitHub token required" }, { status: 401 });
    if (!owner || !repo || !title || !head) {
      return NextResponse.json({ error: "owner, repo, title, and head are required" }, { status: 400 });
    }

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
      method: "POST",
      headers: { Authorization: `token ${token}`, Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" },
      body: JSON.stringify({ title, body: prBody || "", head, base }),
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err?.message || "PR creation failed" }, { status: res.status });
    }

    const pr = await res.json();
    return NextResponse.json({ ok: true, number: pr.number, url: pr.html_url, title: pr.title });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "PR creation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
