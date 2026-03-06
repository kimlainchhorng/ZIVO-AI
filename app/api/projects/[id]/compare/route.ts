/**
 * app/api/projects/[id]/compare/route.ts
 * GET ?v1=<versionId>&v2=<versionId>
 * Returns a structured diff between two version snapshots (sections, pages).
 */
import { NextResponse } from 'next/server';
import {
  extractBearerToken,
  getUserFromToken,
  createAuthedClient,
  getProjectById,
} from '@/lib/db/projects-db';
import { computeUIOutputDiff } from '@/lib/diff-engine';
import type { UIOutput } from '@/types/builder';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const v1Id = searchParams.get('v1');
  const v2Id = searchParams.get('v2');

  if (!v1Id || !v2Id) {
    return NextResponse.json({ error: 'Both v1 and v2 query params are required' }, { status: 400 });
  }

  const token = extractBearerToken(req.headers.get('Authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const project = await getProjectById(token, id);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const client = createAuthedClient(token);

    // Fetch both versions in parallel
    const [{ data: versionA, error: errA }, { data: versionB, error: errB }] = await Promise.all([
      client
        .from('project_versions')
        .select('*')
        .eq('id', v1Id)
        .eq('project_id', id)
        .single(),
      client
        .from('project_versions')
        .select('*')
        .eq('id', v2Id)
        .eq('project_id', id)
        .single(),
    ]);

    if (errA || !versionA) {
      return NextResponse.json({ error: `Version v1 (${v1Id}) not found` }, { status: 404 });
    }
    if (errB || !versionB) {
      return NextResponse.json({ error: `Version v2 (${v2Id}) not found` }, { status: 404 });
    }

    // Build UIOutput-compatible snapshots for the diff engine
    const snapshotA: UIOutput = versionA.snapshot as UIOutput;
    const snapshotB: UIOutput = versionB.snapshot as UIOutput;

    const diffText = computeUIOutputDiff(snapshotA, snapshotB);

    // Also provide structured section-level comparison
    const sectionsA: unknown[] = Array.isArray(versionA.sections) ? versionA.sections : [];
    const sectionsB: unknown[] = Array.isArray(versionB.sections) ? versionB.sections : [];
    const pagesA: unknown[] = Array.isArray(versionA.pages) ? versionA.pages : [];
    const pagesB: unknown[] = Array.isArray(versionB.pages) ? versionB.pages : [];

    return NextResponse.json({
      v1: {
        id: versionA.id,
        versionNumber: versionA.version_number,
        label: versionA.label,
        createdAt: versionA.created_at,
      },
      v2: {
        id: versionB.id,
        versionNumber: versionB.version_number,
        label: versionB.label,
        createdAt: versionB.created_at,
      },
      diff: diffText,
      sections: {
        before: sectionsA,
        after: sectionsB,
        count: { before: sectionsA.length, after: sectionsB.length },
      },
      pages: {
        before: pagesA,
        after: pagesB,
        count: { before: pagesA.length, after: pagesB.length },
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message ?? 'Failed to compare versions' },
      { status: 500 }
    );
  }
}
