// lib/ai/file-list-generator.ts — Generates a full file manifest from a user prompt

import OpenAI from 'openai';
import type { Blueprint } from './blueprint-generator';
import type { ManifestFile, FileType } from './manifest';
import { safeParseJSON } from './json-repair';

/** @internal Exported for testing — the system prompt used when generating the file list */
export const FILE_LIST_SYSTEM_PROMPT = `You are a full-stack architect. Given a prompt and blueprint, enumerate EVERY file the project needs — 20 to 200 files.

Return ONLY a valid JSON array of file descriptors (no markdown fences):
[
  {
    "path": "app/page.tsx",
    "type": "page",
    "description": "Home page with hero and features",
    "dependencies": ["components/Hero.tsx", "components/Features.tsx"],
    "priority": 1
  }
]

Types: page | component | api | db | auth | config | style | test | util

REQUIRED files you MUST include:
- app/layout.tsx (config, priority 1)
- app/page.tsx (page, priority 2)
- app/(auth)/login/page.tsx (auth, priority 3)
- app/(auth)/signup/page.tsx (auth, priority 3)
- middleware.ts (auth, priority 2)
- lib/db.ts (db, priority 2)
- lib/auth.ts (auth, priority 2)
- prisma/schema.prisma (db, priority 1)
- prisma/seed.ts (db, priority 5)
- package.json (config, priority 1)
- .env.example (config, priority 1)
- tailwind.config.ts (config, priority 1)
- tsconfig.json (config, priority 1)
- README.md (util, priority 10)
- ALL pages listed in blueprint
- ALL components listed in blueprint
- ALL API routes listed in blueprint
- CRUD API routes for every table

LEGAL PAGES — you MUST include ALL of the following for every full-app build:
- app/(legal)/terms/page.tsx (page, priority 8) — Terms of Service with placeholders for company name, contact email, effective date
- app/(legal)/privacy/page.tsx (page, priority 8) — Privacy Policy with GDPR/CCPA-style placeholders
- app/(legal)/cookies/page.tsx (page, priority 8) — Cookie Policy with cookie-type table
- app/(legal)/acceptable-use/page.tsx (page, priority 8) — Acceptable Use Policy
- app/(legal)/disclaimer/page.tsx (page, priority 8) — General Disclaimer
- components/Footer.tsx (component, priority 3) — Site-wide footer with links to all legal pages

Rules:
- Priority 1 = highest (generated first)
- Priority 10 = lowest
- Every page in the blueprint must have an entry
- Every table must have an API route file
- Include loading.tsx and error.tsx for major pages
- Legal pages must use generic template language — do NOT include jurisdiction-specific legal advice`;

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

interface RawManifestFile {
  path: string;
  type: string;
  description: string;
  dependencies: string[];
  priority: number;
}

const VALID_FILE_TYPES = new Set(['page', 'component', 'api', 'db', 'auth', 'config', 'style', 'test', 'util']);

function normalizeType(t: string): FileType {
  return VALID_FILE_TYPES.has(t) ? (t as FileType) : 'util';
}

/**
 * Generate a full list of files (ManifestFile[]) needed for a project.
 */
export async function generateFileList(
  prompt: string,
  blueprint: Blueprint,
  model = 'gpt-4o'
): Promise<ManifestFile[]> {
  const client = getClient();
  const response = await client.chat.completions.create({
    model,
    temperature: 0.2,
    max_tokens: 8192,
    messages: [
      { role: 'system', content: FILE_LIST_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Prompt: ${prompt}\n\nBlueprint:\n${JSON.stringify(blueprint, null, 2)}\n\nGenerate the complete file list.`,
      },
    ],
  });

  const raw = response.choices?.[0]?.message?.content ?? '';
  const parsed = safeParseJSON<RawManifestFile[]>(raw, []);

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return getDefaultManifestFiles();
  }

  return parsed.map((f, idx) => ({
    path: f.path ?? `unknown-${idx}.ts`,
    type: normalizeType(f.type ?? 'util'),
    description: f.description ?? '',
    dependencies: Array.isArray(f.dependencies) ? f.dependencies : [],
    priority: typeof f.priority === 'number' ? f.priority : 5,
    status: 'pending' as const,
    batchIndex: 0,
  }));
}

/** @internal Exported for testing only — returns the default file list without calling OpenAI */
export function getDefaultManifestFiles(): ManifestFile[] {
  const defaults: Array<{ path: string; type: FileType; description: string; priority: number }> = [
    { path: 'package.json', type: 'config', description: 'Node package manifest', priority: 1 },
    { path: 'tsconfig.json', type: 'config', description: 'TypeScript config', priority: 1 },
    { path: 'tailwind.config.ts', type: 'config', description: 'Tailwind CSS config', priority: 1 },
    { path: '.env.example', type: 'config', description: 'Environment variables template', priority: 1 },
    { path: 'prisma/schema.prisma', type: 'db', description: 'Prisma database schema', priority: 1 },
    { path: 'lib/db.ts', type: 'db', description: 'Prisma client singleton', priority: 2 },
    { path: 'lib/auth.ts', type: 'auth', description: 'Auth helpers', priority: 2 },
    { path: 'middleware.ts', type: 'auth', description: 'Next.js middleware for route protection', priority: 2 },
    { path: 'app/layout.tsx', type: 'page', description: 'Root layout', priority: 2 },
    { path: 'app/page.tsx', type: 'page', description: 'Home page', priority: 3 },
    { path: 'app/(auth)/login/page.tsx', type: 'auth', description: 'Login page', priority: 3 },
    { path: 'app/(auth)/signup/page.tsx', type: 'auth', description: 'Signup page', priority: 3 },
    { path: 'app/dashboard/page.tsx', type: 'page', description: 'Dashboard main page', priority: 4 },
    { path: 'components/Navbar.tsx', type: 'component', description: 'Navigation bar', priority: 3 },
    { path: 'components/Footer.tsx', type: 'component', description: 'Page footer with legal links', priority: 3 },
    { path: 'app/api/health/route.ts', type: 'api', description: 'Health check endpoint', priority: 4 },
    // Legal pages — required for every full-app build
    { path: 'app/(legal)/terms/page.tsx', type: 'page', description: 'Terms of Service page', priority: 8 },
    { path: 'app/(legal)/privacy/page.tsx', type: 'page', description: 'Privacy Policy page', priority: 8 },
    { path: 'app/(legal)/cookies/page.tsx', type: 'page', description: 'Cookie Policy page', priority: 8 },
    { path: 'app/(legal)/acceptable-use/page.tsx', type: 'page', description: 'Acceptable Use Policy page', priority: 8 },
    { path: 'app/(legal)/disclaimer/page.tsx', type: 'page', description: 'Disclaimer page', priority: 8 },
    { path: 'README.md', type: 'util', description: 'Project readme', priority: 10 },
  ];
  return defaults.map((d) => ({ ...d, dependencies: [], status: 'pending' as const, batchIndex: 0 }));
}
