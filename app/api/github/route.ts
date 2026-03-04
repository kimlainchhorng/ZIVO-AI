import { NextResponse } from "next/server";

export const runtime = "nodejs";

type GithubErrorResponse = { message?: string };

function asErrorMessage(data: unknown): string | undefined {
  if (typeof data === "string") return data;
  if (data && typeof data === "object" && "message" in data) {
    const msg = (data as GithubErrorResponse).message;
    return typeof msg === "string" ? msg : undefined;
  }
  return undefined;
}

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
  let data: unknown = null;
  try {
    data = text ? (JSON.parse(text) as unknown) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg = asErrorMessage(data) ?? "GitHub API error";
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }
  return data as T;
}

function b64(str: string): string {
  return Buffer.from(str, "utf8").toString("base64");
}

async function getFileSha(owner: string, repo: string, path: string, branch: string): Promise<string | null> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;
  try {
    const data = await gh<{ sha: string }>(url, { method: "GET" });
    return data.sha;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("404")) return null;
    throw e;
  }
}

type UpsertPayload = { message: string; content: string; branch: string; sha?: string };
type DeletePayload  = { message: string; sha: string; branch: string };

type GithubResult =
  | { path: string; action: "updated" | "created"; commit?: string }
  | { path: string; action: "deleted"; commit?: string }
  | { path: string; action: "skipped (not found)" };

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const mode  = body["mode"];
    const files = body["files"];

    if ((mode !== "upsert" && mode !== "delete") || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: "mode and files[] required" }, { status: 400 });
    }

    const owner  = process.env.GITHUB_OWNER!;
    const repo   = process.env.GITHUB_REPO!;
    const branch = process.env.GITHUB_BRANCH || "main";

    if (!owner || !repo) {
      return NextResponse.json({ error: "Missing GITHUB_OWNER or GITHUB_REPO in env" }, { status: 400 });
    }

    const results: GithubResult[] = [];

    for (const f of files) {
      if (!isRecord(f)) throw new Error("Invalid file entry");

      const filePath = typeof f["path"] === "string" ? f["path"].trim() : "";
      if (!filePath) throw new Error("File path is required");

      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`;

      if (mode === "upsert") {
        const content = typeof f["content"] === "string" ? f["content"] : String(f["content"] ?? "");
        const message = typeof f["message"] === "string" ? f["message"] : `AI update: ${filePath}`;
        const sha = await getFileSha(owner, repo, filePath, branch);

        const payload: UpsertPayload = {
          message,
          content: b64(content),
          branch,
          ...(sha ? { sha } : {}),
        };

        const r = await gh<{ commit?: { sha?: string } }>(apiUrl, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        results.push({ path: filePath, action: sha ? "updated" : "created", commit: r.commit?.sha });
      } else {
        const message = typeof f["message"] === "string" ? f["message"] : `AI delete: ${filePath}`;
        const sha = await getFileSha(owner, repo, filePath, branch);

        if (!sha) {
          results.push({ path: filePath, action: "skipped (not found)" });
          continue;
        }

        const payload: DeletePayload = { message, sha, branch };

        const r = await gh<{ commit?: { sha?: string } }>(apiUrl, {
          method: "DELETE",
          body: JSON.stringify(payload),
        });

        results.push({ path: filePath, action: "deleted", commit: r.commit?.sha });
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}