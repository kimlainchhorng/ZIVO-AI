/**
 * POST /api/projects/[id]/publish/docker
 *
 * Triggers a deploy on a self-hosted Docker server via a webhook.
 * The Docker server should be running the ZIVO-AI Docker Deploy Agent
 * (see docs/docker-deploy-agent.md).
 *
 * Body:
 *   endpoint    — Docker deploy webhook URL (e.g. https://my-server:4242/deploy)
 *   token       — Secret token verified by the Docker agent
 *   repoUrl     — (optional) GitHub repo URL to pass to the agent
 *   branch      — (optional, default "main") branch to deploy
 *
 * The agent receives a POST with:
 *   { repoUrl, branch, commitSha, projectId, zipUrl }
 * and should pull the repo / extract the zip, build, and start the container.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { extractBearerToken, getUserFromToken, createAuthedClient } from '@/lib/db/projects-db';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const BodySchema = z.object({
  endpoint: z.string().url('Must be a valid URL'),
  token: z.string().min(1),
  repoUrl: z.string().url().optional(),
  branch: z.string().optional().default('main'),
});

interface AgentResponse {
  status?: string;
  message?: string;
  logs?: string;
  commitSha?: string;
  error?: string;
}

export async function POST(req: Request, { params }: RouteParams) {
  const { id: projectId } = await params;

  const token = extractBearerToken(req.headers.get('Authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { endpoint, token: agentToken, repoUrl, branch } = parsed.data;

  const client = createAuthedClient(token);

  // Verify project ownership
  const { data: project, error: projectError } = await client
    .from('projects')
    .select('id, title, github_repo')
    .eq('id', projectId)
    .eq('owner_user_id', user.id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const typedProject = project as { id: string; title: string; github_repo: string | null };

  // Resolve repo URL: prefer explicit param, fall back to stored github_repo
  const resolvedRepoUrl =
    repoUrl ??
    (typedProject.github_repo
      ? `https://github.com/${typedProject.github_repo}`
      : undefined);

  // Build zip download URL for the export (so the agent can pull a fresh copy)
  const host = req.headers.get('host') ?? 'localhost';
  const protocol = req.headers.get('x-forwarded-proto') ?? 'https';
  const zipUrl = `${protocol}://${host}/api/projects/${projectId}/export.zip`;

  // Create a pending deployment record first
  const { data: deploymentRow } = await client
    .from('project_deployments')
    .insert({
      project_id: projectId,
      provider: 'docker',
      docker_endpoint: endpoint,
      github_repo: typedProject.github_repo ?? null,
      github_branch: branch,
      status: 'building',
    })
    .select('id')
    .single();

  const deploymentId = (deploymentRow as { id: string } | null)?.id;

  // Call the Docker deploy agent
  let agentRes: AgentResponse = {};
  let deployStatus: 'success' | 'error' = 'success';
  let errorMessage: string | undefined;
  let commitSha: string | undefined;

  try {
    const agentFetch = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${agentToken}`,
      },
      body: JSON.stringify({
        projectId,
        repoUrl: resolvedRepoUrl,
        branch,
        zipUrl,
      }),
      signal: AbortSignal.timeout(30_000), // 30 s gives the agent time to pull and start containers without hanging forever
    });

    agentRes = (await agentFetch.json()) as AgentResponse;

    if (!agentFetch.ok || agentRes.error) {
      deployStatus = 'error';
      errorMessage = agentRes.error ?? `Agent returned ${agentFetch.status}`;
    } else {
      commitSha = agentRes.commitSha;
    }
  } catch (err) {
    deployStatus = 'error';
    errorMessage = err instanceof Error ? err.message : 'Docker agent unreachable';
  }

  // Update deployment record
  if (deploymentId) {
    await client
      .from('project_deployments')
      .update({
        status: deployStatus,
        error_message: errorMessage ?? null,
        commit_sha: commitSha ?? null,
        deployed_at: deployStatus === 'success' ? new Date().toISOString() : null,
      })
      .eq('id', deploymentId);
  }

  if (deployStatus === 'error') {
    return NextResponse.json(
      { error: errorMessage ?? 'Deploy failed', deploymentId },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    deploymentId,
    status: agentRes.status,
    message: agentRes.message,
    logs: agentRes.logs,
    commitSha,
  });
}
