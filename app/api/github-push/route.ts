import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface PushFile {
  path: string;
  content: string;
}

async function ghFetch<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg =
      typeof data === "string"
        ? data
        : (data as { message?: string })?.message || "GitHub API error";
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }
  return data as T;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      token,
      repo,
      files,
      commitMessage = "feat: push from ZIVO AI builder",
      branch = "main",
    } = body as {
      token: string;
      repo: string;
      files: PushFile[];
      commitMessage?: string;
      branch?: string;
    };

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Missing or invalid token" }, { status: 400 });
    }
    if (!repo || typeof repo !== "string") {
      return NextResponse.json({ error: "Missing or invalid repo (expected owner/repo)" }, { status: 400 });
    }
    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: "Missing files array" }, { status: 400 });
    }

    const base = `https://api.github.com/repos/${repo}`;

    // 1. Get the current HEAD SHA for the branch
    const refData = await ghFetch<{ object: { sha: string } }>(
      `${base}/git/ref/heads/${encodeURIComponent(branch)}`,
      token
    );
    const headSha = refData.object.sha;

    // 2. Get the base tree SHA from the commit
    const commitData = await ghFetch<{ tree: { sha: string } }>(
      `${base}/git/commits/${headSha}`,
      token
    );
    const baseSha = commitData.tree.sha;

    // 3. Create blobs for each file
    const treeItems = await Promise.all(
      files.map(async (f) => {
        const blob = await ghFetch<{ sha: string }>(`${base}/git/blobs`, token, {
          method: "POST",
          body: JSON.stringify({
            content: Buffer.from(f.content, "utf8").toString("base64"),
            encoding: "base64",
          }),
        });
        return {
          path: f.path,
          mode: "100644" as const,
          type: "blob" as const,
          sha: blob.sha,
        };
      })
    );

    // 4. Create a new tree
    const treeData = await ghFetch<{ sha: string }>(`${base}/git/trees`, token, {
      method: "POST",
      body: JSON.stringify({ base_tree: baseSha, tree: treeItems }),
    });

    // 5. Create a commit
    const newCommit = await ghFetch<{ sha: string; html_url: string }>(
      `${base}/git/commits`,
      token,
      {
        method: "POST",
        body: JSON.stringify({
          message: commitMessage,
          tree: treeData.sha,
          parents: [headSha],
        }),
      }
    );

    // 6. Update the branch ref
    await ghFetch(`${base}/git/refs/heads/${encodeURIComponent(branch)}`, token, {
      method: "PATCH",
      body: JSON.stringify({ sha: newCommit.sha, force: false }),
    });

    return NextResponse.json({ success: true, commitUrl: newCommit.html_url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
