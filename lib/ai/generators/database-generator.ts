import OpenAI from "openai";

export interface DatabaseSchema {
  models: {
    name: string;
    fields: { name: string; type: string; optional?: boolean; default?: string }[];
    relations: { field: string; model: string; type: "one-to-many" | "many-to-one" | "many-to-many" }[];
  }[];
  prismaSchema: string;
  migrationName: string;
  seedFile: string;
}

const DB_SYSTEM_PROMPT = `You are a senior database architect. Generate a complete Prisma schema and seed file.

Return ONLY valid JSON:
{
  "models": [...],
  "prismaSchema": "complete prisma schema string",
  "migrationName": "init",
  "seedFile": "complete seed.ts file content"
}

Include:
- User model with id, email, name, createdAt, updatedAt
- All models relevant to the app
- Proper relations and indexes
- Row Level Security (RLS) compatible schema
- @id @default(cuid()) or @default(uuid()) for IDs
- @createdAt and @updatedAt timestamps everywhere`;

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function generateDatabaseSchema(
  prompt: string,
  existingModels: string[] = [],
  model = "gpt-4o"
): Promise<DatabaseSchema> {
  const client = getClient();
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: DB_SYSTEM_PROMPT },
      {
        role: "user",
        content: `App description: ${prompt}\n${existingModels.length > 0 ? `Existing models: ${existingModels.join(", ")}` : ""}`,
      },
    ],
    temperature: 0.2,
    max_tokens: 8192,
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    return JSON.parse(match ? match[0] : raw) as DatabaseSchema;
  } catch {
    throw new Error("Failed to parse OpenAI response as valid JSON for database schema");
  }
}

export function generateDatabaseFiles(schema: DatabaseSchema): { path: string; content: string; action: "create" }[] {
  return [
    { path: "prisma/schema.prisma", content: schema.prismaSchema, action: "create" },
    { path: "prisma/seed.ts", content: schema.seedFile, action: "create" },
  ];
}
