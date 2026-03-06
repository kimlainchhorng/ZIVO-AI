import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface FileToCommit {
  path: string;
  content: string;
}

interface CreatePRBody {
  owner: string;
  repo: string;
  token: string;
  files: FileToCommit[];
  branchName: string;
  prTitle: string;
  prBody?: string;
  baseBranch?: string;
}

interface PRResponse {
  number: number;
  html_url: string;
  head: { ref: string };
}

async function ghApi<T>(url: string, options: RequestInit, token: string): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const {
      owner, repo, token, files, branchName, prTitle, prBody = "", baseBranch = "main",
    } = body as CreatePRBody;

    if (!owner || !repo || !token || !branchName || !prTitle) {
      return NextResponse.json(
        { error: "owner, repo, token, branchName, and prTitle are required" },
        { status: 400 }
      );
    }
    if (!Array.isArray(files)) {
      return NextResponse.json({ error: "files must be an array" }, { status: 400 });
    }
    for (const f of files) {
      if (!f || typeof f.path !== "string" || typeof f.content !== "string") {
        return NextResponse.json({ error: "Each file must have path and content" }, { status: 400 });
      }
    }

    // 1. Get base branch SHA
    const baseData = await ghApi<{ commit: { sha: string } }>(
      `https://api.github.com/repos/${owner}/${repo}/branches/${baseBranch}`,
      {}, token
    );
    const baseSha = baseData.commit.sha;

    // 2. Create new branch
    await ghApi<unknown>(
      `https://api.github.com/repos/${owner}/${repo}/git/refs`,
      {
        method: "POST",
        body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: baseSha }),
      },
      token
    );

    // 3. Create a tree with all files
    const treeItems = files.map((f) => ({
      path: f.path, mode: "100644", type: "blob", content: f.content,
    }));
    const treeData = await ghApi<{ sha: string }>(
      `https://api.github.com/repos/${owner}/${repo}/git/trees`,
      { method: "POST", body: JSON.stringify({ base_tree: baseSha, tree: treeItems }) },
      token
    );

    // 4. Create commit
    const commitData = await ghApi<{ sha: string }>(
      `https://api.github.com/repos/${owner}/${repo}/git/commits`,
      {
        method: "POST",
        body: JSON.stringify({ message: prTitle, tree: treeData.sha, parents: [baseSha] }),
      },
      token
    );

    // 5. Update branch ref
    await ghApi<unknown>(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branchName}`,
      { method: "PATCH", body: JSON.stringify({ sha: commitData.sha }) },
      token
    );

    // 6. Create pull request
    const pr = await ghApi<PRResponse>(
      `https://api.github.com/repos/${owner}/${repo}/pulls`,
      {
        method: "POST",
        body: JSON.stringify({ title: prTitle, body: prBody, head: branchName, base: baseBranch }),
      },
      token
    );

    return NextResponse.json({ prUrl: pr.html_url, prNumber: pr.number, branchName: pr.head.ref });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
