import JSZip from 'jszip';
import type { Section, Page } from '@/types/builder';

// ─── React Component Export ───────────────────────────────────────────────────

export async function exportAsReactComponent(sections: Section[]): Promise<string> {
  const imports = `import React from 'react';\n\n`;
  const sectionComponents = sections
    .map((s, i) => {
      const componentName = `${_toPascalCase(s.type)}Section${i + 1}`;
      return `function ${componentName}() {\n  return (\n    <section dangerouslySetInnerHTML={{ __html: ${JSON.stringify(s.content)} }} />\n  );\n}`;
    })
    .join('\n\n');

  const exportedNames = sections
    .map((s, i) => `${_toPascalCase(s.type)}Section${i + 1}`)
    .join(', ');

  const page = `export default function GeneratedPage() {\n  return (\n    <main>\n      ${sections.map((s, i) => `<${_toPascalCase(s.type)}Section${i + 1} />`).join('\n      ')}\n    </main>\n  );\n}\n\nexport { ${exportedNames} };`;

  return `${imports}${sectionComponents}\n\n${page}`;
}

// ─── Next.js Page Export ──────────────────────────────────────────────────────

export async function exportAsNextjsPage(page: Page): Promise<string> {
  const sectionsCode = page.sections
    .map(
      (s) =>
        `  /* ${s.title} */\n  <section key="${s.id}" style={{ background: '${s.bgColor ?? ''}', color: '${s.textColor ?? ''}', padding: '${s.spacing ?? 'md'}' }} dangerouslySetInnerHTML={{ __html: ${JSON.stringify(s.content)} }} />`
    )
    .join(',\n');

  return `import type { NextPage } from 'next';\nimport Head from 'next/head';\n\nconst ${_toPascalCase(page.name)}Page: NextPage = () => {\n  return (\n    <>\n      <Head>\n        <title>${_escapeHtml(page.name)}</title>\n      </Head>\n      <main>\n${sectionsCode}\n      </main>\n    </>\n  );\n};\n\nexport default ${_toPascalCase(page.name)}Page;\n`;
}

// ─── Tailwind Components Export ───────────────────────────────────────────────

export async function exportAsTailwindComponents(sections: Section[]): Promise<string> {
  const components = sections
    .map((s) => {
      const name = _toPascalCase(`${s.type} section`);
      const escaped = s.content.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
      return `/* ${s.title} */\nexport function ${name}() {\n  return (\n    <section\n      className="${s.bgColor ? '' : 'bg-background'} text-foreground py-16 px-8"\n      dangerouslySetInnerHTML={{ __html: \`${escaped}\` }}\n    />\n  );\n}`;
    })
    .join('\n\n');

  return `'use client';\n\n${components}\n`;
}

// ─── ZIP Export ───────────────────────────────────────────────────────────────

export async function exportAsZip(project: {
  title: string;
  pages: Page[];
}): Promise<Blob> {
  const zip = new JSZip();
  const src = zip.folder('src');
  const components = src?.folder('components');
  const pages = src?.folder('pages');

  // Generate page files
  for (const page of project.pages) {
    const code = await exportAsNextjsPage(page);
    pages?.file(`${page.slug || page.name}.tsx`, code);

    // Generate section components for this page
    for (const section of page.sections) {
      const name = `${_toPascalCase(section.type)}Section`;
      const code = `'use client';\n\nexport function ${name}() {\n  return (\n    <section dangerouslySetInnerHTML={{ __html: ${JSON.stringify(section.content)} }} />\n  );\n}\n`;
      components?.file(`${name}.tsx`, code);
    }
  }

  // package.json
  zip.file(
    'package.json',
    JSON.stringify(
      {
        name: _toKebabCase(project.title),
        version: '0.1.0',
        private: true,
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start',
        },
        dependencies: {
          next: '^15.0.0',
          react: '^19.0.0',
          'react-dom': '^19.0.0',
          typescript: '^5.0.0',
        },
        devDependencies: {
          '@types/react': '^19.0.0',
          '@types/node': '^20.0.0',
          tailwindcss: '^4.0.0',
        },
      },
      null,
      2
    )
  );

  // README
  zip.file(
    'README.md',
    `# ${project.title}\n\nGenerated with ZIVO-AI Builder.\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\nOpen [http://localhost:3000](http://localhost:3000) to view the app.\n`
  );

  // tsconfig.json
  zip.file(
    'tsconfig.json',
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2017',
          lib: ['dom', 'dom.iterable', 'esnext'],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: 'esnext',
          moduleResolution: 'bundler',
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: 'preserve',
          incremental: true,
          paths: { '@/*': ['./src/*'] },
        },
        include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'],
        exclude: ['node_modules'],
      },
      null,
      2
    )
  );

  return zip.generateAsync({ type: 'blob' });
}

// ─── Copy-able Code ───────────────────────────────────────────────────────────

export function generateCopyableCode(section: Section): string {
  const name = _toPascalCase(`${section.type} Section`);
  return `'use client';\n\n/** ${section.title} */\nexport function ${name}() {\n  return (\n    <section\n      style={{\n        background: '${section.bgColor ?? 'transparent'}',\n        color: '${section.textColor ?? 'inherit'}',\n        padding: '4rem 2rem',\n        borderRadius: '${section.borderRadius ?? '0'}',\n      }}\n      dangerouslySetInnerHTML={{ __html: ${JSON.stringify(section.content)} }}\n    />\n  );\n}\n`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _toPascalCase(str: string): string {
  return str
    .replace(/[_-]/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

function _toKebabCase(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function _escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
