/**
 * app/api/projects/[id]/versions/[versionId]/route.ts
 * GET  — get a single version snapshot
 * POST ?action=restore — restore the project to this version's snapshot
 */
import { NextResponse } from 'next/server';
import {
  extractBearerToken,
  getUserFromToken,
  createAuthedClient,
  getProjectById,
} from '@/lib/db/projects-db';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ id: string; versionId: string }>;
}

// ─── GET /api/projects/[id]/versions/[versionId] ────────────────────────────

export async function GET(req: Request, { params }: RouteParams) {
  const { id, versionId } = await params;

  const token = extractBearerToken(req.headers.get('Authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const project = await getProjectById(token, id);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const client = createAuthedClient(token);
    const { data: version, error } = await client
      .from('project_versions')
      .select('*')
      .eq('id', versionId)
      .eq('project_id', id)
      .single();

    if (error || !version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    return NextResponse.json({ version });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message ?? 'Failed to fetch version' },
      { status: 500 }
    );
  }
}

// ─── POST /api/projects/[id]/versions/[versionId]?action=restore ─────────────

export async function POST(req: Request, { params }: RouteParams) {
  const { id, versionId } = await params;
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  const token = extractBearerToken(req.headers.get('Authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (action !== 'restore') {
    return NextResponse.json({ error: 'Unknown action. Use ?action=restore' }, { status: 400 });
  }

  try {
    const project = await getProjectById(token, id);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const client = createAuthedClient(token);

    // Fetch the target version
    const { data: version, error: fetchError } = await client
      .from('project_versions')
      .select('*')
      .eq('id', versionId)
      .eq('project_id', id)
      .single();

    if (fetchError || !version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // Apply the snapshot back to the project
    const { error: updateError } = await client
      .from('projects')
      .update({
        pages: version.pages ?? [],
        sections: version.sections ?? [],
        style_preset: version.style_preset ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({
      success: true,
      restoredVersion: version.version_number,
      snapshot: version.snapshot,
      pages: version.pages,
      sections: version.sections,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message ?? 'Failed to restore version' },
      { status: 500 }
    );
  }
}
