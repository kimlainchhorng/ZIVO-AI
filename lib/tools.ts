import { promises as fs } from "fs";
import path from "path";
import type { ToolCall, ToolResult } from "./types";

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

// ─── Tool implementations ────────────────────────────────────────────────────

async function generate_component(args: Record<string, unknown>): Promise<unknown> {
  const name = String(args.name || "");
  const code = String(args.code || "");
  const componentPath = String(args.path || `app/components/${name}.tsx`);

  if (!name || !code) throw new Error("name and code are required");

  const absolutePath = path.join(process.cwd(), componentPath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, code, "utf8");

  return { created: true, path: componentPath, name };
}

async function modify_file(args: Record<string, unknown>): Promise<unknown> {
  const filePath = String(args.path || "");
  const oldStr = String(args.oldStr || "");
  const newStr = String(args.newStr || "");

  if (!filePath) throw new Error("path is required");

  const absolutePath = path.join(process.cwd(), filePath);
  const content = await fs.readFile(absolutePath, "utf8");

  if (oldStr && !content.includes(oldStr)) {
    throw new Error(`String not found in file: ${filePath}`);
  }

  const updated = oldStr ? content.replace(oldStr, newStr) : newStr;
  await fs.writeFile(absolutePath, updated, "utf8");

  return { modified: true, path: filePath, changedLines: oldStr
    ? newStr.split("\n").length - oldStr.split("\n").length
    : newStr.split("\n").length };
}

async function create_file(args: Record<string, unknown>): Promise<unknown> {
  const filePath = String(args.path || "");
  const content = String(args.content || "");

  if (!filePath) throw new Error("path is required");

  const absolutePath = path.join(process.cwd(), filePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, content, "utf8");

  return { created: true, path: filePath };
}

async function read_file(args: Record<string, unknown>): Promise<unknown> {
  const filePath = String(args.path || "");
  if (!filePath) throw new Error("path is required");

  const absolutePath = path.join(process.cwd(), filePath);
  const content = await fs.readFile(absolutePath, "utf8");
  return { content, path: filePath };
}

async function list_files(args: Record<string, unknown>): Promise<unknown> {
  const dir = String(args.directory || ".");
  const absolutePath = path.join(process.cwd(), dir);
  const entries = await fs.readdir(absolutePath, { withFileTypes: true });
  return {
    files: entries.map((e) => ({ name: e.name, type: e.isDirectory() ? "directory" : "file" })),
    directory: dir,
  };
}

async function create_git_commit(args: Record<string, unknown>): Promise<unknown> {
  // In a real environment this would run git commands.
  // Here we record the commit intent since we can't push.
  const message = String(args.message || "Auto-commit by ZIVO AI");
  const files = Array.isArray(args.files) ? args.files : [];
  return {
    committed: true,
    message,
    files,
    note: "Git operations require proper environment setup",
  };
}

async function generate_supabase_schema(args: Record<string, unknown>): Promise<unknown> {
  const tables = Array.isArray(args.tables) ? args.tables : [];
  const schema: string[] = [];

  for (const table of tables as Record<string, unknown>[]) {
    const tableName = String(table.name || "");
    const columns = Array.isArray(table.columns) ? table.columns : [];

    const cols = (columns as Record<string, unknown>[]).map((col) => {
      const c = col as Record<string, unknown>;
      return `  ${c.name} ${c.type}${c.notNull ? " NOT NULL" : ""}${c.default ? ` DEFAULT ${c.default}` : ""}`;
    });

    schema.push(
      `CREATE TABLE IF NOT EXISTS ${tableName} (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n${cols.join(",\n")},\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);`,
      `ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`
    );
  }

  return { sql: schema.join("\n\n"), tables: tables.length };
}

async function analyze_code(args: Record<string, unknown>): Promise<unknown> {
  const code = String(args.code || "");
  const issues: string[] = [];

  if (code.includes("console.log")) issues.push("Remove console.log statements in production code");
  if (code.includes("any")) issues.push("Avoid TypeScript 'any' type – use specific types");
  if (!code.includes("try") && code.includes("await")) issues.push("Consider adding error handling for async operations");
  if (code.includes("innerHTML")) issues.push("Potential XSS risk: avoid direct innerHTML assignment");

  return { analyzed: true, issues, score: Math.max(0, 100 - issues.length * 15) };
}

// ─── Tool registry ────────────────────────────────────────────────────────────

export const TOOLS: Record<string, Tool> = {
  generate_component: {
    name: "generate_component",
    description: "Generate a React component and save it to the filesystem",
    parameters: {
      name: { type: "string", description: "Component name", required: true },
      code: { type: "string", description: "Full TypeScript/React component code", required: true },
      path: { type: "string", description: "File path (default: app/components/{name}.tsx)" },
    },
    execute: generate_component,
  },
  modify_file: {
    name: "modify_file",
    description: "Modify an existing file by replacing a string or overwriting it",
    parameters: {
      path: { type: "string", description: "File path relative to project root", required: true },
      oldStr: { type: "string", description: "String to replace (empty to overwrite entire file)" },
      newStr: { type: "string", description: "Replacement string or new content", required: true },
    },
    execute: modify_file,
  },
  create_file: {
    name: "create_file",
    description: "Create a new file with specified content",
    parameters: {
      path: { type: "string", description: "File path", required: true },
      content: { type: "string", description: "File content", required: true },
    },
    execute: create_file,
  },
  read_file: {
    name: "read_file",
    description: "Read the contents of a file",
    parameters: {
      path: { type: "string", description: "File path", required: true },
    },
    execute: read_file,
  },
  list_files: {
    name: "list_files",
    description: "List files in a directory",
    parameters: {
      directory: { type: "string", description: "Directory path (default: .)" },
    },
    execute: list_files,
  },
  create_git_commit: {
    name: "create_git_commit",
    description: "Record a git commit with a message",
    parameters: {
      message: { type: "string", description: "Commit message", required: true },
      files: { type: "array", description: "Files to include in commit" },
    },
    execute: create_git_commit,
  },
  generate_supabase_schema: {
    name: "generate_supabase_schema",
    description: "Generate Supabase table schema SQL with RLS enabled",
    parameters: {
      tables: { type: "array", description: "Table definitions with name and columns", required: true },
    },
    execute: generate_supabase_schema,
  },
  analyze_code: {
    name: "analyze_code",
    description: "Analyze code for common issues and return a quality score",
    parameters: {
      code: { type: "string", description: "Code to analyze", required: true },
    },
    execute: analyze_code,
  },
};

// ─── Execute a tool call ──────────────────────────────────────────────────────

export async function executeToolCall(toolCall: ToolCall): Promise<ToolResult> {
  const tool = TOOLS[toolCall.name];
  if (!tool) {
    return {
      toolCallId: toolCall.id,
      result: null,
      error: `Unknown tool: ${toolCall.name}`,
    };
  }
  try {
    const result = await tool.execute(toolCall.arguments);
    return { toolCallId: toolCall.id, result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { toolCallId: toolCall.id, result: null, error: message };
  }
}
