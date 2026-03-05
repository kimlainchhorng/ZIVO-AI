// lib/ai/component-generator.ts — Generates React components with loading/error/empty states

import OpenAI from 'openai';
import type { ComponentSpec } from './blueprint-generator';
import type { GeneratedFile } from './schema';
import { safeParseJSON } from './json-repair';

const COMPONENT_SYSTEM_PROMPT = `You are a React/TypeScript UI engineer. Generate a complete, production-ready React component.

Return ONLY a valid JSON object (no markdown fences):
{
  "path": "components/ComponentName.tsx",
  "content": "full TypeScript file content",
  "action": "create",
  "language": "typescript"
}

Rules:
- Complete TypeScript with explicit prop types (interface or type alias)
- Loading, error, and empty states where applicable
- Tailwind CSS styling (dark theme: bg-gray-900 text-white accent-indigo-500)
- No implicit any
- Named export + default export
- Accessible: proper aria attributes`;

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Generate a single React component from a ComponentSpec.
 */
export async function generateComponent(
  spec: ComponentSpec,
  projectContext: string,
  model = 'gpt-4o'
): Promise<GeneratedFile> {
  const client = getClient();
  const response = await client.chat.completions.create({
    model,
    temperature: 0.3,
    max_tokens: 4096,
    messages: [
      { role: 'system', content: COMPONENT_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Project context: ${projectContext}\n\nGenerate component:\n${JSON.stringify(spec, null, 2)}`,
      },
    ],
  });

  const raw = response.choices?.[0]?.message?.content ?? '';
  const fallback: GeneratedFile = {
    path: spec.path,
    content: `// ${spec.name} — generation failed\nexport default function ${spec.name}() { return null; }`,
    action: 'create',
  };
  const parsed = safeParseJSON<GeneratedFile>(raw, fallback);
  return {
    path: parsed.path ?? spec.path,
    content: parsed.content ?? fallback.content,
    action: 'create',
    language: parsed.language ?? 'typescript',
  };
}

/**
 * Generate multiple components in batches of 3 at a time.
 */
export async function generateComponents(
  specs: ComponentSpec[],
  projectContext: string,
  model = 'gpt-4o'
): Promise<GeneratedFile[]> {
  const results: GeneratedFile[] = [];
  const concurrency = 3;

  for (let i = 0; i < specs.length; i += concurrency) {
    const chunk = specs.slice(i, i + concurrency);
    const batch = await Promise.all(
      chunk.map((spec) => generateComponent(spec, projectContext, model))
    );
    results.push(...batch);
  }

  return results;
}
