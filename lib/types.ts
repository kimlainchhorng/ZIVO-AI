// Core types for ZIVO AI Developer Platform

export type DevelopmentPhase = "planning" | "development" | "testing" | "staging" | "production";
export type DeploymentStatus = "idle" | "building" | "deploying" | "deployed" | "failed" | "rolled-back";
export type FileAction = "create" | "update" | "delete" | "rename";

// ─── Project Memory ─────────────────────────────────────────────────────────

export interface AIProject {
  id: string;
  name: string;
  description: string;
  goals: string[];
  tech_stack: string[];
  active_pages: string[];
  db_schema: Record<string, DBTable>;
  recent_changes: ChangeRecord[];
  version: string;
  team_members: TeamMember[];
  phase: DevelopmentPhase;
  deployment_status: DeploymentStatus;
  created_at: string;
  updated_at: string;
}

export interface ChangeRecord {
  id: string;
  description: string;
  files_changed: string[];
  agent?: string;
  timestamp: string;
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
  language: string;
  action: FileAction;
  dependencies: string[];
  imports: string[];
  created_at: string;
  updated_at: string;
}

export interface FileOutput {
  path: string;
  content: string;
  action: FileAction;
  rename_from?: string;
  language?: string;
  dependencies?: string[];
}

export interface GeneratorOutput {
  files: FileOutput[];
  deletions: string[];
  directory_structure: string;
  action_items: string[];
}

// ─── Diff / Patch ─────────────────────────────────────────────────────────────

export interface DiffChunk {
  type: "add" | "remove" | "equal";
  line_number_before?: number;
  line_number_after?: number;
  content: string;
}

export interface FileDiff {
  path: string;
  before: string;
  after: string;
  chunks: DiffChunk[];
  patch: string;
}

// ─── Versions ─────────────────────────────────────────────────────────────────

export interface AIVersion {
  id: string;
  project_id: string;
  version_number: string;
  changelog: string;
  release_notes: string;
  snapshot: Record<string, string>; // path -> content
  created_at: string;
  deployed_at?: string;
  rolled_back_at?: string;
}

// ─── Deployments ──────────────────────────────────────────────────────────────

export interface AIDeployment {
  id: string;
  project_id: string;
  version_id: string;
  status: DeploymentStatus;
  url?: string;
  logs: string[];
  env_vars: Record<string, string>;
  checks_passed: boolean;
  created_at: string;
  completed_at?: string;
}

// ─── Errors ───────────────────────────────────────────────────────────────────

export interface AIError {
  id: string;
  project_id: string;
  message: string;
  stack_trace?: string;
  file_path?: string;
  line_number?: number;
  category: "build" | "runtime" | "lint" | "type" | "test" | "deploy";
  root_cause?: string;
  fix_proposals: FixProposal[];
  resolved: boolean;
  created_at: string;
}

export interface FixProposal {
  description: string;
  patch: FileDiff[];
  confidence: number; // 0-1
}

// ─── Database Builder ─────────────────────────────────────────────────────────

export interface DBTable {
  name: string;
  columns: DBColumn[];
  indexes: DBIndex[];
  rls_policies: RLSPolicy[];
  triggers: DBTrigger[];
  functions: DBFunction[];
}

export interface DBColumn {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
  primary_key: boolean;
  unique: boolean;
  references?: { table: string; column: string };
}

export interface DBIndex {
  name: string;
  columns: string[];
  unique: boolean;
}

export interface RLSPolicy {
  name: string;
  command: "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "ALL";
  using_expr: string;
  with_check_expr?: string;
}

export interface DBTrigger {
  name: string;
  event: string;
  timing: "BEFORE" | "AFTER" | "INSTEAD OF";
  function_name: string;
}

export interface DBFunction {
  name: string;
  language: string;
  body: string;
  returns: string;
}

// ─── Workflows ───────────────────────────────────────────────────────────────

export interface AIWorkflow {
  id: string;
  project_id: string;
  name: string;
  description: string;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
  created_at: string;
  updated_at: string;
}

export interface WorkflowState {
  id: string;
  name: string;
  type: "start" | "end" | "action" | "condition" | "parallel";
  config: Record<string, unknown>;
}

export interface WorkflowTransition {
  from: string;
  to: string;
  condition?: string;
  on_error?: string;
}

// ─── Agents ───────────────────────────────────────────────────────────────────

export type AgentType = "architect" | "ui" | "backend" | "qa" | "devops";

export interface AgentMessage {
  agent: AgentType;
  content: string;
  files?: FileOutput[];
  metadata?: Record<string, unknown>;
}

export interface AgentTask {
  id: string;
  project_id: string;
  type: AgentType;
  prompt: string;
  context: Record<string, unknown>;
  result?: AgentMessage;
  status: "pending" | "running" | "done" | "failed";
  created_at: string;
  completed_at?: string;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

export interface AITest {
  id: string;
  project_id: string;
  name: string;
  type: "unit" | "integration" | "e2e" | "snapshot";
  status: "passed" | "failed" | "skipped" | "pending";
  coverage?: number;
  error?: string;
  created_at: string;
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export interface AIMessage {
  id: string;
  project_id: string;
  role: "user" | "assistant" | "system" | "agent";
  content: string;
  agent?: AgentType;
  files?: FileOutput[];
  created_at: string;
}

// ─── Tool Actions ─────────────────────────────────────────────────────────────

export type ToolAction =
  | { type: "create_file"; path: string; content: string }
  | { type: "update_file"; path: string; patch: string }
  | { type: "delete_file"; path: string }
  | { type: "rename_file"; old_path: string; new_path: string }
  | { type: "run_tests" }
  | { type: "run_build" }
  | { type: "lint_fix" }
  | { type: "format_code" }
  | { type: "install_dependencies"; packages: string[] }
  | { type: "run_dev_server" };

export interface ToolResult {
  action: ToolAction["type"];
  success: boolean;
  output: string;
  error?: string;
}
