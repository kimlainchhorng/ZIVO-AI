import { NextResponse } from "next/server";

export const runtime = "nodejs";

type UpsertFile = {
  path: string; // e.g. "app/page.tsx"
  content: string;
  message?: string;
};

type DeleteFile = {
  path: string;
  message?: string;
};

async function gh<T>(url: string, init?: RequestInit): Promise<T> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("Missing GITHUB_TOKEN");

  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg = typeof data === "string" ? data : data?.message || "GitHub API error";
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }
  return data as T;
}

function b64(str: string) {
  return Buffer.from(str, "utf8").toString("base64");
}

async function getFileSha(owner: string, repo: string, path: string, branch: string) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(
    path
  )}?ref=${encodeURIComponent(branch)}`;

  try {
    const data = await gh<{ sha: string }>(url, { method: "GET" });
    return data.sha;
  } catch (e: any) {
    // 404 means file doesn't exist (OK for create)
    if (String(e.message).includes("404")) return null;
    throw e;
  }
}

export async function POST(req: Request) {
  try {
    const {
      mode, // "upsert" | "delete"
      files, // UpsertFile[] for upsert, DeleteFile[] for delete
    } = (await req.json()) as { mode: "upsert" | "delete"; files: any[] };

    const owner = process.env.GITHUB_OWNER!;
    const repo = process.env.GITHUB_REPO!;
    const branch = process.env.GITHUB_BRANCH || "main";

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Missing GITHUB_OWNER or GITHUB_REPO in env" },
        { status: 400 }
      );
    }

    if (!mode || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: "mode and files[] required" }, { status: 400 });
    }

    const results: any[] = [];

    for (const f of files) {
      const path = f.path?.trim();
      if (!path) throw new Error("File path is required");

      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(
        path
      )}`;

      if (mode === "upsert") {
        const content = String(f.content ?? "");
        const sha = await getFileSha(owner, repo, path, branch);

        const payload: any = {
          message: f.message || `AI update: ${path}`,
          content: b64(content),
          branch,
        };
        if (sha) payload.sha = sha; // update existing

        const r = await gh<any>(apiUrl, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        results.push({ path, action: sha ? "updated" : "created", commit: r?.commit?.sha });
      } else if (mode === "delete") {
        const sha = await getFileSha(owner, repo, path, branch);
        if (!sha) {
          results.push({ path, action: "skipped (not found)" });
          continue;
        }

        const payload: any = {
          message: f.message || `AI delete: ${path}`,
          sha,
          branch,
        };

        const r = await gh<any>(apiUrl, {
          method: "DELETE",
          body: JSON.stringify(payload),
        });

        results.push({ path, action: "deleted", commit: r?.commit?.sha });
      } else {
        throw new Error("Invalid mode. Use 'upsert' or 'delete'.");
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}