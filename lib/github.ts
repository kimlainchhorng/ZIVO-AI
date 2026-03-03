export interface RepoInfo {
  owner: string;
  repo: string;
  branch?: string;
}

export interface GitHubFile {
  path: string;
  content: string;
  message?: string;
}

async function ghFetch<T>(
  url: string,
  token: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg =
      typeof data === "object" && data !== null && "message" in data
        ? String((data as Record<string, unknown>).message)
        : String(data);
    throw new Error(`GitHub API ${res.status}: ${msg}`);
  }

  return data as T;
}

function toBase64(str: string): string {
  return Buffer.from(str, "utf8").toString("base64");
}

export async function listRepos(token: string): Promise<{ name: string; full_name: string; private: boolean }[]> {
  return ghFetch(
    "https://api.github.com/user/repos?per_page=100&sort=updated",
    token
  );
}

export async function getFileSha(
  token: string,
  info: RepoInfo,
  filePath: string
): Promise<string | null> {
  const branch = info.branch ?? "main";
  try {
    const data = await ghFetch<{ sha: string }>(
      `https://api.github.com/repos/${info.owner}/${info.repo}/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(branch)}`,
      token
    );
    return data.sha;
  } catch (e) {
    if (String(e).includes("404")) return null;
    throw e;
  }
}

export async function upsertFile(
  token: string,
  info: RepoInfo,
  file: GitHubFile
): Promise<{ path: string; action: "created" | "updated"; commit: string }> {
  const branch = info.branch ?? "main";
  const sha = await getFileSha(token, info, file.path);
  const payload: Record<string, unknown> = {
    message: file.message ?? `AI update: ${file.path}`,
    content: toBase64(file.content),
    branch,
  };
  if (sha) payload.sha = sha;

  const result = await ghFetch<{ commit: { sha: string } }>(
    `https://api.github.com/repos/${info.owner}/${info.repo}/contents/${encodeURIComponent(file.path)}`,
    token,
    { method: "PUT", body: JSON.stringify(payload) }
  );

  return {
    path: file.path,
    action: sha ? "updated" : "created",
    commit: result.commit.sha,
  };
}

export async function deleteFile(
  token: string,
  info: RepoInfo,
  filePath: string,
  message?: string
): Promise<{ path: string; action: "deleted" | "skipped"; commit?: string }> {
  const branch = info.branch ?? "main";
  const sha = await getFileSha(token, info, filePath);
  if (!sha) return { path: filePath, action: "skipped" };

  const payload = {
    message: message ?? `AI delete: ${filePath}`,
    sha,
    branch,
  };

  const result = await ghFetch<{ commit: { sha: string } }>(
    `https://api.github.com/repos/${info.owner}/${info.repo}/contents/${encodeURIComponent(filePath)}`,
    token,
    { method: "DELETE", body: JSON.stringify(payload) }
  );

  return { path: filePath, action: "deleted", commit: result.commit.sha };
}
