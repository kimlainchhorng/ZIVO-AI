import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface FileToCommit {
  path: string;
  content: string;
}

interface GitHubCommitBody {
  owner: string;
  repo: string;
  branch: string;
  files: FileToCommit[];
  commitMessage: string;
  token: string;
}

interface GitHubCommitResponse {
  sha: string;
  html_url: string;
}

async function ghRequest<T>(
  url: string,
  options: RequestInit,
  retries = 3
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(url, options);
    if (res.status === 429 && attempt < retries) {
      const retryAfter = parseInt(res.headers.get("retry-after") ?? "2", 10);
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      continue;
    }
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`GitHub API error ${res.status}: ${body}`);
    }
    return res.json() as Promise<T>;
  }
  throw new Error("Max retries exceeded");
}

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { owner, repo, branch, files, commitMessage, token } = body as GitHubCommitBody;

    if (!owner || !repo || !branch || !Array.isArray(files) || !commitMessage || !token) {
      return NextResponse.json(
        { error: "Missing required fields: owner, repo, branch, files, commitMessage, token" },
        { status: 400 }
      );
    }

    for (const f of files) {
      if (!f.path || typeof f.content !== "string") {
        return NextResponse.json({ error: "Each file must have path and content" }, { status: 400 });
      }
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    // Get branch ref to find the latest commit SHA
    const branchData = await ghRequest<{ commit: { sha: string } }>(
      `https://api.github.com/repos/${owner}/${repo}/branches/${branch}`,
      { headers }
    );
    const latestSha = branchData.commit.sha;

    // Process each file: get current SHA if it exists, then create/update
    const treeItems: Array<{ path: string; mode: string; type: string; content: string }> = [];

    for (const file of files) {
      treeItems.push({
        path: file.path,
        mode: "100644",
        type: "blob",
        content: file.content,
      });
    }

    // Create a tree
    const treeData = await ghRequest<{ sha: string }>(
      `https://api.github.com/repos/${owner}/${repo}/git/trees`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ base_tree: latestSha, tree: treeItems }),
      }
    );

    // Create commit
    const commitData = await ghRequest<GitHubCommitResponse>(
      `https://api.github.com/repos/${owner}/${repo}/git/commits`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: commitMessage,
          tree: treeData.sha,
          parents: [latestSha],
        }),
      }
    );

    // Update branch ref
    await ghRequest<unknown>(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ sha: commitData.sha }),
      }
    );

    return NextResponse.json({
      success: true,
      commitSha: commitData.sha,
      url: commitData.html_url,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
