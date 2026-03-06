import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ProjectVersionSchema } from '@/types/builder';
import { extractBearerToken, getUserFromToken, createAuthedClient } from '@/lib/db/projects-db';

export const runtime = 'nodejs';

const RequestSchema = z.object({
  projectId: z.string().uuid(),
  versionNumber: z.number().int().positive(),
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

  const { projectId, versionNumber } = parsed.data;

  const client = createAuthedClient(token);

  // Fetch the version to restore
  const { data: version, error: versionError } = await client
    .from('project_versions')
    .select('*')
    .eq('project_id', projectId)
    .eq('version_number', versionNumber)
    .single();

  if (versionError || !version) {
    return NextResponse.json({ error: `Version ${versionNumber} not found` }, { status: 404 });
  }

  // Get current latest version number
  const { data: latestVersions } = await client
    .from('project_versions')
    .select('version_number')
    .eq('project_id', projectId)
    .order('version_number', { ascending: false })
    .limit(1);

  const nextVersionNumber = (latestVersions?.[0]?.version_number ?? 0) + 1;

  // Duplicate as new version
  const { data: newVersion, error: insertError } = await client
    .from('project_versions')
    .insert({
      project_id: projectId,
      version_number: nextVersionNumber,
      label: `Restored from v${versionNumber}`,
      snapshot: version.snapshot,
      style_preset: version.style_preset,
      pages: version.pages,
      sections: version.sections,
      created_by: user.id,
    })
    .select('*')
    .single();

  if (insertError || !newVersion) {
    return NextResponse.json({ error: 'Failed to restore version' }, { status: 500 });
  }

  const projectVersion = ProjectVersionSchema.safeParse({
    id: newVersion.id,
    projectId: newVersion.project_id,
    versionNumber: newVersion.version_number,
    label: newVersion.label,
    snapshot: newVersion.snapshot,
    stylePreset: newVersion.style_preset,
    pages: newVersion.pages ?? [],
    sections: newVersion.sections ?? [],
    createdAt: newVersion.created_at,
  });

  return NextResponse.json({
    success: true,
    newVersion: projectVersion.success ? projectVersion.data : newVersion,
  });
}
