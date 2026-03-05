// lib/ai/page-generator.ts — Generates Next.js App Router pages

import OpenAI from 'openai';
import type { PageSpec, Blueprint } from './blueprint-generator';
import type { GeneratedFile } from './schema';
import { safeParseJSON } from './json-repair';

const PAGE_SYSTEM_PROMPT = `You are a Next.js 15 App Router expert. Generate a complete, production-ready page component.

Return ONLY a valid JSON object (no markdown fences):
{
  "path": "app/dashboard/page.tsx",
  "content": "full TypeScript file content",
  "action": "create",
  "language": "typescript"
}

Rules:
- Use app/ directory structure
- Add 'use client' directive ONLY when needed (event handlers, hooks, browser APIs)
- Prefer React Server Components where possible
- Protected routes: wrap with auth guard or redirect
- Import components using '@/' alias
- Handle loading, error, and empty states
- Tailwind CSS styling (dark theme: bg-gray-900 text-white)
- TypeScript strict mode — no implicit any`;

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Generate a single Next.js App Router page from a PageSpec.
 */
export async function generatePage(
  spec: PageSpec,
  blueprint: Blueprint,
  projectContext: string,
  model = 'gpt-4o'
): Promise<GeneratedFile> {
  const client = getClient();
  const response = await client.chat.completions.create({
    model,
    temperature: 0.3,
    max_tokens: 4096,
    messages: [
      { role: 'system', content: PAGE_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Project context: ${projectContext}\nApp type: ${blueprint.appType}\nAuth required: ${blueprint.authRequired}\n\nGenerate page:\n${JSON.stringify(spec, null, 2)}`,
      },
    ],
  });

  const raw = response.choices?.[0]?.message?.content ?? '';
  const routeToPath = (route: string): string => {
    const clean = route.replace(/^\//, '') || 'home';
    return `app/${clean}/page.tsx`;
  };
  const fallback: GeneratedFile = {
    path: routeToPath(spec.route),
    content: `// ${spec.name} page — generation failed\nexport default function ${spec.name}Page() { return null; }`,
    action: 'create',
  };
  const parsed = safeParseJSON<GeneratedFile>(raw, fallback);
  return {
    path: parsed.path ?? fallback.path,
    content: parsed.content ?? fallback.content,
    action: 'create',
    language: parsed.language ?? 'typescript',
  };
}

/**
 * Generate multiple Next.js pages sequentially.
 */
export async function generatePages(
  specs: PageSpec[],
  blueprint: Blueprint,
  projectContext: string,
  model = 'gpt-4o'
): Promise<GeneratedFile[]> {
  const results: GeneratedFile[] = [];
  for (const spec of specs) {
    const file = await generatePage(spec, blueprint, projectContext, model);
    results.push(file);
  }
  return results;
}
