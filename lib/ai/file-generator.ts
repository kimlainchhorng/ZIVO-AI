// lib/ai/file-generator.ts — Generates a single batch of files safely to avoid truncation

import OpenAI from 'openai';
import type { ManifestBatch } from './manifest';
import type { GeneratedFile } from './schema';
import { safeParseJSON } from './json-repair';

const FILE_BATCH_SYSTEM_PROMPT = `You are a full-stack engineer. Generate complete, production-ready code for ONLY the files listed in this batch.

Return ONLY a valid JSON array (no markdown fences):
[
  { "path": "app/page.tsx", "content": "full file content here", "action": "create", "language": "typescript" }
]

Rules:
- COMPLETE file content — no placeholders, no TODO comments, no "// rest of code"
- TypeScript strict mode — no implicit any, explicit return types on exports
- Use Tailwind CSS for styling (dark theme: bg-gray-900, text-white, accent indigo-500)
- All React components: handle loading, error, and empty states
- All async functions: proper try/catch with typed errors
- All imports must be present in each file
- Do NOT regenerate files already listed in "Existing files" context`;

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Generate a batch of files for the given ManifestBatch.
 */
export async function generateFileBatch(
  batch: ManifestBatch,
  projectContext: string,
  existingFiles: GeneratedFile[],
  model = 'gpt-4o'
): Promise<GeneratedFile[]> {
  const client = getClient();

  const existingPaths = existingFiles.map((f) => `- ${f.path}`).join('\n');
  const batchFileList = batch.files
    .map((f) => `- ${f.path} (${f.type}): ${f.description}`)
    .join('\n');

  const userMessage = [
    `Project context:\n${projectContext}`,
    existingPaths ? `Existing files (DO NOT regenerate):\n${existingPaths}` : '',
    `Generate ONLY these files:\n${batchFileList}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const response = await client.chat.completions.create({
    model,
    temperature: 0.2,
    max_tokens: 16000,
    messages: [
      { role: 'system', content: FILE_BATCH_SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
  });

  const raw = response.choices?.[0]?.message?.content ?? '';
  const parsed = safeParseJSON<GeneratedFile[]>(raw, []);

  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter((f) => f && typeof f.path === 'string' && typeof f.content === 'string')
    .map((f) => ({
      path: f.path,
      content: f.content,
      action: (f.action ?? 'create') as GeneratedFile['action'],
      language: f.language,
    }));
}
