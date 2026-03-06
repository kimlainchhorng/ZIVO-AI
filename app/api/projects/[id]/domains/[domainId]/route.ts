import { NextResponse } from 'next/server';
import { extractBearerToken, getUserFromToken, createAuthedClient } from '@/lib/db/projects-db';
import { z } from 'zod';

export const runtime = 'nodejs';

interface RouteParams { params: Promise<{ id: string; domainId: string }> }

export async function GET(req: Request, { params }: RouteParams) {
  const { id: projectId, domainId } = await params;
  const token = extractBearerToken(req.headers.get('Authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const _user = await getUserFromToken(token);
  if (!_user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = createAuthedClient(token);
  const { data, error } = await client
    .from('project_domains')
    .select('*')
    .eq('id', domainId)
    .eq('project_id', projectId)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
  return NextResponse.json({ domain: data });
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const { id: projectId, domainId } = await params;
  const token = extractBearerToken(req.headers.get('Authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const _user = await getUserFromToken(token);
  if (!_user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const allowedFields = z.object({
    status: z.enum(['pending_dns', 'pending_tls', 'active', 'error']).optional(),
    error_message: z.string().optional(),
  });
  const parsed = allowedFields.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid fields' }, { status: 400 });

  const client = createAuthedClient(token);
  const { data, error } = await client
    .from('project_domains')
    .update(parsed.data)
    .eq('id', domainId)
    .eq('project_id', projectId)
    .select('*')
    .single();

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Not found' }, { status: 404 });
  return NextResponse.json({ domain: data });
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const { id: projectId, domainId } = await params;
  const token = extractBearerToken(req.headers.get('Authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const _user = await getUserFromToken(token);
  if (!_user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = createAuthedClient(token);
  const { error } = await client
    .from('project_domains')
    .delete()
    .eq('id', domainId)
    .eq('project_id', projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
