// lib/ai/architecture-planner.ts — Plans folder structure, patterns, state management, and data flow

import OpenAI from 'openai';
import type { Blueprint } from './blueprint-generator';
import { safeParseJSON } from './json-repair';

export interface FolderNode {
  path: string;
  purpose: string;
  children?: FolderNode[];
}

export interface ArchitecturePlan {
  folderStructure: FolderNode[];
  stateManagement: string;
  dataFlow: string;
  patterns: string[];
  conventions: string[];
}

const ARCHITECTURE_SYSTEM_PROMPT = `You are a Next.js 15 App Router architect. Given a Blueprint, plan the full folder structure, state management strategy, data flow, and coding patterns.

Return ONLY valid JSON (no markdown fences):
{
  "folderStructure": [
    { "path": "app", "purpose": "Next.js App Router pages", "children": [
      { "path": "app/(auth)", "purpose": "Auth layout group" },
      { "path": "app/(dashboard)", "purpose": "Protected dashboard routes" }
    ]},
    { "path": "components", "purpose": "Shared React components" },
    { "path": "lib", "purpose": "Utilities, hooks, and server helpers" },
    { "path": "prisma", "purpose": "Prisma schema and migrations" }
  ],
  "stateManagement": "Zustand for client state, React Query for server state",
  "dataFlow": "Server Components fetch data directly; Client Components use hooks/React Query",
  "patterns": ["server-components-first", "optimistic-updates", "zod-validation", "prisma-orm"],
  "conventions": ["kebab-case files", "PascalCase components", "camelCase functions", "no implicit any"]
}`;

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Plan the architecture for a project given its Blueprint.
 */
export async function planArchitecture(
  blueprint: Blueprint,
  model = 'gpt-4o'
): Promise<ArchitecturePlan> {
  const client = getClient();
  const response = await client.chat.completions.create({
    model,
    temperature: 0.2,
    max_tokens: 2048,
    messages: [
      { role: 'system', content: ARCHITECTURE_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Plan the architecture for this app:\n${JSON.stringify(blueprint, null, 2)}`,
      },
    ],
  });

  const raw = response.choices?.[0]?.message?.content ?? '';
  const fallback: ArchitecturePlan = {
    folderStructure: [],
    stateManagement: 'React Context',
    dataFlow: 'Client-side fetching',
    patterns: [],
    conventions: [],
  };
  return safeParseJSON<ArchitecturePlan>(raw, fallback);
}
