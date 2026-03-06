import { NextResponse } from "next/server";

export const runtime = "nodejs";

type GitAction = "create-repo" | "push-files" | "create-branch" | "create-pr";

interface FileEntry {
  path: string;
  content: string;
}

interface GitBody {
  action: GitAction;
  repoName?: string;
  files?: FileEntry[];
  branch?: string;
  baseBranch?: string;
  title?: string;
  body?: string;
  token?: string;
}

interface GitHubRefObject {
  sha: string;
}

interface GitHubRef {
  object: GitHubRefObject;
}

async function githubFetch(
  url: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
}

async function getAuthenticatedUser(token: string): Promise<string> {
  const res = await githubFetch("https://api.github.com/user", token);
  const data = (await res.json()) as { login: string };
  return data.login;
}

export async function GET() {
  return NextResponse.json({
    actions: ["create-repo", "push-files", "create-branch", "create-pr"],
  });
}

export async function POST(req: Request) {
  const body: GitBody = await req.json().catch(() => ({} as GitBody));
  const { action, repoName, files, branch, baseBranch, title, token } = body;

  const ghToken = token ?? process.env.GITHUB_TOKEN ?? "";
  if (!ghToken) {
    return NextResponse.json({ error: "GitHub token is not configured" }, { status: 500 });
  }

  if (!action) {
    return NextResponse.json({ error: "Missing required field: action" }, { status: 400 });
  }

  try {
    if (action === "create-repo") {
      if (!repoName) {
        return NextResponse.json({ error: "Missing required field: repoName" }, { status: 400 });
      }
      const res = await githubFetch("https://api.github.com/user/repos", ghToken, {
        method: "POST",
        body: JSON.stringify({ name: repoName, description: "", auto_init: true }),
      });
      const result = (await res.json()) as object;
      return NextResponse.json({ ok: true, result });
    }

    if (action === "push-files") {
      if (!repoName || !files?.length) {
        return NextResponse.json(
          { error: "Missing required fields: repoName, files" },
          { status: 400 }
        );
      }
      const owner = await getAuthenticatedUser(ghToken);
      const results: object[] = [];
      for (const file of files) {
        const encoded = Buffer.from(file.content).toString("base64");
        const res = await githubFetch(
          `https://api.github.com/repos/${owner}/${repoName}/contents/${file.path}`,
          ghToken,
          {
            method: "PUT",
            body: JSON.stringify({
              message: `Add ${file.path}`,
              content: encoded,
              ...(branch ? { branch } : {}),
            }),
          }
        );
        results.push((await res.json()) as object);
      }
      return NextResponse.json({ ok: true, result: results });
    }

    if (action === "create-branch") {
      if (!repoName || !branch) {
        return NextResponse.json(
          { error: "Missing required fields: repoName, branch" },
          { status: 400 }
        );
      }
      const owner = await getAuthenticatedUser(ghToken);
      const base = baseBranch ?? "main";
      const refRes = await githubFetch(
        `https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/${base}`,
        ghToken
      );
      const refData = (await refRes.json()) as GitHubRef;
      const sha = refData.object.sha;
      const res = await githubFetch(
        `https://api.github.com/repos/${owner}/${repoName}/git/refs`,
        ghToken,
        {
          method: "POST",
          body: JSON.stringify({ ref: `refs/heads/${branch}`, sha }),
        }
      );
      const result = (await res.json()) as object;
      return NextResponse.json({ ok: true, result });
    }

    if (action === "create-pr") {
      if (!repoName || !branch || !title) {
        return NextResponse.json(
          { error: "Missing required fields: repoName, branch, title" },
          { status: 400 }
        );
      }
      const owner = await getAuthenticatedUser(ghToken);
      const res = await githubFetch(
        `https://api.github.com/repos/${owner}/${repoName}/pulls`,
        ghToken,
        {
          method: "POST",
          body: JSON.stringify({
            title,
            body: body.body ?? "",
            head: branch,
            base: baseBranch ?? "main",
          }),
        }
      );
      const result = (await res.json()) as object;
      return NextResponse.json({ ok: true, result });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
