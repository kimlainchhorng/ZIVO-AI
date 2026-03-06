import { NextResponse } from 'next/server';
import { extractBearerToken, getUserFromToken, createAuthedClient } from '@/lib/db/projects-db';

export const runtime = 'nodejs';

interface RouteParams { params: Promise<{ id: string; deploymentId: string }> }

export async function POST(req: Request, { params }: RouteParams) {
  const { id: projectId, deploymentId } = await params;
  const token = extractBearerToken(req.headers.get('Authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const _user = await getUserFromToken(token);
  if (!_user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
  } else {
    // No webhook configured; record the rollback as pending
    rollbackStatus = 'pending';
  }

  // Record the rollback deployment
  const { data: newDeployment, error: insertErr } = await client
    .from('project_deployments')
    .insert({
      project_id: projectId,
      provider: target.provider,
      deploy_url: target.deploy_url,
      github_repo: target.github_repo ?? null,
      github_branch: target.github_branch ?? null,
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
