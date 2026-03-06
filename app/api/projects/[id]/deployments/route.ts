import { NextResponse } from 'next/server';
import { extractBearerToken, getUserFromToken, createAuthedClient } from '@/lib/db/projects-db';
import { z } from 'zod';

export const runtime = 'nodejs';

interface RouteParams { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: RouteParams) {
  const { id: projectId } = await params;
  const token = extractBearerToken(req.headers.get('Authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const uuidCheck = z.string().uuid().safeParse(projectId);
  if (!uuidCheck.success) return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });

  const client = createAuthedClient(token);
  const { data, error } = await client
    .from('project_deployments')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deployments: data ?? [] });
}
