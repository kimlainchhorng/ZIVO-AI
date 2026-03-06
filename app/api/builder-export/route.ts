import { NextResponse } from 'next/server';
import { z } from 'zod';
import JSZip from 'jszip';
import { extractBearerToken, getUserFromToken, createAuthedClient } from '@/lib/db/projects-db';
import { UIOutputSchema } from '@/types/builder';
import { stylePresets } from '@/lib/theme';
import type { UIOutput, Section } from '@/types/builder';

export const runtime = 'nodejs';

const RequestSchema = z.object({
  projectId: z.string().uuid(),
  versionId: z.string().uuid().optional(),
  exportType: z.enum(['react', 'nextjs', 'tailwind', 'zip']),
});

/** Converts a snake_case/kebab-case section type to a PascalCase React component name. */
function toComponentName(raw: string): string {
  const pascal = raw
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/(?:^|_)([a-z])/g, (_, l: string) => l.toUpperCase());
  // Ensure the identifier doesn't start with a digit
  return /^\d/.test(pascal) ? `S${pascal}` : pascal;
}

/** Sanitizes a human-readable page name into a valid PascalCase JS identifier. */
function toPageIdentifier(name: string): string {
  const pascal = name
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .replace(/(?:^|\s)([a-zA-Z0-9])/g, (_, c: string) => c.toUpperCase());
  return /^\d/.test(pascal) ? `Page${pascal}` : pascal || 'Page';
}

