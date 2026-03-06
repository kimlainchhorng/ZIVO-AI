import { NextResponse } from 'next/server';
import { extractBearerToken, getUserFromToken, createAuthedClient } from '@/lib/db/projects-db';
import { z } from 'zod';

export const runtime = 'nodejs';

interface RouteParams { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: RouteParams) {
  const { id: projectId } = await params;
  const token = extractBearerToken(req.headers.get('Authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const _user = await getUserFromToken(token);
  if (!_user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = createAuthedClient(token);
  const { data, error } = await client
    .from('project_domains')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ domains: data ?? [] });
}

export async function POST(req: Request, { params }: RouteParams) {
  const { id: projectId } = await params;
  const token = extractBearerToken(req.headers.get('Authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const _user = await getUserFromToken(token);
  if (!_user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({})) as { domain?: string };
  const parsed = z.string().min(3).regex(/^[a-z0-9.-]+\.[a-z]{2,}$/).safeParse(body.domain);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 });

  const client = createAuthedClient(token);
  const { data, error } = await client
    .from('project_domains')
    .insert({ project_id: projectId, domain: parsed.data })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ domain: data }, { status: 201 });
}
