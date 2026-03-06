import { NextResponse } from 'next/server';
import { extractBearerToken, getUserFromToken, createAuthedClient, getProjectById, createProject } from '@/lib/db/projects-db';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
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
    const sourceProject = await getProjectById(token, id);
    if (!sourceProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const client = createAuthedClient(token);

    // Fetch latest version of source project
    const { data: latestVersion } = await client
      .from('project_versions')
      .select('*')
      .eq('project_id', id)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    // Create new project as copy
    const newProject = await createProject(token, user.id, {
      title: `${sourceProject.title} (Copy)`,
      mode: sourceProject.mode,
      template: sourceProject.template ?? undefined,
      client_idea: sourceProject.client_idea ?? undefined,
    });

    // Duplicate latest version as version 1 of new project
    if (latestVersion) {
      await client.from('project_versions').insert({
        project_id: newProject.id,
        version_number: 1,
        label: 'Duplicated from original',
        snapshot: latestVersion.snapshot,
        style_preset: latestVersion.style_preset,
        pages: latestVersion.pages,
        sections: latestVersion.sections,
        created_by: user.id,
      });
    }

    return NextResponse.json({ success: true, project: newProject });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message ?? 'Failed to duplicate project' }, { status: 500 });
  }
}
