import { NextResponse } from "next/server";

export const runtime = "nodejs";

export type DeployPlatform = "vercel" | "netlify";

export interface DeployFile {
  path: string;
  content: string;
}

export interface DeployRequest {
  platform: DeployPlatform;
  files: DeployFile[];
}

export interface DeployResponse {
  url: string;
  deploymentId: string;
}

async function deployToVercel(files: DeployFile[]): Promise<DeployResponse> {
  const token = process.env.VERCEL_TOKEN;
  if (!token) throw new Error("VERCEL_TOKEN is missing in environment");

  const fileMap = Object.fromEntries(
    files.map((f) => [
      f.path,
      { file: f.path, data: Buffer.from(f.content).toString("base64"), encoding: "base64" },
    ])
  );

  const body: Record<string, unknown> = {
    name: "zivo-ai-deploy",
    files: Object.values(fileMap),
    projectSettings: { framework: "nextjs" },
  };

  if (process.env.VERCEL_TEAM_ID) {
    body.teamId = process.env.VERCEL_TEAM_ID;
  }

  const res = await fetch("https://api.vercel.com/v13/deployments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Vercel deploy failed: ${err}`);
  }

  const data = await res.json();
  return {
    url: `https://${data.url}`,
    deploymentId: data.id,
  };
}

async function deployToNetlify(files: DeployFile[]): Promise<DeployResponse> {
  const token = process.env.NETLIFY_TOKEN;
  if (!token) throw new Error("NETLIFY_TOKEN is missing in environment");

  // Create a new site
  const siteRes = await fetch("https://api.netlify.com/api/v1/sites", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: `zivo-ai-${Date.now()}` }),
  });

  if (!siteRes.ok) {
    const err = await siteRes.text();
    throw new Error(`Netlify site creation failed: ${err}`);
  }

  const site = await siteRes.json();

  // Deploy files as a zip is complex; use the files API instead
  const fileDigests: Record<string, string> = {};
  for (const f of files) {
    const encoder = new TextEncoder();
    const data = encoder.encode(f.content);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    fileDigests[`/${f.path}`] = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  const deployRes = await fetch(
    `https://api.netlify.com/api/v1/sites/${site.id}/deploys`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ files: fileDigests }),
    }
  );

  if (!deployRes.ok) {
    const err = await deployRes.text();
    throw new Error(`Netlify deploy failed: ${err}`);
  }

  const deploy = await deployRes.json();

  // Upload each file
  for (const f of files) {
    await fetch(
      `https://api.netlify.com/api/v1/deploys/${deploy.id}/files/${encodeURIComponent(f.path)}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/octet-stream",
        },
        body: f.content,
      }
    );
  }

  return {
    url: `https://${deploy.ssl_url || deploy.url}`,
    deploymentId: deploy.id,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => {
      return NextResponse.json({ error: "Invalid or malformed JSON in request body" }, { status: 400 });
    });
    const { platform, files }: DeployRequest = body;

    if (!platform || !["vercel", "netlify"].includes(platform)) {
      return NextResponse.json(
        { error: 'platform must be "vercel" or "netlify"' },
        { status: 400 }
      );
    }

    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "files array is required and must not be empty" },
        { status: 400 }
      );
    }

    const result =
      platform === "vercel"
        ? await deployToVercel(files)
        : await deployToNetlify(files);

    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
