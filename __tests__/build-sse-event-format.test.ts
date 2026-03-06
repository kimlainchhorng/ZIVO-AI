// __tests__/build-sse-event-format.test.ts
// Unit tests for the /api/build SSE endpoint event structure and manifest legal pages

import { describe, it, expect } from 'vitest';
import { getDefaultManifestFilesForTest, LEGAL_PAGE_PATHS } from './helpers/manifest-helpers';
import { buildWebsiteManifest } from '@/lib/ai/manifest-builders';
import { runCompletenessGate, summarizeCompletenessGate } from '@/lib/ai/validators/completeness-gate';
import type { WebsitePlan } from '@/lib/ai/website-plan';
import type { GeneratedFile } from '@/lib/ai/schema';

/**
 * We export a testable helper from the manifest module so tests don't need
 * to call the real OpenAI API.
 */

/** Minimal mock WebsitePlan for testing buildWebsiteManifest */
const MOCK_PLAN: WebsitePlan = {
  brand: {
    name: 'TestCo',
    tagline: 'Test tagline',
    tone: 'professional',
    primaryColor: '#6366f1',
    fontStyle: 'sans',
  },
  pages: [
    {
      route: '/',
      title: 'Home',
      sections: [{ type: 'hero', content: { headline: 'Hello' } }],
    },
  ],
  assets: {
    heroImageConcept: 'abstract',
    featureImageConcepts: ['feature 1'],
    avatarConcepts: ['person'],
  },
};

/** Required blog paths that buildWebsiteManifest must always include */
const BLOG_PAGE_PATHS = [
  'app/blog/page.tsx',
  'app/blog/[slug]/page.tsx',
  'lib/content/blog-posts.ts',
] as const;

describe('SSE event format', () => {
  it('stage event has required shape', () => {
    const event = {
      type: 'stage' as const,
      stage: 'BLUEPRINT' as const,
      message: 'Generating blueprint…',
      progress: 5,
    };

    expect(event.type).toBe('stage');
    expect(['BLUEPRINT', 'MANIFEST', 'GENERATE', 'VALIDATE', 'FIX', 'DONE']).toContain(event.stage);
    expect(typeof event.message).toBe('string');
    expect(typeof event.progress).toBe('number');
    expect(event.progress).toBeGreaterThanOrEqual(0);
    expect(event.progress).toBeLessThanOrEqual(100);
  });

  it('files event has required shape', () => {
    const event = {
      type: 'files' as const,
      files: [
        { path: 'app/page.tsx', content: 'export default function Page() {}', action: 'create' as const },
      ],
    };

    expect(event.type).toBe('files');
    expect(Array.isArray(event.files)).toBe(true);
    expect(event.files.length).toBeGreaterThan(0);
    for (const f of event.files) {
      expect(typeof f.path).toBe('string');
      expect(typeof f.content).toBe('string');
      expect(['create', 'update', 'delete']).toContain(f.action);
    }
  });

  it('error event has required shape', () => {
    const event = {
      type: 'error' as const,
      message: 'Build pipeline error',
    };

    expect(event.type).toBe('error');
    expect(typeof event.message).toBe('string');
    expect(event.message.length).toBeGreaterThan(0);
  });

  it('SSE wire format is correctly encoded', () => {
    const event = { type: 'stage', stage: 'DONE', message: 'Build complete', progress: 100 };
    const encoded = `data: ${JSON.stringify(event)}\n\n`;

    expect(encoded.startsWith('data: ')).toBe(true);
    expect(encoded.endsWith('\n\n')).toBe(true);

    const parsed = JSON.parse(encoded.slice(6).trimEnd()) as typeof event;
    expect(parsed.type).toBe('stage');
    expect(parsed.stage).toBe('DONE');
  });

  it('new stage types are valid SSE stage values', () => {
    const newStages = ['SECURITY_NOTE_CI', 'COMPLETENESS_GATE', 'COMPLETENESS_GATE_FAILED'];
    for (const stage of newStages) {
      const event = { type: 'stage', stage, message: `${stage} message`, progress: 50 };
      const encoded = `data: ${JSON.stringify(event)}\n\n`;
      const parsed = JSON.parse(encoded.slice(6).trimEnd()) as typeof event;
      expect(parsed.stage).toBe(stage);
    }
  });
});

