import { NextResponse } from 'next/server';
import { z } from 'zod';
import { UIOutputSchema } from '@/types/builder';
import { computeDiff } from '@/lib/diff-engine';
import { extractBearerToken, getUserFromToken, createAuthedClient } from '@/lib/db/projects-db';

export const runtime = 'nodejs';

const RequestSchema = z.object({
  projectId: z.string().uuid(),
  versionA: z.number().int().positive(),
  versionB: z.number().int().positive(),
});

export async function POST(req: Request) {
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

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const { projectId, versionA, versionB } = parsed.data;

  const client = createAuthedClient(token);

  const [{ data: verA, error: errA }, { data: verB, error: errB }] = await Promise.all([
    client.from('project_versions').select('*').eq('project_id', projectId).eq('version_number', versionA).single(),
    client.from('project_versions').select('*').eq('project_id', projectId).eq('version_number', versionB).single(),
  ]);

  if (errA || !verA) {
    return NextResponse.json({ error: `Version ${versionA} not found` }, { status: 404 });
  }
  if (errB || !verB) {
    return NextResponse.json({ error: `Version ${versionB} not found` }, { status: 404 });
  }

  const snapshotA = UIOutputSchema.safeParse(verA.snapshot);
  const snapshotB = UIOutputSchema.safeParse(verB.snapshot);

  if (!snapshotA.success || !snapshotB.success) {
    return NextResponse.json({ error: 'Invalid snapshot data in one or both versions' }, { status: 500 });
  }

  const diff = computeDiff(snapshotA.data, snapshotB.data);

  return NextResponse.json({ versionA: verA, versionB: verB, diff });
}
