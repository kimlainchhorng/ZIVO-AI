import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface DatabaseFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateDatabaseRequest {
  orm?: "prisma" | "drizzle" | "typeorm";
  database?: "postgresql" | "mysql" | "sqlite" | "mongodb";
  models?: string;
  appName?: string;
}

export interface GenerateDatabaseResponse {
  files: DatabaseFile[];
  commands: string[];
  envVars: string[];
  summary: string;
}

const DATABASE_SYSTEM_PROMPT = `You are ZIVO AI — an expert in database design, ORM configuration, and data modeling.

Generate a complete database layer for a Next.js App Router project.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "commands": ["npx prisma generate", "npx prisma migrate dev"],
  "envVars": ["DATABASE_URL=postgresql://..."],
  "summary": "Brief description"
}

Always generate:
- Schema file (prisma/schema.prisma, drizzle/schema.ts, or src/entities/ for TypeORM)
- Seed file with realistic sample data (prisma/seed.ts or drizzle/seed.ts)
- Repository pattern files (lib/db/[model].ts) with type-safe CRUD operations
- Type-safe query helpers (lib/db/index.ts)
- Migration commands in the commands array

Follow best practices:
- Use cuid2() for ID generation (via @paralleldrive/cuid2 package)
- Add proper indexes on foreign keys and frequently queried fields
- Include created_at/updated_at timestamps
- Add cascade delete where appropriate
- Generate TypeScript types from schema

Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      orm = "prisma",
      database = "postgresql",
      models = "User, Post, Comment with typical blog relations",
      appName = "My App",
    }: GenerateDatabaseRequest = body;

    const ormInstructions: Record<string, string> = {
      prisma: "Use Prisma ORM. Generate prisma/schema.prisma with all models, relations, and @@index directives. Include lib/prisma.ts singleton client. Use @default(cuid2()) for IDs.",
      drizzle: "Use Drizzle ORM. Generate drizzle/schema.ts with all tables using pgTable/mysqlTable/sqliteTable as appropriate. Include drizzle.config.ts and lib/db.ts client. Use cuid2 for IDs.",
      typeorm: "Use TypeORM. Generate entity files in src/entities/ with decorators. Include data-source.ts config and repository classes in src/repositories/. Use UUID for IDs.",
    };

    const userPrompt = `Generate a complete database layer for "${appName}".
ORM: ${orm}
Database: ${database}
ORM instructions: ${ormInstructions[orm] ?? ormInstructions["prisma"]}

Data models to create:
${models}

Generate:
1. Schema/entity files with all models, relations, and indexes
2. Seed file with realistic sample data (10-20 records per model)
3. Repository pattern files in lib/db/[modelName].ts with:
   - findById(id: string)
   - findMany(options: { limit, offset, where })
   - create(data: CreateInput)
   - update(id: string, data: UpdateInput)
   - delete(id: string)
4. lib/db/index.ts — barrel file exporting all repositories
5. Type definitions for all models
6. Migration commands for ${database}`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: DATABASE_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateDatabaseResponse;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json(
          { error: "AI did not return valid JSON" },
          { status: 502 }
        );
      }
      parsed = JSON.parse(match[0]);
    }

    if (!Array.isArray(parsed.files)) {
      return NextResponse.json(
        { error: "Invalid response structure: missing files array" },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
