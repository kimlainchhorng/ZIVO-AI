// Tool-calling system: defines the interface for all tools the AI can invoke.
// Each tool has a name, description, parameter schema, and an executor function.

export interface ToolParameter {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  description: string;
  required: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameter[];
  permissions: ToolPermission[];
}

export type ToolPermission =
  | "file_read"
  | "file_write"
  | "git"
  | "network"
  | "database"
  | "deployment"
  | "testing"
  | "security_scan";

export interface ToolCall {
  toolName: string;
  parameters: Record<string, unknown>;
  requestId: string;
}

export interface ToolResult {
  toolName: string;
  requestId: string;
  success: boolean;
  output?: unknown;
  error?: string;
  executionMs?: number;
}

// ── Tool definitions (declarative, no side-effects) ─────────────────────────

export const toolDefinitions: ToolDefinition[] = [
  {
    name: "generate_component",
    description: "Create a React UI component with props and Tailwind styling",
    parameters: [
      { name: "name", type: "string", description: "Component name (PascalCase)", required: true },
      { name: "props", type: "object", description: "Props definition as key→type map", required: false },
      { name: "styling", type: "string", description: "Tailwind classes or design notes", required: false },
    ],
    permissions: ["file_write"],
  },
  {
    name: "generate_api_route",
    description: "Create a Next.js API route handler",
    parameters: [
      { name: "path", type: "string", description: "Route path (e.g. /api/users)", required: true },
      { name: "method", type: "string", description: "HTTP method: GET | POST | PUT | DELETE", required: true },
      { name: "logic", type: "string", description: "Business logic description", required: true },
    ],
    permissions: ["file_write"],
  },
  {
    name: "generate_database_schema",
    description: "Create Supabase/PostgreSQL table definitions with RLS",
    parameters: [
      { name: "tables", type: "array", description: "Array of table definitions", required: true },
      { name: "relationships", type: "array", description: "Foreign key relationships", required: false },
    ],
    permissions: ["file_write", "database"],
  },
  {
    name: "generate_rls_policy",
    description: "Create a Row-Level Security policy for a Supabase table",
    parameters: [
      { name: "table", type: "string", description: "Table name", required: true },
      { name: "policy", type: "object", description: "Policy definition (name, using, check, command)", required: true },
    ],
    permissions: ["file_write", "database", "security_scan"],
  },
  {
    name: "modify_file",
    description: "Apply targeted changes to an existing file",
    parameters: [
      { name: "path", type: "string", description: "File path relative to project root", required: true },
      { name: "changes", type: "string", description: "Description of changes to apply", required: true },
    ],
    permissions: ["file_read", "file_write"],
  },
  {
    name: "create_git_commit",
    description: "Stage and commit specified files with a meaningful message",
    parameters: [
      { name: "message", type: "string", description: "Commit message", required: true },
      { name: "files", type: "array", description: "File paths to include", required: true },
    ],
    permissions: ["git"],
  },
  {
    name: "run_tests",
    description: "Execute a test suite and return results",
    parameters: [
      { name: "test_suite", type: "string", description: "Test suite identifier or glob pattern", required: true },
    ],
    permissions: ["testing"],
  },
  {
    name: "analyze_security",
    description: "Perform a security scan on provided code",
    parameters: [
      { name: "code", type: "string", description: "Code to analyse", required: true },
      { name: "language", type: "string", description: "Programming language", required: false },
    ],
    permissions: ["security_scan"],
  },
  {
    name: "optimize_performance",
    description: "Analyse code and return performance optimisation suggestions",
    parameters: [
      { name: "code", type: "string", description: "Code to optimise", required: true },
    ],
    permissions: [],
  },
  {
    name: "add_documentation",
    description: "Generate JSDoc / inline documentation for code",
    parameters: [
      { name: "code", type: "string", description: "Code to document", required: true },
    ],
    permissions: ["file_write"],
  },
  {
    name: "integrate_service",
    description: "Add a third-party service integration (Stripe, Supabase, etc.)",
    parameters: [
      { name: "service", type: "string", description: "Service name", required: true },
      { name: "config", type: "object", description: "Service-specific configuration", required: false },
    ],
    permissions: ["file_write", "network"],
  },
  {
    name: "deploy",
    description: "Deploy the application to a target environment",
    parameters: [
      { name: "target", type: "string", description: "Deployment target: vercel | docker | custom", required: true },
    ],
    permissions: ["deployment", "network"],
  },
  {
    name: "debug",
    description: "Analyse an error and generate a fix",
    parameters: [
      { name: "error", type: "string", description: "Error message or stack trace", required: true },
      { name: "code", type: "string", description: "Relevant code context", required: false },
    ],
    permissions: [],
  },
];

// ── Validation ───────────────────────────────────────────────────────────────

export function validateToolCall(
  call: ToolCall,
  grantedPermissions: ToolPermission[] = []
): { valid: boolean; error?: string } {
  const def = toolDefinitions.find((t) => t.name === call.toolName);
  if (!def) {
    return { valid: false, error: `Unknown tool: ${call.toolName}` };
  }

  // Check required parameters
  for (const param of def.parameters) {
    if (param.required && !(param.name in call.parameters)) {
      return { valid: false, error: `Missing required parameter: ${param.name}` };
    }
  }

  // Check permissions
  const missing = def.permissions.filter((p) => !grantedPermissions.includes(p));
  if (missing.length > 0) {
    return { valid: false, error: `Missing permissions: ${missing.join(", ")}` };
  }

  return { valid: true };
}

// ── Logging ──────────────────────────────────────────────────────────────────

export interface ToolExecutionLog {
  timestamp: string;
  call: ToolCall;
  result: ToolResult;
}

const executionLog: ToolExecutionLog[] = [];

export function logToolExecution(call: ToolCall, result: ToolResult): void {
  executionLog.push({
    timestamp: new Date().toISOString(),
    call,
    result,
  });
  // Keep only the last 500 entries in memory
  if (executionLog.length > 500) {
    executionLog.splice(0, executionLog.length - 500);
  }
}

export function getToolExecutionLog(): ToolExecutionLog[] {
  return [...executionLog];
}
