// __tests__/helpers/manifest-helpers.ts
// Test helpers that expose internal manifest constants without calling OpenAI

import { getDefaultManifestFiles, FILE_LIST_SYSTEM_PROMPT } from '@/lib/ai/file-list-generator';
import type { ManifestFile } from '@/lib/ai/manifest';

/** The five required legal page paths */
export const LEGAL_PAGE_PATHS = [
  'app/(legal)/terms/page.tsx',
  'app/(legal)/privacy/page.tsx',
  'app/(legal)/cookies/page.tsx',
  'app/(legal)/acceptable-use/page.tsx',
  'app/(legal)/disclaimer/page.tsx',
] as const;

/** Returns the default manifest file list from the real source module */
export function getDefaultManifestFilesForTest(): ManifestFile[] {
  return getDefaultManifestFiles();
}

/**
 * The real FILE_LIST_SYSTEM_PROMPT from lib/ai/file-list-generator.ts.
 * Exported so tests can verify it contains required legal page paths.
 */
export { FILE_LIST_SYSTEM_PROMPT as FILE_LIST_SYSTEM_PROMPT_FOR_TEST };
