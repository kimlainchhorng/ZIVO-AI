import { NextResponse } from 'next/server';
import { extractBearerToken, getUserFromToken, createAuthedClient } from '@/lib/db/projects-db';
import { z } from 'zod';

export const runtime = 'nodejs';

interface RouteParams { params: Promise<{ id: string; memberId: string }> }

export async function PATCH(req: Request, { params }: RouteParams) {
  const { id: projectId, memberId } = await params;
  const token = extractBearerToken(req.headers.get('Authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const schema = z.object({
    role: z.enum(['editor', 'viewer']).optional(),
    status: z.enum(['active', 'declined']).optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid fields' }, { status: 400 });

  const client = createAuthedClient(token);

  // Either the owner can change the role, or the invitee can accept/decline
  const { data: existing, error: fetchErr } = await client
    .from('project_members')
    .select('*')
    .eq('id', memberId)
    .eq('project_id', projectId)
    .single();

  if (fetchErr || !existing) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

  const { data: project } = await client
    .from('projects')
    .select('owner_user_id')
    .eq('id', projectId)
    .single();

  const isOwner = project?.owner_user_id === user.id;
  const isInvitee = existing.user_id === user.id;

  if (!isOwner && !isInvitee) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Invitee can only change status; owner can change role
  const updates: Record<string, unknown> = {};
  if (parsed.data.status && isInvitee) updates.status = parsed.data.status;
  if (parsed.data.role && isOwner) updates.role = parsed.data.role;

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No valid updates' }, { status: 400 });

  const { data, error } = await client
    .from('project_members')
    .update(updates)
    .eq('id', memberId)
    .eq('project_id', projectId)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ member: data });
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const { id: projectId, memberId } = await params;
  const token = extractBearerToken(req.headers.get('Authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = createAuthedClient(token);

  const { data: project } = await client
    .from('projects')
    .select('owner_user_id')
    .eq('id', projectId)
    .single();

  if (project?.owner_user_id !== user.id) return NextResponse.json({ error: 'Only the project owner can remove members' }, { status: 403 });

  const { error } = await client
    .from('project_members')
    .delete()
    .eq('id', memberId)
    .eq('project_id', projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
