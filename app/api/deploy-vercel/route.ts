import { NextResponse } from 'next/server';
import { z } from 'zod';
import { extractBearerToken, getUserFromToken, createAuthedClient } from '@/lib/db/projects-db';
import { UIOutputSchema } from '@/types/builder';
import { stylePresets } from '@/lib/theme';
import type { UIOutput, Section } from '@/types/builder';

export const runtime = 'nodejs';

const RequestSchema = z.object({
  projectId: z.string().uuid(),
  versionId: z.string().uuid().optional(),
  vercelToken: z.string().min(1),
  projectName: z.string().min(1),
  framework: z.string().default('nextjs'),
});

function sectionToJSX(section: Section): string {
  return `
  <section className="py-16 px-8">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">${section.title}</h2>
      <p className="text-lg opacity-80">${section.content.slice(0, 200).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
    </div>
  </section>`.trim();
}

function generateFiles(uiOutput: UIOutput): Record<string, string> {
  const preset = (uiOutput.stylePreset ?? 'premium') as keyof typeof stylePresets;
  const colors = stylePresets[preset];
  const files: Record<string, string> = {};

  const navLinks = uiOutput.navigation?.links
    .map((l) => `        <a href="${l.href}" className="hover:opacity-75 transition-opacity">${l.label}</a>`)
    .join('\n') ?? '';

  files['components/Navigation.tsx'] = `export function Navigation() {
  return (
    <nav className="flex items-center justify-between px-8 py-4 ${colors.classes} border-b border-white/10">
      <span className="text-xl font-bold">${uiOutput.navigation?.logo ?? uiOutput.title}</span>
      <div className="flex items-center gap-6">
${navLinks}
      </div>
    </nav>
  );
}`;

  for (const page of uiOutput.pages) {
    const filePath = page.isHome ? 'app/page.tsx' : `app/${page.slug}/page.tsx`;
    const sections = page.sections.map(sectionToJSX).join('\n');
    files[filePath] = `import { Navigation } from '@/components/Navigation';

export default function ${page.name.replace(/\s+/g, '')}Page() {
  return (
    <div className="min-h-screen ${colors.classes}">
      <Navigation />
      <main>
        ${sections}
      </main>
    </div>
  );
}`;
  }

  return files;
}

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

  const { projectId, versionId, vercelToken, projectName } = parsed.data;
  const client = createAuthedClient(token);

  // Load version snapshot
  let query = client
    .from('project_versions')
    .select('*')
    .eq('project_id', projectId)
    .order('version_number', { ascending: false })
    .limit(1);

  if (versionId) {
    query = client
      .from('project_versions')
      .select('*')
      .eq('id', versionId)
      .eq('project_id', projectId)
      .limit(1);
  }

  const { data: versions } = await query;
  if (!versions?.length) {
    return NextResponse.json({ error: 'No version found' }, { status: 404 });
  }

  const snapshot = UIOutputSchema.safeParse(versions[0].snapshot);
  if (!snapshot.success) {
    return NextResponse.json({ error: 'Invalid snapshot data' }, { status: 500 });
  }

  const files = generateFiles(snapshot.data);

  // Create Vercel deployment
  const deployPayload = {
    name: projectName,
    framework: 'nextjs',
    target: 'production',
    files: Object.entries(files).map(([file, data]) => ({
      file,
      data,
      encoding: 'utf8',
    })),
  };

  const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${vercelToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(deployPayload),
  });

  if (!deployRes.ok) {
    const errText = await deployRes.text();
    return NextResponse.json({ error: `Vercel deployment failed: ${errText}` }, { status: 500 });
  }

  const deployData = await deployRes.json() as { id: string; url?: string; readyState?: string };
  const deploymentId = deployData.id;
  let deployUrl = deployData.url ? `https://${deployData.url}` : undefined;
  let status = deployData.readyState ?? 'building';

  // Poll for completion (max 3 retries)
  for (let i = 0; i < 3 && status !== 'READY' && status !== 'ERROR'; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const pollRes = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
      headers: { Authorization: `Bearer ${vercelToken}` },
    });
    if (pollRes.ok) {
      const pollData = await pollRes.json() as { url?: string; readyState?: string };
      status = pollData.readyState ?? status;
      if (pollData.url) deployUrl = `https://${pollData.url}`;
    }
  }

  // Save deployment record
  const deployStatus = status === 'READY' ? 'success' : status === 'ERROR' ? 'error' : 'building';
  const { data: deploymentRow } = await client
    .from('project_deployments')
    .insert({
      project_id: projectId,
      provider: 'vercel',
      deploy_url: deployUrl ?? null,
      status: deployStatus,
      deployed_at: deployStatus === 'success' ? new Date().toISOString() : null,
    })
    .select('id')
    .single();

  return NextResponse.json({
    success: true,
    deployUrl,
    deploymentId: deploymentRow?.id,
    vercelDeploymentId: deploymentId,
  });
}
