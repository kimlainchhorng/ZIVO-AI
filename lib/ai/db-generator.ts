// lib/ai/db-generator.ts — Generates the full database layer (Prisma schema, seed, client, migrations)

import OpenAI from 'openai';
import type { Blueprint } from './blueprint-generator';
import type { GeneratedFile } from './schema';
import { safeParseJSON } from './json-repair';

export interface DBOutput {
  schema: GeneratedFile;
  migrations: GeneratedFile[];
  seed: GeneratedFile;
  client: GeneratedFile;
}

const DB_SYSTEM_PROMPT = `You are a database architect and Prisma expert. Generate a complete database layer for a Next.js app.

Return ONLY a valid JSON object (no markdown fences):
{
  "schema": { "path": "prisma/schema.prisma", "content": "...", "action": "create", "language": "prisma" },
  "migrations": [
    { "path": "prisma/migrations/001_init.sql", "content": "...", "action": "create", "language": "sql" }
  ],
  "seed": { "path": "prisma/seed.ts", "content": "...", "action": "create", "language": "typescript" },
  "client": { "path": "lib/db.ts", "content": "...", "action": "create", "language": "typescript" }
}

Rules for schema.prisma:
- Include ALL models from blueprint with proper fields, types, and relations
- Add @@index on foreign keys and frequently queried fields
- Include createdAt/updatedAt on all models
- Add Row Level Security (RLS) policies as SQL comments for Supabase

Rules for seed.ts:
- Realistic sample data (not "John Doe" — use plausible names, emails, content)
- Seed all tables in dependency order

Rules for lib/db.ts:
- Prisma client singleton pattern (dev: global, prod: new instance)
- TypeScript strict mode

Rules for migrations:
- Raw SQL CREATE TABLE statements matching the Prisma schema
- Include indexes`;

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Generate the full database layer for a project.
 */
export async function generateDB(
  blueprint: Blueprint,
  model = 'gpt-4o'
): Promise<DBOutput> {
  const client = getClient();
  const response = await client.chat.completions.create({
    model,
    temperature: 0.2,
    max_tokens: 8192,
    messages: [
      { role: 'system', content: DB_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Generate the full database layer for:\nApp: ${blueprint.goal}\nTables: ${JSON.stringify(blueprint.tables, null, 2)}`,
      },
    ],
  });

  const raw = response.choices?.[0]?.message?.content ?? '';

  const fallbackSchema: GeneratedFile = {
    path: 'prisma/schema.prisma',
    content: 'generator client {\n  provider = "prisma-client-js"\n}\n\ndatasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n',
    action: 'create',
    language: 'prisma',
  };
  const fallbackSeed: GeneratedFile = {
    path: 'prisma/seed.ts',
    content: 'import { PrismaClient } from "@prisma/client";\nconst prisma = new PrismaClient();\nasync function main() {}\nmain().catch(console.error).finally(() => prisma.$disconnect());\n',
    action: 'create',
    language: 'typescript',
  };
  const fallbackClient: GeneratedFile = {
    path: 'lib/db.ts',
    content: 'import { PrismaClient } from "@prisma/client";\nconst globalForPrisma = global as unknown as { prisma: PrismaClient };\nexport const prisma = globalForPrisma.prisma ?? new PrismaClient();\nif (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;\n',
    action: 'create',
    language: 'typescript',
  };

  interface RawDBOutput {
    schema?: GeneratedFile;
    migrations?: GeneratedFile[];
    seed?: GeneratedFile;
    client?: GeneratedFile;
  }

  const parsed = safeParseJSON<RawDBOutput>(raw, {});
  return {
    schema: parsed.schema ?? fallbackSchema,
    migrations: parsed.migrations ?? [],
    seed: parsed.seed ?? fallbackSeed,
    client: parsed.client ?? fallbackClient,
  };
}