describe('Manifest legal pages', () => {
  const defaultFiles = getDefaultManifestFilesForTest();

  it.each(LEGAL_PAGE_PATHS)('default manifest includes %s', (legalPath) => {
    const found = defaultFiles.some((f) => f.path === legalPath);
    expect(found, `Expected "${legalPath}" in default manifest`).toBe(true);
  });

  it('all legal pages have priority 8', () => {
    for (const legalPath of LEGAL_PAGE_PATHS) {
      const file = defaultFiles.find((f) => f.path === legalPath);
      expect(file?.priority, `"${legalPath}" should have priority 8`).toBe(8);
    }
  });

  it('Footer.tsx is in default manifest', () => {
    const found = defaultFiles.some((f) => f.path === 'components/Footer.tsx');
    expect(found).toBe(true);
  });

  it('FILE_LIST_SYSTEM_PROMPT requires legal pages', async () => {
    const { FILE_LIST_SYSTEM_PROMPT_FOR_TEST } = await import('./helpers/manifest-helpers');
    for (const legalPath of LEGAL_PAGE_PATHS) {
      expect(FILE_LIST_SYSTEM_PROMPT_FOR_TEST).toContain(legalPath);
    }
  });
});

describe('Website manifest — blog pages always included', () => {
  const manifest = buildWebsiteManifest(MOCK_PLAN);
  const manifestPaths = manifest.files.map((f) => f.path);

  it.each(BLOG_PAGE_PATHS)('manifest always includes %s', (blogPath) => {
    expect(manifestPaths, `Expected "${blogPath}" in website manifest`).toContain(blogPath);
  });

  it('blog-posts.ts depends on lib/assets.ts', () => {
    const blogPostsFile = manifest.files.find((f) => f.path === 'lib/content/blog-posts.ts');
    expect(blogPostsFile).toBeDefined();
    expect(blogPostsFile?.dependencies).toContain('lib/assets.ts');
  });

  it('app/blog/page.tsx depends on lib/content/blog-posts.ts', () => {
    const blogListFile = manifest.files.find((f) => f.path === 'app/blog/page.tsx');
    expect(blogListFile).toBeDefined();
    expect(blogListFile?.dependencies).toContain('lib/content/blog-posts.ts');
  });

  it('app/blog/[slug]/page.tsx depends on lib/content/blog-posts.ts', () => {
    const blogPostFile = manifest.files.find((f) => f.path === 'app/blog/[slug]/page.tsx');
    expect(blogPostFile).toBeDefined();
    expect(blogPostFile?.dependencies).toContain('lib/content/blog-posts.ts');
  });

  it('manifest still includes required core pages', () => {
    const corePaths = ['app/page.tsx', 'app/about/page.tsx', 'app/contact/page.tsx'];
    for (const p of corePaths) {
      expect(manifestPaths, `Expected core page "${p}" in manifest`).toContain(p);
    }
  });
});

