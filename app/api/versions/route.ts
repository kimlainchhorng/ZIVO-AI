import { NextResponse } from 'next/server';
import { versionHistory } from '../../../lib/version-history';
import { extractBearerToken, getUserFromToken, createAuthedClient } from '@/lib/db/projects-db';
import { z } from 'zod';
import { ProjectVersionSchema } from '@/types/builder';

export const runtime = 'nodejs';

interface VersionFile {
  path: string;
  content: string;
}

function mapVersion(row: Record<string, unknown>) {
  return ProjectVersionSchema.safeParse({
    id: row.id,
    projectId: row.project_id,
    versionNumber: row.version_number,
    label: row.label,
    snapshot: row.snapshot,
    stylePreset: row.style_preset,
    pages: row.pages ?? [],
    sections: row.sections ?? [],
    createdAt: row.created_at,
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ error: 'projectId query parameter is required' }, { status: 400 });
  }

  // Try Supabase project_versions first if authenticated
  const token = extractBearerToken(req.headers.get('Authorization'));
  if (token) {
    const user = await getUserFromToken(token);
    if (user) {
      // Validate UUID
      const uuidCheck = z.string().uuid().safeParse(projectId);
      if (uuidCheck.success) {
        const client = createAuthedClient(token);
        const { data, error } = await client
          .from('project_versions')
          .select('*')
          .eq('project_id', projectId)
          .order('version_number', { ascending: false });

        if (!error) {
          const versions = (data ?? []).map((row) => {
            const parsed = mapVersion(row as Record<string, unknown>);
            return parsed.success ? parsed.data : row;
          });
          return NextResponse.json({ versions });
        }
      }
    }
  }

  // Fallback to in-memory version history (legacy)
  const versions = versionHistory.getVersions(projectId);
  return NextResponse.json({ versions });
}

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { projectId, files, label } = body as {
      projectId?: string;
      files?: unknown;
      label?: string;
    };

    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }
    if (!Array.isArray(files)) {
      return NextResponse.json({ error: 'files must be an array' }, { status: 400 });
    }
    for (const f of files) {
      if (!f || typeof (f as VersionFile).path !== 'string' || typeof (f as VersionFile).content !== 'string') {
        return NextResponse.json(
          { error: 'Each file must have path (string) and content (string)' },
          { status: 400 }
        );
      }
    }

    const version = versionHistory.snapshot(projectId, files as VersionFile[], label);
    return NextResponse.json({ version }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
