// JSON Schema definitions for all AI structured outputs.
// Provides type-safe response formats with validation helpers.

// ── Schema types ────────────────────────────────────────────────────────────

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
}

export interface CodeGenerationSchema {
  type: "code_generation";
  description: string;
  files: GeneratedFile[];
  dependencies?: string[];
  instructions?: string[];
  warnings?: string[];
}

export interface ArchitectureDecision {
  id: string;
  title: string;
  description: string;
  rationale: string;
  alternatives?: string[];
  consequences?: string[];
}

export interface ArchitectureSchema {
  type: "architecture";
  overview: string;
  decisions: ArchitectureDecision[];
  techStack: Record<string, string>;
  dataFlow?: string;
  diagram?: string;
}

export interface SecurityFinding {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  cwe?: string;
  fix?: string;
  codeSnippet?: string;
}

export interface SecuritySchema {
  type: "security";
  summary: string;
  riskLevel: "critical" | "high" | "medium" | "low";
  findings: SecurityFinding[];
  recommendations: string[];
}

export interface PerformanceIssue {
  id: string;
  category: "query" | "bundle" | "caching" | "rendering" | "network" | "other";
  description: string;
  impact: "high" | "medium" | "low";
  suggestion: string;
  estimatedGain?: string;
}

export interface PerformanceSchema {
  type: "performance";
  summary: string;
  score: number;
  issues: PerformanceIssue[];
  recommendations: string[];
}

export interface ErrorSchema {
  type: "error_analysis";
  errorMessage: string;
  rootCause: string;
  stackTrace?: string;
  suggestedFix: string;
  codeChange?: GeneratedFile;
  explanation: string;
}

export interface RefactoringChange {
  file: string;
  description: string;
  before?: string;
  after?: string;
  category: "readability" | "performance" | "security" | "maintainability" | "pattern";
  priority: "blocker" | "major" | "minor" | "suggestion";
}

export interface RefactoringSchema {
  type: "refactoring";
  summary: string;
  changes: RefactoringChange[];
  testingNotes?: string;
}

// Union type for all schemas
export type AISchema =
  | CodeGenerationSchema
  | ArchitectureSchema
  | SecuritySchema
  | PerformanceSchema
  | ErrorSchema
  | RefactoringSchema;

// ── Validation helpers ───────────────────────────────────────────────────────

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateCodeGenerationSchema(data: unknown): data is CodeGenerationSchema {
  if (!isObject(data)) return false;
  if (data.type !== "code_generation") return false;
  if (typeof data.description !== "string") return false;
  if (!Array.isArray(data.files)) return false;
  return data.files.every(
    (f) =>
      isObject(f) &&
      typeof f.path === "string" &&
      typeof f.content === "string" &&
      typeof f.language === "string"
  );
}

export function validateArchitectureSchema(data: unknown): data is ArchitectureSchema {
  if (!isObject(data)) return false;
  if (data.type !== "architecture") return false;
  if (typeof data.overview !== "string") return false;
  if (!Array.isArray(data.decisions)) return false;
  return isObject(data.techStack);
}

export function validateSecuritySchema(data: unknown): data is SecuritySchema {
  if (!isObject(data)) return false;
  if (data.type !== "security") return false;
  if (typeof data.summary !== "string") return false;
  return Array.isArray(data.findings);
}

export function validatePerformanceSchema(data: unknown): data is PerformanceSchema {
  if (!isObject(data)) return false;
  if (data.type !== "performance") return false;
  if (typeof data.summary !== "string") return false;
  return Array.isArray(data.issues);
}

export function validateErrorSchema(data: unknown): data is ErrorSchema {
  if (!isObject(data)) return false;
  if (data.type !== "error_analysis") return false;
  return typeof data.rootCause === "string" && typeof data.suggestedFix === "string";
}

export function validateRefactoringSchema(data: unknown): data is RefactoringSchema {
  if (!isObject(data)) return false;
  if (data.type !== "refactoring") return false;
  return Array.isArray(data.changes);
}

// ── Parse and validate AI output ────────────────────────────────────────────

export function parseAIOutput(raw: string): { data: AISchema | null; error: string | null } {
  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return { data: null, error: `Invalid JSON: ${raw.slice(0, 200)}` };
  }

  if (validateCodeGenerationSchema(parsed)) return { data: parsed, error: null };
  if (validateArchitectureSchema(parsed)) return { data: parsed, error: null };
  if (validateSecuritySchema(parsed)) return { data: parsed, error: null };
  if (validatePerformanceSchema(parsed)) return { data: parsed, error: null };
  if (validateErrorSchema(parsed)) return { data: parsed, error: null };
  if (validateRefactoringSchema(parsed)) return { data: parsed, error: null };

  return { data: null, error: "Output does not match any known schema" };
}
