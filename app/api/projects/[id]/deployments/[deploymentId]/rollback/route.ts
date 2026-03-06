import { NextResponse } from 'next/server';
import { extractBearerToken, getUserFromToken, createAuthedClient } from '@/lib/db/projects-db';

export const runtime = 'nodejs';

interface RouteParams { params: Promise<{ id: string; deploymentId: string }> }

/** Basic SSRF guard: only allow HTTPS webhooks. */
function isSafeWebhookUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function POST(req: Request, { params }: RouteParams) {
  const { id: projectId, deploymentId } = await params;
  const token = extractBearerToken(req.headers.get('Authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = createAuthedClient(token);

  // Fetch the target deployment
  const { data: target, error: fetchErr } = await client
    .from('project_deployments')
    .select('*')
    .eq('id', deploymentId)
    .eq('project_id', projectId)
    .single();

  if (fetchErr || !target) return NextResponse.json({ error: 'Deployment not found' }, { status: 404 });
  if (target.status !== 'success') return NextResponse.json({ error: 'Can only rollback to successful deployments' }, { status: 400 });

  // If there's a Docker webhook configured, trigger it
  const webhookUrl = process.env.DOCKER_DEPLOY_WEBHOOK_URL;
  let rollbackStatus: 'pending' | 'success' | 'error' = 'pending';
  let errorMessage: string | null = null;

  if (webhookUrl) {
    if (!isSafeWebhookUrl(webhookUrl)) {
      return NextResponse.json({ error: 'DOCKER_DEPLOY_WEBHOOK_URL must be an HTTPS URL' }, { status: 500 });
    }
    try {
      const hookRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          commit_sha: target.commit_sha ?? null,
          deploy_url: target.deploy_url ?? null,
          rollback: true,
        }),
      });
      rollbackStatus = hookRes.ok ? 'success' : 'error';
      if (!hookRes.ok) errorMessage = `Webhook returned ${hookRes.status}`;
    } catch (err) {
      rollbackStatus = 'error';
      errorMessage = (err as Error).message;
    }
  }

  // Record the rollback deployment
  const { data: newDeployment, error: insertErr } = await client
    .from('project_deployments')
    .insert({
      project_id: projectId,
      provider: target.provider,
      deploy_url: target.deploy_url,
      github_repo: (target as Record<string, unknown>).github_repo ?? null,
      github_branch: (target as Record<string, unknown>).github_branch ?? null,
      commit_sha: target.commit_sha ?? null,
      rollback_of: deploymentId,
      status: rollbackStatus,
      error_message: errorMessage,
      deployed_at: rollbackStatus === 'success' ? new Date().toISOString() : null,
      finished_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
  return NextResponse.json({ deployment: newDeployment, webhookTriggered: !!webhookUrl });
}
