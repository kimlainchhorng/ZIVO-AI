import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { token, owner, repo, path: filePath, content, message, branch = "main" } = body;

    if (!token) return NextResponse.json({ error: "GitHub token required" }, { status: 401 });
    if (!owner || !repo || !filePath || !content) {
      return NextResponse.json({ error: "owner, repo, path, and content are required" }, { status: 400 });
    }

    // Get current file SHA if it exists
    const fileRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`, {
      headers: { Authorization: `token ${token}`, Accept: "application/vnd.github.v3+json" },
    });
    const fileData = fileRes.ok ? await fileRes.json() : null;
    const sha = fileData?.sha;

    const encodedContent = Buffer.from(content).toString("base64");
    const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
      method: "PUT",
      headers: { Authorization: `token ${token}`, Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" },
      body: JSON.stringify({ message: message || "Update via ZIVO AI", content: encodedContent, branch, ...(sha ? { sha } : {}) }),
    });

    if (!commitRes.ok) {
      const err = await commitRes.json();
      return NextResponse.json({ error: err?.message || "Commit failed" }, { status: commitRes.status });
    }

    const result = await commitRes.json();
    return NextResponse.json({ ok: true, commit: result.commit?.sha, url: result.content?.html_url });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Commit failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
