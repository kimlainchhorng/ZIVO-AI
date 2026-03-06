import { NextResponse } from 'next/server';
import { extractBearerToken, getUserFromToken, createAuthedClient } from '@/lib/db/projects-db';
import { z } from 'zod';

export const runtime = 'nodejs';

interface RouteParams { params: Promise<{ id: string }> }

const InviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['editor', 'viewer']).default('viewer'),
});

export async function GET(req: Request, { params }: RouteParams) {
  const { id: projectId } = await params;
  const token = extractBearerToken(req.headers.get('Authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = createAuthedClient(token);
  const { data, error } = await client
    .from('project_members')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ members: data ?? [] });
}

export async function POST(req: Request, { params }: RouteParams) {
  const { id: projectId } = await params;
  const token = extractBearerToken(req.headers.get('Authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only owners can invite
  const client = createAuthedClient(token);
  const { data: project, error: projErr } = await client
    .from('projects')
    .select('owner_user_id')
    .eq('id', projectId)
    .single();

  if (projErr || !project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  if (project.owner_user_id !== user.id) return NextResponse.json({ error: 'Only the project owner can invite members' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const parsed = InviteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });

  const { data: member, error: insertErr } = await client
    .from('project_members')
    .insert({
      project_id: projectId,
      invited_by: user.id,
      invited_email: parsed.data.email,
      role: parsed.data.role,
      status: 'pending',
    })
    .select('*')
    .single();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
  return NextResponse.json({ member }, { status: 201 });
}
