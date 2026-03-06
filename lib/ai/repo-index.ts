// lib/ai/repo-index.ts — Compact repository summary for follow-up builds

import type { GeneratedFile } from './schema';

export interface KeyFile {
  path: string;
  purpose: string;
  exports: string[];
}

export interface RepoIndex {
  projectId: string;
  fileCount: number;
  filePaths: string[];
  filesByType: Record<string, string[]>;
  keyFiles: KeyFile[];
  summary: string;
}

const KEY_FILE_PATTERNS: Array<{ pattern: RegExp; purpose: string }> = [
  { pattern: /package\.json$/, purpose: 'Node package manifest with dependencies and scripts' },
  { pattern: /prisma\/schema\.prisma$/, purpose: 'Database schema with all models' },
  { pattern: /middleware\.ts$/, purpose: 'Next.js middleware for route protection' },
  { pattern: /lib\/auth\.ts$/, purpose: 'Authentication helpers' },
  { pattern: /lib\/db\.ts$/, purpose: 'Prisma client singleton' },
  { pattern: /app\/layout\.tsx$/, purpose: 'Root Next.js layout' },
  { pattern: /tailwind\.config/, purpose: 'Tailwind CSS configuration' },
  { pattern: /tsconfig\.json$/, purpose: 'TypeScript configuration' },
  { pattern: /\.env\.example$/, purpose: 'Environment variable template' },
];

const EXTENSION_TO_TYPE: Record<string, string> = {
  '.tsx': 'react',
  '.ts': 'typescript',
  '.css': 'style',
  '.prisma': 'database',
  '.sql': 'database',
  '.json': 'config',
  '.md': 'docs',
  '.env': 'config',
};

function getExtension(path: string): string {
  const dot = path.lastIndexOf('.');
  return dot >= 0 ? path.slice(dot) : '';
}

function extractExports(content: string): string[] {
  const matches = content.match(/\bexport\s+(?:default\s+)?(?:function|class|const|interface|type|enum)\s+(\w+)/gm) ?? [];
  return matches
    .map((m) => {
      const match = m.match(/\s(\w+)$/);
      return match ? match[1] : '';
    })
    .filter(Boolean);
}

/**
 * Build a compact RepoIndex from a list of generated files.
 */
export function buildRepoIndex(files: GeneratedFile[], projectId = 'unknown'): RepoIndex {
  const filePaths = files.map((f) => f.path);
  const filesByType: Record<string, string[]> = {};

  for (const file of files) {
    const ext = getExtension(file.path);
    const type = EXTENSION_TO_TYPE[ext] ?? 'other';
    if (!filesByType[type]) filesByType[type] = [];
    filesByType[type].push(file.path);
  }

  const keyFiles: KeyFile[] = [];
  for (const file of files) {
    const match = KEY_FILE_PATTERNS.find((kf) => kf.pattern.test(file.path));
    if (match) {
      keyFiles.push({
        path: file.path,
        purpose: match.purpose,
        exports: extractExports(file.content),
      });
    }
  }

  const typeBreakdown = Object.entries(filesByType)
    .map(([type, paths]) => `${paths.length} ${type}`)
    .join(', ');

  const summary = `${files.length} files (${typeBreakdown}). Key files: ${keyFiles.map((k) => k.path).join(', ')}.`;

  return {
    projectId,
    fileCount: files.length,
    filePaths,
    filesByType,
    keyFiles,
    summary,
  };
}

/**
 * Get a compact string describing the repository for use as LLM prompt context.
 */
export function getRepoContext(index: RepoIndex, maxChars = 3000): string {
  const lines = [
    `Repository: ${index.fileCount} files`,
    '',
    'Key files:',
    ...index.keyFiles.map((k) => `  ${k.path} — ${k.purpose}`),
    '',
    'All files:',
    ...index.filePaths.map((p) => `  ${p}`),
  ];
  return lines.join('\n').slice(0, maxChars);
}

/**
 * Find file paths most relevant to a follow-up intent string.
 */
export function findRelevantFiles(index: RepoIndex, intent: string): string[] {
  const intentLower = intent.toLowerCase();
  const keywords = intentLower.split(/\s+/).filter((w) => w.length > 3);

  const scored = index.filePaths.map((path) => {
    const pathLower = path.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      if (pathLower.includes(kw)) score += 2;
    }
    // Boost key files
    if (index.keyFiles.some((k) => k.path === path)) score += 1;
    return { path, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map((s) => s.path);
}
