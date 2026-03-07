import { NextResponse } from 'next/server';
import { extractBearerToken, getUserFromToken, createAuthedClient } from '@/lib/db/projects-db';
import { DeploymentSchema } from '@/types/builder';
import { z } from 'zod';

export const runtime = 'nodejs';

function mapRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    projectId: row.project_id,
    provider: row.provider,
    deployUrl: row.deploy_url,
    githubRepo: row.github_repo,
    githubBranch: row.github_branch,
    dockerEndpoint: row.docker_endpoint,
    commitSha: row.commit_sha,
    status: row.status,
    errorMessage: row.error_message,
    deployedAt: row.deployed_at,
    createdAt: row.created_at,
  };
}

export async function GET(req: Request) {
  const token = extractBearerToken(req.headers.get('Authorization'));
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const projectId = url.searchParams.get('projectId');
  const deploymentId = url.searchParams.get('deploymentId');

  const client = createAuthedClient(token);

  if (deploymentId) {
    const { data, error } = await client
      .from('project_deployments')
      .select('*')
      .eq('id', deploymentId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Deployment not found' }, { status: 404 });
    }

    const deployment = DeploymentSchema.safeParse(mapRow(data as Record<string, unknown>));
    return NextResponse.json({ deployment: deployment.success ? deployment.data : mapRow(data as Record<string, unknown>) });
  }

  if (projectId) {
    const uuidParsed = z.string().uuid().safeParse(projectId);
    if (!uuidParsed.success) {
      return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });
    }

    const { data, error } = await client
      .from('project_deployments')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const deployments = (data ?? []).map(mapRow);
    return NextResponse.json({ deployments });
  }

  return NextResponse.json({ error: 'projectId or deploymentId is required' }, { status: 400 });
}
