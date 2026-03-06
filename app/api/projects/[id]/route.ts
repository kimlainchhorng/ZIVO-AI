import { NextResponse } from 'next/server';
import { extractBearerToken, getUserFromToken, createAuthedClient, getProjectById, updateProject, deleteProject } from '@/lib/db/projects-db';
import type { DbProject } from '@/lib/db/projects-db';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  const { id } = await params;

  const token = extractBearerToken(req.headers.get('Authorization'));
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const project = await getProjectById(token, id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch latest version
    const client = createAuthedClient(token);
    const { data: latestVersion } = await client
      .from('project_versions')
      .select('*')
      .eq('project_id', id)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({ project, latestVersion: latestVersion ?? null });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message ?? 'Failed to fetch project' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const { id } = await params;

  const token = extractBearerToken(req.headers.get('Authorization'));
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const updates = body as Partial<Pick<DbProject, 'title' | 'mode' | 'visibility' | 'client_idea' | 'blueprint' | 'manifest'>>;

  try {
    const updated = await updateProject(token, id, updates);
    return NextResponse.json({ project: updated });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message ?? 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const { id } = await params;

  const token = extractBearerToken(req.headers.get('Authorization'));
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await deleteProject(token, id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message ?? 'Failed to delete project' }, { status: 500 });
  }
}
