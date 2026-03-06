/**
 * POST /api/projects/[id]/publish/docker
 *
 * Triggers a Docker-server webhook so the server can pull the latest commit
 * from GitHub and run `docker compose up -d`.
 *
 * Auth: Bearer token required. Caller must own the project.
 *
 * Body (JSON):
 *   {
 *     dockerDeployToken: string;  // bearer token for the Docker webhook endpoint
 *     // Optional overrides – defaults come from project_deploy_settings
 *     endpoint?: string;
 *     repoUrl?: string;
 *     branch?: string;
 *     commitSha?: string;
 *   }
 *
 * Returns: { status, log, deployedAt, commitSha }
 */

import { NextResponse } from "next/server";
import {
  extractBearerToken,
  getUserFromToken,
  getProjectById,
  getDeploySettings,
  upsertDeploySettings,
} from "@/lib/db/projects-db";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface DockerDeployBody {
  dockerDeployToken: string;
  endpoint?: string;
  repoUrl?: string;
  branch?: string;
  commitSha?: string;
}

export async function POST(req: Request, { params }: RouteParams) {
  const { id: projectId } = await params;

  // ── Auth ───────────────────────────────────────────────────────────────────
  const token = extractBearerToken(req.headers.get("Authorization"));
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await getUserFromToken(token);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Ownership check ────────────────────────────────────────────────────────
  const project = await getProjectById(token, projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (project.owner_user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: DockerDeployBody;
  try {
    body = (await req.json()) as DockerDeployBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { dockerDeployToken } = body;
  if (!dockerDeployToken || typeof dockerDeployToken !== "string") {
    return NextResponse.json(
      { error: "Missing required field: dockerDeployToken" },
      { status: 422 }
    );
  }

  // ── Resolve settings (body overrides saved settings) ──────────────────────
  const saved = await getDeploySettings(token, projectId);

  const endpoint = body.endpoint ?? saved?.docker_deploy_endpoint ?? null;
  const repoUrl = body.repoUrl ?? saved?.deploy_repo_url ?? null;
  const branch = body.branch ?? saved?.deploy_branch ?? "main";
  const commitSha = body.commitSha ?? saved?.last_pushed_commit_sha ?? null;

  if (!endpoint) {
    return NextResponse.json(
      { error: "Missing docker_deploy_endpoint (provide in body or save in settings)" },
      { status: 422 }
    );
  }
  if (!repoUrl) {
    return NextResponse.json(
      { error: "Missing repoUrl — push to GitHub first or provide repoUrl in body" },
      { status: 422 }
    );
  }
  if (!commitSha) {
    return NextResponse.json(
      { error: "Missing commitSha — push to GitHub first or provide commitSha in body" },
      { status: 422 }
    );
  }

  // ── Send webhook ───────────────────────────────────────────────────────────
  const requestedAt = new Date().toISOString();
  const webhookPayload = {
    projectId,
    repoUrl,
    branch,
    commitSha,
    requestedAt,
  };

  let deployStatus = "failed";
  let log = "";

  try {
    const webhookRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${dockerDeployToken}`,
      },
      body: JSON.stringify(webhookPayload),
      // 30 second timeout
      signal: AbortSignal.timeout(30_000),
    });

    const bodyText = await webhookRes.text().catch(() => "");

    if (webhookRes.ok) {
      deployStatus = "success";
      try {
        const parsed = JSON.parse(bodyText) as { log?: string; status?: string };
        log = parsed.log ?? bodyText;
      } catch {
        log = bodyText;
      }
    } else {
      deployStatus = "failed";
      log = `Webhook returned ${webhookRes.status}: ${bodyText}`;
    }
  } catch (err: unknown) {
    const msg = (err as Error).message ?? String(err);
    deployStatus = "failed";
    log = `Webhook request failed: ${msg}`;
  }

  // ── Persist deploy status ─────────────────────────────────────────────────
  const deployedAt = new Date().toISOString();
  await upsertDeploySettings(token, projectId, {
    ...(endpoint ? { docker_deploy_endpoint: endpoint } : {}),
    ...(repoUrl ? { deploy_repo_url: repoUrl } : {}),
    deploy_branch: branch,
    last_deployed_commit_sha: commitSha,
    last_deployed_at: deployedAt,
    last_deploy_status: deployStatus,
  });

  if (deployStatus === "failed") {
    return NextResponse.json(
      { status: deployStatus, log, deployedAt, commitSha },
      { status: 502 }
    );
  }

  return NextResponse.json({ status: deployStatus, log, deployedAt, commitSha });
}
