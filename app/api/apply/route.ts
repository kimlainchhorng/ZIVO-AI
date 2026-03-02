import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface FileChange {
  path: string;
  action: "create" | "update" | "delete";
  content: string;
}

interface ApplyRequest {
  owner: string;
  repo: string;
  branch: string;
  message: string;
  files: FileChange[];
}

async function githubRequest(
  token: string,
  path: string,
  method: string,
  body?: unknown
) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = (data as { message?: string })?.message ?? res.statusText;
    throw new Error(`GitHub API error (${res.status}): ${msg}`);
  }
  return data;
}

async function getFileSha(
  token: string,
  owner: string,
  repo: string,
  path: string,
  branch: string
): Promise<string | null> {
  try {
    const data = await githubRequest(
      token,
      `/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`,
      "GET"
    );
    return (data as { sha?: string })?.sha ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const token =
      req.headers.get("x-github-token") ?? process.env.GITHUB_TOKEN ?? "";
    if (!token) {
      return NextResponse.json(
        { error: "GitHub token required (x-github-token header or GITHUB_TOKEN env)" },
        { status: 401 }
      );
    }

    const body: ApplyRequest = await req.json().catch(() => null);
    if (!body || !body.owner || !body.repo || !body.branch || !Array.isArray(body.files)) {
      return NextResponse.json(
        { error: "Invalid request body. Required: owner, repo, branch, files[]" },
        { status: 400 }
      );
    }

    const { owner, repo, branch, message, files } = body;
    const commitMessage = message?.trim() || "chore: apply AI-generated changes";

    const results: Array<{ path: string; status: string; error?: string }> = [];

    for (const file of files) {
      try {
        if (file.action === "delete") {
          const sha = await getFileSha(token, owner, repo, file.path, branch);
          if (sha) {
            await githubRequest(token, `/repos/${owner}/${repo}/contents/${file.path}`, "DELETE", {
              message: commitMessage,
              sha,
              branch,
            });
          }
          results.push({ path: file.path, status: sha ? "deleted" : "not_found" });
        } else {
          const sha = await getFileSha(token, owner, repo, file.path, branch);
          const encoded = Buffer.from(file.content ?? "", "utf-8").toString("base64");
          await githubRequest(token, `/repos/${owner}/${repo}/contents/${file.path}`, "PUT", {
            message: commitMessage,
            content: encoded,
            branch,
            ...(sha ? { sha } : {}),
          });
          results.push({ path: file.path, status: sha ? "updated" : "created" });
        }
      } catch (err: unknown) {
        results.push({ path: file.path, status: "error", error: (err as Error)?.message });
      }
    }

    const hasErrors = results.some((r) => r.status === "error");
    return NextResponse.json(
      { results, success: !hasErrors },
      { status: hasErrors ? 207 : 200 }
    );
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error)?.message || "Server error" }, { status: 500 });
  }
}