/** Escapes a string for safe embedding inside a JSX text node or attribute. */
function escapeJSX(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sectionToComponent(section: Section, preset: keyof typeof stylePresets = 'premium'): string {
  const colors = stylePresets[preset];
  const bgStyle = section.bgColor ? `style={{ backgroundColor: '${escapeJSX(section.bgColor)}' }}` : '';
  const name = toComponentName(section.type);
  const safeTitle = escapeJSX(section.title);
  const safeContent = escapeJSX(section.content.slice(0, 200));
  return `
function ${name}Section() {
  return (
    <section className="py-16 px-8 ${colors.classes}" ${bgStyle}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">${safeTitle}</h2>
        <p className="text-lg opacity-80">${safeContent}</p>
      </div>
    </section>
  );
}`.trim();
}

function generateReactApp(uiOutput: UIOutput): Record<string, string> {
  const preset = (uiOutput.stylePreset ?? 'premium') as keyof typeof stylePresets;
  const colors = stylePresets[preset];

  const allSections = uiOutput.pages.flatMap((p) => p.sections);
  const components = allSections.map((s) => sectionToComponent(s, preset)).join('\n\n');

  const sectionRenders = allSections
    .map((s) => `      <${toComponentName(s.type)}Section />`)
    .join('\n');

  const navLinks = uiOutput.navigation?.links
    .map((l) => `          <a href="${l.href}" className="hover:opacity-75 transition-opacity">${l.label}</a>`)
    .join('\n') ?? '';

  return {
    'App.tsx': `'use client';
import React from 'react';

// Navigation
function Navigation() {
  return (
    <nav className="flex items-center justify-between px-8 py-4 ${colors.classes} border-b border-white/10">
      <span className="text-xl font-bold">${uiOutput.navigation?.logo ?? uiOutput.title}</span>
      <div className="flex items-center gap-6">
${navLinks}
      </div>
    </nav>
  );
}

${components}

// Footer
function Footer() {
  return (
    <footer className="py-8 px-8 ${colors.classes} border-t border-white/10 text-center">
      <p className="opacity-60">${uiOutput.footer?.copyright ?? `© ${new Date().getFullYear()} ${uiOutput.title}. All rights reserved.`}</p>
    </footer>
  );
}

export default function App() {
  return (
    <div className="min-h-screen ${colors.classes}">
      <Navigation />
      <main>
${sectionRenders}
      </main>
      <Footer />
    </div>
  );
}`,
  };
}

function generateNextjsApp(uiOutput: UIOutput): Record<string, string> {
  const preset = (uiOutput.stylePreset ?? 'premium') as keyof typeof stylePresets;
  const colors = stylePresets[preset];
  const files: Record<string, string> = {};

  // Navigation component
  const navLinks = uiOutput.navigation?.links
    .map((l) => `        <Link href="${l.href}" className="hover:opacity-75 transition-opacity">${l.label}</Link>`)
    .join('\n') ?? '';

  files['components/Navigation.tsx'] = `import Link from 'next/link';

export function Navigation() {
  return (
    <nav className="flex items-center justify-between px-8 py-4 ${colors.classes} border-b border-white/10">
      <Link href="/" className="text-xl font-bold">${uiOutput.navigation?.logo ?? uiOutput.title}</Link>
      <div className="flex items-center gap-6">
${navLinks}
      </div>
    </nav>
  );
}`;

  // Footer component
  files['components/Footer.tsx'] = `export function Footer() {
  return (
    <footer className="py-8 px-8 ${colors.classes} border-t border-white/10 text-center">
      <p className="opacity-60">${uiOutput.footer?.copyright ?? `© ${new Date().getFullYear()} ${uiOutput.title}. All rights reserved.`}</p>
    </footer>
  );
}`;

  // Generate page files
  for (const page of uiOutput.pages) {
    const path = page.isHome ? 'app/page.tsx' : `app/${page.slug}/page.tsx`;
    const sectionComponents = page.sections.map((s) => sectionToComponent(s, preset)).join('\n\n');
    const sectionRenders = page.sections
      .map((s) => `      <${toComponentName(s.type)}Section />`)
      .join('\n');

    files[path] = `import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

${sectionComponents}

export default function ${toPageIdentifier(page.name)}Page() {
  return (
    <div className="min-h-screen ${colors.classes}">
      <Navigation />
      <main>
${sectionRenders}
      </main>
      <Footer />
    </div>
  );
}`;
  }

  // tailwind.config.ts
  files['tailwind.config.ts'] = `import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '${colors.primaryColor}',
      },
      fontFamily: {
        sans: ['${colors.fontFamily.split(',')[0].trim()}', 'sans-serif'],
      },
      borderRadius: {
        brand: '${colors.borderRadius}',
      },
    },
  },
  plugins: [],
};

export default config;`;

  return files;
}

function generateTailwindComponents(uiOutput: UIOutput): Record<string, string> {
  const preset = (uiOutput.stylePreset ?? 'premium') as keyof typeof stylePresets;
  const files: Record<string, string> = {};
  const allSections = uiOutput.pages.flatMap((p) => p.sections);

  for (const section of allSections) {
    const name = toComponentName(section.type);
    files[`components/${name}Section.tsx`] = `${sectionToComponent(section, preset)}

export { ${name}Section };`;
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

  const { projectId, versionId, exportType } = parsed.data;
  const client = createAuthedClient(token);

  // Load version
  let versionQuery = client
    .from('project_versions')
    .select('*')
    .eq('project_id', projectId)
    .order('version_number', { ascending: false })
    .limit(1);

  if (versionId) {
    versionQuery = client
      .from('project_versions')
      .select('*')
      .eq('id', versionId)
      .eq('project_id', projectId)
      .limit(1);
  }

  const { data: versions, error: versionError } = await versionQuery;
  if (versionError || !versions?.length) {
    return NextResponse.json({ error: 'No version found for this project' }, { status: 404 });
  }

  const snapshot = UIOutputSchema.safeParse(versions[0].snapshot);
  if (!snapshot.success) {
    return NextResponse.json({ error: 'Invalid snapshot data' }, { status: 500 });
  }

  const uiOutput = snapshot.data;
  let files: Record<string, string> = {};

  switch (exportType) {
    case 'react':
      files = generateReactApp(uiOutput);
      break;
    case 'nextjs':
      files = generateNextjsApp(uiOutput);
      break;
    case 'tailwind':
      files = generateTailwindComponents(uiOutput);
      break;
    case 'zip': {
      files = generateNextjsApp(uiOutput);
      const zip = new JSZip();
      for (const [filePath, content] of Object.entries(files)) {
        zip.file(filePath, content);
      }
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      const base64 = zipBuffer.toString('base64');
      return new NextResponse(base64, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${uiOutput.title.replace(/\s+/g, '-').toLowerCase()}.zip"`,
          'Content-Transfer-Encoding': 'base64',
        },
      });
    }
  }

  return NextResponse.json({ success: true, files });
}