describe('CompletenessGate', () => {
  /** Build a minimal set of files that satisfies all completeness requirements */
  function buildCompleteFileset(): GeneratedFile[] {
    const requiredPaths = [
      'app/app/page.tsx',
      'app/page.tsx',
      'app/about/page.tsx',
      'app/contact/page.tsx',
      'app/features/page.tsx',
      'app/pricing/page.tsx',
      'app/faq/page.tsx',
      'app/blog/page.tsx',
      'app/blog/[slug]/page.tsx',
      'lib/content/blog-posts.ts',
      'app/(legal)/terms/page.tsx',
      'app/(legal)/privacy/page.tsx',
      'app/(legal)/cookies/page.tsx',
      'app/(legal)/acceptable-use/page.tsx',
      'app/(legal)/disclaimer/page.tsx',
      'lib/assets.ts',
      'components/brand/Logo.tsx',
      'components/site/Header.tsx',
      'components/site/Footer.tsx',
    ];
    return requiredPaths.map((path) => ({
      path,
      content: buildMinimalContent(path),
      action: 'create' as const,
    }));
  }

  function buildMinimalContent(path: string): string {
    if (path === 'app/blog/page.tsx') {
      return `import { blogPosts } from "@/lib/content/blog-posts";\nexport default function BlogPage() { return <>{blogPosts.map(p => <img key={p.slug} src={p.coverImage} alt={p.title}/>)}</> }`;
    }
    if (path === 'app/blog/[slug]/page.tsx') {
      return `import { blogPosts } from "@/lib/content/blog-posts";\nexport default function BlogPost({ params }: { params: { slug: string } }) { const post = blogPosts.find(p => p.slug === params.slug); return <div>{post?.title}</div>; }`;
    }
    if (path === 'lib/assets.ts') {
      return `export const brand = { name: "Test" };\nexport const brandLogoSvg = "<svg/>";\nexport const images = { hero: "https://picsum.photos/id/1040/1600/900", features: [], avatars: [] };`;
    }
    if (path === 'app/layout.tsx') {
      return `import Header from "@/components/site/Header";\nimport Footer from "@/components/site/Footer";\nexport default function Layout({ children }: { children: React.ReactNode }) { return <><Header/>{children}<Footer/></> }`;
    }
    return `export default function Component() { return <div>${path}</div>; }`;
  }

  it('passes when all required files are present with correct wiring', () => {
    const files = buildCompleteFileset();
    const result = runCompletenessGate(files);
    expect(result.passed).toBe(true);
    expect(result.issues.filter((i) => i.severity === 'error')).toHaveLength(0);
  });

  it('fails when blog list page is missing', () => {
    const files = buildCompleteFileset().filter((f) => f.path !== 'app/blog/page.tsx');
    const result = runCompletenessGate(files);
    expect(result.passed).toBe(false);
    const issue = result.issues.find((i) => i.rule === 'required-file:app/blog/page.tsx');
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe('error');
  });

  it('fails when blog post page is missing', () => {
    const files = buildCompleteFileset().filter((f) => f.path !== 'app/blog/[slug]/page.tsx');
    const result = runCompletenessGate(files);
    expect(result.passed).toBe(false);
    const issue = result.issues.find((i) => i.rule === 'required-file:app/blog/[slug]/page.tsx');
    expect(issue).toBeDefined();
  });

  it('fails when blog-posts.ts is missing', () => {
    const files = buildCompleteFileset().filter((f) => f.path !== 'lib/content/blog-posts.ts');
    const result = runCompletenessGate(files);
    expect(result.passed).toBe(false);
    const issue = result.issues.find((i) => i.rule === 'required-file:lib/content/blog-posts.ts');
    expect(issue).toBeDefined();
  });

  it('errors when blog list page does not import blogPosts', () => {
    const files = buildCompleteFileset().map((f) =>
      f.path === 'app/blog/page.tsx'
        ? { ...f, content: 'export default function BlogPage() { return <div>Blog</div>; }' }
        : f
    );
    const result = runCompletenessGate(files);
    const issue = result.issues.find((i) => i.rule === 'blog-list-uses-posts');
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe('error');
  });

  it('errors when blog post page does not import blogPosts', () => {
    const files = buildCompleteFileset().map((f) =>
      f.path === 'app/blog/[slug]/page.tsx'
        ? { ...f, content: 'export default function ArticlePage() { return <div>Post</div>; }' }
        : f
    );
    const result = runCompletenessGate(files);
    const issue = result.issues.find((i) => i.rule === 'blog-post-uses-posts');
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe('error');
  });

  it('errors when lib/assets.ts is missing required exports', () => {
    const files = buildCompleteFileset().map((f) =>
      f.path === 'lib/assets.ts'
        ? { ...f, content: 'export const dummy = true;' }
        : f
    );
    const result = runCompletenessGate(files);
    const issue = result.issues.find((i) => i.rule === 'assets-exports-image-sets');
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe('error');
  });

  it('missingItems lists human-readable descriptions for all errors', () => {
    const files: GeneratedFile[] = []; // Empty — everything is missing
    const result = runCompletenessGate(files);
    expect(result.passed).toBe(false);
    expect(result.missingItems.length).toBeGreaterThan(0);
    for (const item of result.missingItems) {
      expect(typeof item).toBe('string');
      expect(item.length).toBeGreaterThan(0);
    }
  });

  it('summarizeCompletenessGate returns pass message when no issues', () => {
    const files = buildCompleteFileset();
    const result = runCompletenessGate(files);
    const summary = summarizeCompletenessGate(result);
    expect(typeof summary).toBe('string');
    if (result.passed && result.issues.length === 0) {
      expect(summary).toContain('passed');
    }
  });

  it('summarizeCompletenessGate mentions error count when failing', () => {
    const files: GeneratedFile[] = [];
    const result = runCompletenessGate(files);
    const summary = summarizeCompletenessGate(result);
    expect(summary).toContain('missing');
  });

  it('fails when SaaS /app route (app/app/page.tsx) is missing', () => {
    const files = buildCompleteFileset().filter((f) => f.path !== 'app/app/page.tsx');
    const result = runCompletenessGate(files);
    expect(result.passed).toBe(false);
    const issue = result.issues.find((i) => i.rule === 'required-file:app/app/page.tsx');
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe('error');
  });

  it('missingSaasRoutes is empty when all SaaS-standard routes are present', () => {
    const files = buildCompleteFileset();
    const result = runCompletenessGate(files);
    expect(result.missingSaasRoutes).toHaveLength(0);
  });

  it('missingSaasRoutes lists /app when app/app/page.tsx is absent', () => {
    const files = buildCompleteFileset().filter((f) => f.path !== 'app/app/page.tsx');
    const result = runCompletenessGate(files);
    expect(result.missingSaasRoutes).toContain('/app');
  });
});

