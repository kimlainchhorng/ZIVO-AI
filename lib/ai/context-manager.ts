// lib/ai/context-manager.ts — Context window manager

import { embeddingStore } from "./embedding-store";

export interface ProjectMemory {
  name: string;
  description: string;
  techStack: string[];
  keyFiles: string[];
  lastUpdated: number;
}

interface FileEntry {
  path: string;
  content: string;
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function trimToTokenLimit(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "\n...(truncated)";
}

export async function buildOptimalContext(
  files: FileEntry[],
  maxTokens: number,
  relevantQuery?: string
): Promise<string> {
  let orderedFiles: FileEntry[];

  if (relevantQuery && embeddingStore.size > 0) {
    const results = await embeddingStore.searchByText(relevantQuery, 10);
    const resultPaths = new Set(results.map((r) => r.path));
    orderedFiles = [
      ...files.filter((f) => resultPaths.has(f.path)),
      ...files.filter((f) => !resultPaths.has(f.path)),
    ];
  } else {
    orderedFiles = [...files];
  }

  const parts: string[] = [];
  let usedTokens = 0;

  for (const file of orderedFiles) {
    const snippet = `// ${file.path}\n${file.content}`;
    const tokens = estimateTokens(snippet);
    if (usedTokens + tokens > maxTokens) {
      const remaining = maxTokens - usedTokens;
      if (remaining > 100) {
        parts.push(trimToTokenLimit(snippet, remaining));
      }
      break;
    }
    parts.push(snippet);
    usedTokens += tokens;
  }

  return parts.join("\n\n---\n\n");
}

export function buildSystemContext(
  projectMemory: ProjectMemory,
  recentFiles: string[]
): string {
  return [
    `Project: ${projectMemory.name}`,
    `Description: ${projectMemory.description}`,
    `Tech Stack: ${projectMemory.techStack.join(", ")}`,
    `Key Files: ${projectMemory.keyFiles.join(", ")}`,
    `Recently Modified: ${recentFiles.join(", ")}`,
    `Last Updated: ${new Date(projectMemory.lastUpdated).toISOString()}`,
  ].join("\n");
}
