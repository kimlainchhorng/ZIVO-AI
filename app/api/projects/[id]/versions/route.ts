/**
 * app/api/projects/[id]/versions/route.ts
 * GET  — list all versions for a project (ordered newest first)
 * POST — save current project state as a new version (auto-increment version_number)
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  extractBearerToken,
  getUserFromToken,
  createAuthedClient,
  getProjectById,
} from '@/lib/db/projects-db';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─── GET /api/projects/[id]/versions ────────────────────────────────────────

export async function GET(req: Request, { params }: RouteParams) {
  const { id } = await params;

  const token = extractBearerToken(req.headers.get('Authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const project = await getProjectById(token, id);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const client = createAuthedClient(token);
    const { data: versions, error } = await client
      .from('project_versions')
      .select('*')
      .eq('project_id', id)
      .order('version_number', { ascending: false });

    if (error) throw new Error(error.message);

    return NextResponse.json({ versions: versions ?? [] });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message ?? 'Failed to list versions' },
      { status: 500 }
    );
  }
}

// ─── POST /api/projects/[id]/versions ───────────────────────────────────────

const SaveVersionSchema = z.object({
  label: z.string().optional(),
  snapshot: z.record(z.unknown()).optional(),
  pages: z.array(z.unknown()).optional(),
  sections: z.array(z.unknown()).optional(),
  style_preset: z.string().optional(),
});

export async function POST(req: Request, { params }: RouteParams) {
  const { id } = await params;

  const token = extractBearerToken(req.headers.get('Authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = SaveVersionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const project = await getProjectById(token, id);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const client = createAuthedClient(token);

    // Determine the next version number
    const { data: latest } = await client
      .from('project_versions')
      .select('version_number')
      .eq('project_id', id)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    const nextVersionNumber = (latest?.version_number ?? 0) + 1;

    const { data: version, error } = await client
      .from('project_versions')
      .insert({
        project_id: id,
        version_number: nextVersionNumber,
        label: parsed.data.label ?? `Version ${nextVersionNumber}`,
        snapshot: parsed.data.snapshot ?? {},
        pages: parsed.data.pages ?? [],
        sections: parsed.data.sections ?? [],
        style_preset: parsed.data.style_preset,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ version }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message ?? 'Failed to save version' },
      { status: 500 }
    );
  }
}
