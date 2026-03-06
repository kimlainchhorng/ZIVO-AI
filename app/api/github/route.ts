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
  repoName: z.string().min(1).regex(/^[a-zA-Z0-9_.-]+$/, 'Invalid repo name'),
  githubToken: z.string().min(1),
  branch: z.string().default('main'),
  commitMessage: z.string().default('Deploy from ZIVO-AI'),
});

function toPageIdentifier(name: string): string {
  const pascal = name
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .replace(/(?:^|\s)([a-zA-Z0-9])/g, (_, c: string) => c.toUpperCase());
  return /^\d/.test(pascal) ? `Page${pascal}` : pascal || 'Page';
}

function escapeJSX(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sectionToJSX(section: Section): string {
  return `
  <section className="py-16 px-8">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">${escapeJSX(section.title)}</h2>
      <p className="text-lg opacity-80">${escapeJSX(section.content.slice(0, 200))}</p>
    </div>
  </section>`.trim();
}

function generateFiles(uiOutput: UIOutput): Record<string, string> {
  const preset = (uiOutput.stylePreset ?? 'premium') as keyof typeof stylePresets;
  const colors = stylePresets[preset];
  const files: Record<string, string> = {};

  const navLinks = uiOutput.navigation?.links
    .map((l) => `        <a href="${escapeJSX(l.href)}" className="hover:opacity-75 transition-opacity">${escapeJSX(l.label)}</a>`)
    .join('\n') ?? '';

  files['components/Navigation.tsx'] = `export function Navigation() {
  return (
    <nav className="flex items-center justify-between px-8 py-4 ${colors.classes} border-b border-white/10">
      <span className="text-xl font-bold">${escapeJSX(uiOutput.navigation?.logo ?? uiOutput.title)}</span>
      <div className="flex items-center gap-6">
${navLinks}
      </div>
    </nav>
  );
}`;

  files['components/Footer.tsx'] = `export function Footer() {
  return (
    <footer className="py-8 px-8 ${colors.classes} border-t border-white/10 text-center">
      <p className="opacity-60">${escapeJSX(uiOutput.footer?.copyright ?? `© ${new Date().getFullYear()} ${uiOutput.title}`)}</p>
    </footer>
  );
}`;

  for (const page of uiOutput.pages) {
    const filePath = page.isHome ? 'app/page.tsx' : `app/${page.slug}/page.tsx`;
    const sections = page.sections.map(sectionToJSX).join('\n');
    files[filePath] = `import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export default function ${toPageIdentifier(page.name)}Page() {
  return (
    <div className="min-h-screen ${colors.classes}">
      <Navigation />
      <main>
        ${sections}
      </main>
      <Footer />
    </div>
  );
}`;
  }

  return files;
}

async function githubRequest(url: string, token: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
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

  const { projectId, versionId, repoName, githubToken, branch, commitMessage } = parsed.data;
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

  // Get GitHub user info
  const meRes = await githubRequest('https://api.github.com/user', githubToken, 'GET');
  if (!meRes.ok) {
    return NextResponse.json({ error: 'Invalid GitHub token' }, { status: 401 });
  }
  const me = await meRes.json() as { login: string };
  const owner = me.login;

  // Check/create repo
  const repoCheckRes = await githubRequest(`https://api.github.com/repos/${owner}/${repoName}`, githubToken, 'GET');
  if (!repoCheckRes.ok) {
    const createRes = await githubRequest('https://api.github.com/user/repos', githubToken, 'POST', {
      name: repoName,
      description: `Generated by ZIVO-AI`,
      auto_init: true,
      private: false,
    });
    if (!createRes.ok) {
      const err = await createRes.text();
      return NextResponse.json({ error: `Failed to create repo: ${err}` }, { status: 500 });
    }
    // Wait briefly for init
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  const repoUrl = `https://github.com/${owner}/${repoName}`;

  // Push each file
  for (const [filePath, content] of Object.entries(files)) {
    const encodedContent = Buffer.from(content, 'utf8').toString('base64');

    // Check if file exists to get sha
    const existingRes = await githubRequest(
      `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`,
      githubToken,
      'GET'
    );
    const existingData = existingRes.ok ? (await existingRes.json() as { sha?: string }) : null;

    await githubRequest(
      `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`,
      githubToken,
      'PUT',
      {
        message: commitMessage,
        content: encodedContent,
        branch,
        ...(existingData?.sha ? { sha: existingData.sha } : {}),
      }
    );
  }

  // Save deployment record
  const { data: deploymentRow } = await client
    .from('project_deployments')
    .insert({
      project_id: projectId,
      provider: 'github',
      github_repo: `${owner}/${repoName}`,
      github_branch: branch,
      status: 'success',
      deployed_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  return NextResponse.json({
    success: true,
    repoUrl,
    deploymentId: deploymentRow?.id,
  });
}
