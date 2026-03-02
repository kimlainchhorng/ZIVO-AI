// ZIVO AI Developer Platform – Shared Types

export type DeploymentStatus = "pending" | "building" | "deployed" | "failed" | "rolled_back";
export type DevelopmentPhase = "planning" | "development" | "testing" | "staging" | "production";
export type AgentRole = "architect" | "ui" | "backend" | "qa" | "devops";
export type WorkflowStatus = "active" | "paused" | "completed" | "failed";
export type DiffType = "same" | "add" | "del";

// ─── Project Memory ──────────────────────────────────────────────────────────
export interface AIProject {
  id: string;
  name: string;
  description?: string;
  goals?: string[];
  tech_stack?: string[];
  active_pages?: string[];
  db_schema?: Record<string, unknown>;
  recent_changes?: ChangeEntry[];
  version: string;
  phase: DevelopmentPhase;
  deployment_status: DeploymentStatus;
  team_members?: TeamMember[];
  created_at: string;
  updated_at: string;
}

export interface ChangeEntry {
  timestamp: string;
  description: string;
  author?: string;
  files_affected?: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email?: string;
}

// ─── File System ─────────────────────────────────────────────────────────────
export interface AIFile {
  id: string;
  project_id: string;
  path: string;
  content: string;
  language?: string;
  dependencies?: string[];
  imports?: string[];
  created_at: string;
  updated_at: string;
}

export interface FileOutput {
  path: string;
  content: string;
  action: "create" | "update" | "delete" | "rename";
  old_path?: string;
  language?: string;
  dependencies?: string[];
}

export interface GenerateFilesRequest {
  project_id: string;
  prompt: string;
  context?: {
    existing_files?: string[];
    tech_stack?: string[];
    framework?: string;
  };
}

export interface GenerateFilesResponse {
  files: FileOutput[];
  deletions?: string[];
  renames?: Array<{ from: string; to: string }>;
  directory_structure?: string;
  dependencies?: string[];
  action_items?: string[];
}

// ─── Diff / Patch ────────────────────────────────────────────────────────────
export interface DiffLine {
  type: DiffType;
  text: string;
  line_a?: number;
  line_b?: number;
}

export interface PatchFile {
  path: string;
  hunks: PatchHunk[];
}

export interface PatchHunk {
  start_a: number;
  count_a: number;
  start_b: number;
  count_b: number;
  lines: DiffLine[];
}

// ─── Versions ────────────────────────────────────────────────────────────────
export interface AIVersion {
  id: string;
  project_id: string;
  version_number: string;
  changelog?: string;
  release_notes?: string;
  snapshot?: Record<string, unknown>;
  deployed: boolean;
  rollback_id?: string;
  created_at: string;
}

// ─── Deployments ─────────────────────────────────────────────────────────────
export interface AIDeployment {
  id: string;
  project_id: string;
  version_id?: string;
  status: DeploymentStatus;
  url?: string;
  environment: "preview" | "production";
  env_vars?: Record<string, string>;
  build_log?: string;
  error_log?: string;
  pre_checks?: CheckResult[];
  post_checks?: CheckResult[];
  created_at: string;
  updated_at: string;
}

export interface CheckResult {
  name: string;
  passed: boolean;
  message?: string;
}

// ─── Errors ──────────────────────────────────────────────────────────────────
export interface AIError {
  id: string;
  project_id: string;
  deployment_id?: string;
  error_type: string;
  message: string;
  stack_trace?: string;
  file_path?: string;
  line_number?: number;
  root_cause?: string;
  fix_proposal?: string;
  patch?: PatchFile[];
  resolved: boolean;
  created_at: string;
}

export interface ParsedBuildError {
  type: "type_error" | "syntax_error" | "import_error" | "runtime_error" | "build_error" | "unknown";
  message: string;
  file?: string;
  line?: number;
  column?: number;
  stack?: string;
  fix_suggestion?: string;
}

// ─── Tests ───────────────────────────────────────────────────────────────────
export interface AITest {
  id: string;
  project_id: string;
  name: string;
  type: "unit" | "integration" | "e2e" | "snapshot";
  status: "passing" | "failing" | "skipped" | "pending";
  coverage?: number;
  duration_ms?: number;
  error?: string;
  created_at: string;
}

// ─── Workflows ───────────────────────────────────────────────────────────────
export interface AIWorkflow {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  created_at: string;
  updated_at: string;
}

export interface WorkflowTrigger {
  type: "manual" | "schedule" | "event" | "webhook";
  config?: Record<string, unknown>;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: "action" | "condition" | "parallel" | "loop";
  action?: string;
  config?: Record<string, unknown>;
  next?: string[];
  on_error?: "fail" | "continue" | "retry";
  retry_count?: number;
}

// ─── Agents ──────────────────────────────────────────────────────────────────
export interface AgentMessage {
  role: AgentRole | "orchestrator" | "user";
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AgentResult {
  agent: AgentRole;
  success: boolean;
  output: string;
  artifacts?: Record<string, unknown>;
  errors?: string[];
  duration_ms?: number;
}

export interface MultiAgentRequest {
  project_id?: string;
  task: string;
  context?: Record<string, unknown>;
  agents?: AgentRole[];
}

export interface MultiAgentResponse {
  task: string;
  results: AgentResult[];
  synthesis: string;
  conflicts?: string[];
  action_items?: string[];
}

// ─── Database Builder ─────────────────────────────────────────────────────────
export interface TableSchema {
  name: string;
  columns: ColumnDefinition[];
  indexes?: IndexDefinition[];
  rls_policies?: RLSPolicy[];
  triggers?: TriggerDefinition[];
  functions?: FunctionDefinition[];
}

export interface ColumnDefinition {
  name: string;
  type: string;
  nullable?: boolean;
  default?: string;
  primary_key?: boolean;
  unique?: boolean;
  foreign_key?: { table: string; column: string };
}

export interface IndexDefinition {
  name: string;
  columns: string[];
  unique?: boolean;
  type?: "btree" | "gin" | "gist" | "hash";
}

export interface RLSPolicy {
  name: string;
  command: "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "ALL";
  using?: string;
  with_check?: string;
}

export interface TriggerDefinition {
  name: string;
  timing: "BEFORE" | "AFTER" | "INSTEAD OF";
  event: "INSERT" | "UPDATE" | "DELETE";
  function_name: string;
}

export interface FunctionDefinition {
  name: string;
  language: "plpgsql" | "sql";
  returns: string;
  body: string;
}

// ─── Tool Actions ─────────────────────────────────────────────────────────────
export type ToolAction =
  | "create_file"
  | "update_file"
  | "delete_file"
  | "rename_file"
  | "run_tests"
  | "run_build"
  | "lint_fix"
  | "format_code"
  | "install_dependencies"
  | "run_dev_server";

export interface ToolRequest {
  action: ToolAction;
  project_id?: string;
  params?: Record<string, unknown>;
}

export interface ToolResponse {
  action: ToolAction;
  success: boolean;
  output?: string;
  error?: string;
  files_affected?: string[];
}

// ─── Dependencies ─────────────────────────────────────────────────────────────
export interface AIDependency {
  id: string;
  project_id: string;
  name: string;
  version: string;
  type: "production" | "development" | "peer";
  latest_version?: string;
  has_vulnerabilities?: boolean;
  created_at: string;
}
