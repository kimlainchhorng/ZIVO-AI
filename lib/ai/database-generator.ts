// lib/ai/database-generator.ts — AI Database Schema Generator

import OpenAI from "openai";

export interface Column {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey?: boolean;
  unique?: boolean;
  defaultValue?: string;
  foreignKey?: { table: string; column: string };
}

export interface Table {
  name: string;
  columns: Column[];
  description?: string;
}

export interface Relationship {
  from: string;
  to: string;
  type: "one-to-one" | "one-to-many" | "many-to-many";
  via?: string;
}

export interface DatabaseSchema {
  tables: Table[];
  relationships: Relationship[];
  migrations: string[];
  supabase_sql: string;
  prisma_schema: string;
  typescript_types: string;
  seed_data: string;
}

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const DB_SYSTEM_PROMPT = `You are a database architect. Generate a complete, normalized database schema from the app description.

Return ONLY a valid JSON object (no markdown fences):
{
  "tables": [
    {
      "name": "users",
      "description": "App users",
      "columns": [
        { "name": "id", "type": "uuid", "nullable": false, "primaryKey": true, "defaultValue": "gen_random_uuid()" },
        { "name": "email", "type": "text", "nullable": false, "unique": true },
        { "name": "created_at", "type": "timestamptz", "nullable": false, "defaultValue": "now()" }
      ]
    }
  ],
  "relationships": [
    { "from": "orders", "to": "users", "type": "many-to-one" }
  ]
}

Rules:
- Auto-detect all entities from the prompt
- Always include id (uuid), created_at, updated_at columns
- Use snake_case for all names
- Include foreign key columns for relationships
- Normalize to 3NF`;

export async function generateDatabaseSchema(prompt: string): Promise<DatabaseSchema> {
  const client = getClient();
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    max_tokens: 4096,
    messages: [
      { role: "system", content: DB_SYSTEM_PROMPT },
      { role: "user", content: `Generate a complete database schema for: ${prompt}` },
    ],
  });

  const rawText = response.choices?.[0]?.message?.content ?? "";
  let parsed: { tables: Table[]; relationships: Relationship[] };
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText) as { tables: Table[]; relationships: Relationship[] };
  } catch {
    throw new Error("Failed to parse AI response for database schema");
  }

  const tables = parsed.tables ?? [];
  const relationships = parsed.relationships ?? [];

  const supabase_sql = generateSupabaseSQL(tables);
  const prisma_schema = generatePrismaSchema(tables);
  const typescript_types = generateTypeScriptTypes(tables);
  const seed_data = generateSeedData(tables);

  return {
    tables,
    relationships,
    migrations: [supabase_sql],
    supabase_sql,
    prisma_schema,
    typescript_types,
    seed_data,
  };
}

export function generateSupabaseSQL(tables: Table[]): string {
  const statements: string[] = [];

  for (const table of tables) {
    const cols = table.columns.map((col) => {
      const parts: string[] = [`  ${col.name} ${col.type.toUpperCase()}`];
      if (col.primaryKey) parts.push("PRIMARY KEY");
      if (!col.nullable) parts.push("NOT NULL");
      if (col.unique) parts.push("UNIQUE");
      if (col.defaultValue) parts.push(`DEFAULT ${col.defaultValue}`);
      return parts.join(" ");
    });

    const fkConstraints = table.columns
      .filter((col) => col.foreignKey)
      .map(
        (col) =>
          `  CONSTRAINT fk_${table.name}_${col.name} FOREIGN KEY (${col.name}) REFERENCES ${col.foreignKey!.table}(${col.foreignKey!.column}) ON DELETE CASCADE`
      );

    const allParts = [...cols, ...fkConstraints];
    statements.push(
      `CREATE TABLE IF NOT EXISTS ${table.name} (\n${allParts.join(",\n")}\n);\n\nALTER TABLE ${table.name} ENABLE ROW LEVEL SECURITY;\n\nCREATE POLICY "Users can read own ${table.name}" ON ${table.name} FOR SELECT USING (auth.uid() IS NOT NULL);`
    );
  }

  return statements.join("\n\n-- ---\n\n");
}

export function generatePrismaSchema(tables: Table[]): string {
  const typeMap: Record<string, string> = {
    uuid: "String",
    text: "String",
    varchar: "String",
    int: "Int",
    integer: "Int",
    bigint: "BigInt",
    float: "Float",
    double: "Float",
    boolean: "Boolean",
    bool: "Boolean",
    timestamptz: "DateTime",
    timestamp: "DateTime",
    date: "DateTime",
    jsonb: "Json",
    json: "Json",
    numeric: "Decimal",
    decimal: "Decimal",
  };

  const models = tables.map((table) => {
    const fields = table.columns.map((col) => {
      const prismaType = typeMap[col.type.toLowerCase()] ?? "String";
      const optional = col.nullable ? "?" : "";
      let decorators = "";
      if (col.primaryKey) decorators += " @id";
      if (col.defaultValue?.includes("gen_random_uuid")) decorators += ' @default(uuid())';
      else if (col.defaultValue?.includes("now()")) decorators += " @default(now())";
      else if (col.defaultValue === "true") decorators += " @default(true)";
      else if (col.defaultValue === "false") decorators += " @default(false)";
      if (col.unique) decorators += " @unique";
      return `  ${col.name} ${prismaType}${optional}${decorators}`;
    });

    return `model ${table.name.charAt(0).toUpperCase() + table.name.slice(1).replace(/_([a-z])/g, (_, l: string) => l.toUpperCase())} {\n${fields.join("\n")}\n\n  @@map("${table.name}")\n}`;
  });

  return `generator client {\n  provider = "prisma-client-js"\n}\n\ndatasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\n${models.join("\n\n")}`;
}

export function generateTypeScriptTypes(tables: Table[]): string {
  const tsTypeMap: Record<string, string> = {
    uuid: "string",
    text: "string",
    varchar: "string",
    int: "number",
    integer: "number",
    bigint: "number",
    float: "number",
    double: "number",
    boolean: "boolean",
    bool: "boolean",
    timestamptz: "string",
    timestamp: "string",
    date: "string",
    jsonb: "Record<string, unknown>",
    json: "Record<string, unknown>",
    numeric: "number",
    decimal: "number",
  };

  const interfaces = tables.map((table) => {
    const fields = table.columns.map((col) => {
      const tsType = tsTypeMap[col.type.toLowerCase()] ?? "unknown";
      const optional = col.nullable ? "?" : "";
      return `  ${col.name}${optional}: ${tsType};`;
    });

    const name = table.name.charAt(0).toUpperCase() + table.name.slice(1).replace(/_([a-z])/g, (_, l: string) => l.toUpperCase());
    return `export interface ${name} {\n${fields.join("\n")}\n}`;
  });

  return interfaces.join("\n\n");
}

export function generateSeedData(tables: Table[]): string {
  const inserts = tables.map((table) => {
    const cols = table.columns.filter((c) => !c.primaryKey && !c.defaultValue);
    if (cols.length === 0) return `-- No seed data for ${table.name}`;
    const colNames = cols.map((c) => c.name).join(", ");
    const values = cols.map((c) => {
      if (c.type === "boolean" || c.type === "bool") return "true";
      if (c.type === "int" || c.type === "integer") return "1";
      if (c.type === "float" || c.type === "numeric") return "1.00";
      return `'sample_${c.name}'`;
    }).join(", ");
    return `INSERT INTO ${table.name} (${colNames}) VALUES (${values});`;
  });

  return `-- Seed data\n${inserts.join("\n")}`;
}
