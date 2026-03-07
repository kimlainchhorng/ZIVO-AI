// lib/workflow-engine.ts — Workflow execution engine

// ─── Types ────────────────────────────────────────────────────────────────────

export type WorkflowStepType =
  | "generate"
  | "validate"
  | "fix"
  | "test"
  | "deploy"
  | "transform"
  | "notify"
  | "scrape"
  | "webhook"
  | "delay"
  | "http"
  | "ai"
  | "condition"
  | "loop"
  | "db"
  | "auth"
  | "storage"
  | "email"
  | "payments"
  | "code";

export interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  config: Record<string, unknown>;
  label?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  trigger?: "manual" | "push" | "schedule" | "webhook" | "event";
}

export interface WorkflowInput {
  projectId?: string;
  files?: Array<{ path: string; content: string }>;
  prompt?: string;
  [key: string]: unknown;
}

export type WorkflowEventType = "step_start" | "step_complete" | "step_error" | "workflow_complete" | "workflow_error";

export interface WorkflowEvent {
  type: WorkflowEventType;
  stepId?: string;
  stepType?: WorkflowStepType;
  data?: unknown;
  error?: string;
  timestamp: string;
}

// ─── In-memory notification store ─────────────────────────────────────────────

interface NotificationEntry {
  channel: string;
  message: string;
  severity: string;
  timestamp: string;
}

const _notificationStore: NotificationEntry[] = [];

// ─── URL safety ───────────────────────────────────────────────────────────────

/**
 * Guards against SSRF attacks by rejecting URLs that resolve to private/loopback addresses.
 * Blocks localhost, link-local (169.254.x.x), private RFC-1918 ranges, and non-http(s) schemes.
 */
function assertSafeUrl(raw: string): void {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`Invalid URL: ${raw}`);
  }

  const { protocol, hostname } = parsed;
  if (protocol !== "http:" && protocol !== "https:") {
    throw new Error(`URL scheme "${protocol}" is not allowed`);
  }

  // Block loopback and common private ranges
  const blocked = [
    /^localhost$/i,
    /^127\.\d+\.\d+\.\d+$/,
    /^0\.0\.0\.0$/,
    /^::1$/,
    /^10\.\d+\.\d+\.\d+$/,
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
    /^192\.168\.\d+\.\d+$/,
    /^169\.254\.\d+\.\d+$/, // link-local / AWS metadata
    /^fd[0-9a-f]{2}:/i,     // IPv6 ULA
    /^fc00:/i,              // IPv6 private
  ];

  if (blocked.some((re) => re.test(hostname))) {
    throw new Error(`Requests to private/internal addresses are not allowed`);
  }
}

// ─── In-memory workflow store ─────────────────────────────────────────────────

const workflowStore = new Map<string, Workflow>();

/**
 * Persists a workflow definition in-memory.
 */
export function saveWorkflow(workflow: Workflow): void {
  workflowStore.set(workflow.id, workflow);
}

/**
 * Returns all stored workflows.
 */
export function listWorkflows(): Workflow[] {
  return Array.from(workflowStore.values());
}

/**
 * Returns a workflow by ID.
 */
export function getWorkflow(id: string): Workflow | undefined {
  return workflowStore.get(id);
}

// ─── Execution engine ─────────────────────────────────────────────────────────

/**
 * Resolves {{context.stepId.output}} template references within a string.
 */
function resolveTemplate(value: string, context: Record<string, unknown>): string {
  return value.replace(/\{\{context\.([^}]+)\}\}/g, (_match, path: string) => {
    const parts = path.split(".");
    let current: unknown = context;
    for (const part of parts) {
      if (current == null || typeof current !== "object") return "";
      current = (current as Record<string, unknown>)[part];
    }
    return current != null ? String(current) : "";
  });
}

/**
 * Recursively resolves template references inside a config object.
 */
function resolveConfig(
  config: Record<string, unknown>,
  context: Record<string, unknown>
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(config)) {
    if (typeof val === "string") {
      resolved[key] = resolveTemplate(val, context);
    } else if (val !== null && typeof val === "object" && !Array.isArray(val)) {
      resolved[key] = resolveConfig(val as Record<string, unknown>, context);
    } else {
      resolved[key] = val;
    }
  }
  return resolved;
}

/**
 * Executes a workflow step-by-step, yielding progress events as an async generator.
 * Each step's output is merged into a shared context so later steps can reference it
 * via {{context.stepId.output}} template syntax.
 */
export async function* executeWorkflow(
  workflow: Workflow,
  input: WorkflowInput
): AsyncGenerator<WorkflowEvent> {
  // Shared context: maps stepId → step output
  const context: Record<string, unknown> = { input };

  for (const step of workflow.steps) {
    yield {
      type: "step_start",
      stepId: step.id,
      stepType: step.type,
      timestamp: new Date().toISOString(),
    };

    try {
      const resolvedConfig = resolveConfig(step.config, context);
      const result = await executeStep({ ...step, config: resolvedConfig }, input);
      // Store output in context so subsequent steps can reference it
      context[step.id] = { output: result };
      // Also merge into flat input for backward-compat
      if (result && typeof result === "object") {
        Object.assign(input, result);
      }
      yield {
        type: "step_complete",
        stepId: step.id,
        stepType: step.type,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      yield {
        type: "step_error",
        stepId: step.id,
        stepType: step.type,
        error: errorMsg,
        timestamp: new Date().toISOString(),
      };
      yield {
        type: "workflow_error",
        error: `Step ${step.id} failed: ${errorMsg}`,
        timestamp: new Date().toISOString(),
      };
      return;
    }
  }

  yield {
    type: "workflow_complete",
    data: { stepsCompleted: workflow.steps.length },
    timestamp: new Date().toISOString(),
  };
}

async function executeStep(
  step: WorkflowStep,
  input: WorkflowInput
): Promise<Record<string, unknown>> {
  switch (step.type) {
    // ── Legacy engine steps ────────────────────────────────────────────────────
    case "generate":
      return { status: "generated", files: [] };
    case "fix":
      return { status: "fixed", appliedFixes: [] };
    case "test":
      return { status: "tested", passed: 0, failed: 0 };
    case "deploy":
      return { status: "deployed", url: null };

    // ── transform ─────────────────────────────────────────────────────────────
    case "transform": {
      const data = (step.config.input as unknown) ?? input;
      const transformation = (step.config.transformation as string | undefined) ?? "return data;";
      const outputKey = (step.config.outputKey as string | undefined) ?? "transformed";
      let output: unknown;
      try {
        const fn = new Function("data", transformation);
        output = fn(data);
      } catch (err) {
        throw new Error(`transform script error: ${err instanceof Error ? err.message : String(err)}`);
      }
      return { status: "transformed", [outputKey]: output };
    }

    // ── validate ──────────────────────────────────────────────────────────────
    case "validate": {
      const data = (step.config.data as Record<string, unknown> | undefined) ?? (input as Record<string, unknown>);
      const schema = step.config.schema as Record<string, unknown> | undefined;
      const strict = (step.config.strict as boolean | undefined) ?? false;

      if (!schema) {
        return { status: "validated", valid: true, issues: [] };
      }

      const issues: string[] = [];
      const requiredFields = (schema.required as string[] | undefined) ?? [];
      for (const field of requiredFields) {
        if (data[field] == null) {
          issues.push(`Missing required field: ${field}`);
        }
      }

      const properties = (schema.properties as Record<string, { type?: string }> | undefined) ?? {};
      for (const [field, def] of Object.entries(properties)) {
        if (data[field] != null && def.type && typeof data[field] !== def.type) {
          issues.push(`Field "${field}" expected type ${def.type}, got ${typeof data[field]}`);
        }
      }

      const valid = issues.length === 0;
      if (!valid && strict) {
        throw new Error(`Validation failed: ${issues.join("; ")}`);
      }
      return { status: "validated", valid, issues };
    }

    // ── notify ────────────────────────────────────────────────────────────────
    case "notify": {
      const channel = (step.config.channel as string | undefined) ?? "default";
      const message = (step.config.message as string | undefined) ?? "";
      const severity = (step.config.severity as string | undefined) ?? "info";
      const entry: NotificationEntry = {
        channel,
        message,
        severity,
        timestamp: new Date().toISOString(),
      };
      _notificationStore.push(entry);
      return { status: "notified", channel, severity, message };
    }

    // ── scrape ────────────────────────────────────────────────────────────────
    case "scrape": {
      const url = (step.config.url as string | undefined) ?? "";
      if (!url) throw new Error("scrape: url is required");
      assertSafeUrl(url);
      const format = (step.config.format as string | undefined) ?? "text";

      const res = await fetch(url, {
        headers: { "User-Agent": "ZIVO-AI-Scraper/1.0" },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) throw new Error(`scrape: HTTP ${res.status} from ${url}`);

      const html = await res.text();
      // Text extraction for AI consumption: remove all tags in one pass (not for browser rendering).
      // Replace the full content of any tag (including its contents for script/style) by first
      // collapsing inline script/style content, then stripping all remaining HTML tags.
      const noScripts = html.replace(/<(script|style)\b[^<]*(?:<(?!\/\1\b)[^<]*)*<\/\1\s*>/gi, " ");
      const text = noScripts
        .replace(/<[^>]*>/g, " ")
        .replace(/&[a-z]+;/gi, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 8000);

      return {
        status: "scraped",
        url,
        content: format === "html" ? html.slice(0, 8000) : text,
        length: text.length,
      };
    }

    // ── webhook ───────────────────────────────────────────────────────────────
    case "webhook": {
      const url = (step.config.url as string | undefined) ?? "";
      if (!url) throw new Error("webhook: url is required");
      assertSafeUrl(url);
      const method = ((step.config.method as string | undefined) ?? "POST").toUpperCase();
      const headers = (step.config.headers as Record<string, string> | undefined) ?? {};
      const payload = step.config.payload;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...headers },
        body: payload !== undefined ? JSON.stringify(payload) : undefined,
        signal: AbortSignal.timeout(15_000),
      });
      let responseBody: unknown;
      try {
        responseBody = await res.json();
      } catch {
        responseBody = await res.text().catch(() => "");
      }
      return {
        status: res.ok ? "success" : "error",
        statusCode: res.status,
        response: responseBody,
      };
    }

    // ── delay ─────────────────────────────────────────────────────────────────
    case "delay": {
      const ms = Math.max(0, Math.min((step.config.ms as number | undefined) ?? 0, 30_000));
      await new Promise<void>((resolve) => setTimeout(resolve, ms));
      return { status: "delayed", ms };
    }

    // ── http ──────────────────────────────────────────────────────────────────
    case "http": {
      const url = (step.config.url as string | undefined) ?? "";
      if (!url) throw new Error("http: url is required");
      assertSafeUrl(url);
      const method = ((step.config.method as string | undefined) ?? "GET").toUpperCase();
      const headers = (step.config.headers as Record<string, string> | undefined) ?? {};
      const body = step.config.body;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...headers },
        body: body && method !== "GET" ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(15_000),
      });
      let responseBody: unknown;
      try {
        responseBody = await res.json();
      } catch {
        responseBody = await res.text().catch(() => "");
      }
      return { status: res.ok ? "success" : "error", statusCode: res.status, response: responseBody };
    }

    // ── condition ─────────────────────────────────────────────────────────────
    case "condition": {
      const expression = (step.config.expression as string | undefined) ?? "false";
      let result = false;
      try {
        // Note: new Function executes in the Node.js server process; only use for trusted workflow definitions.
        const fn = new Function("input", `"use strict"; return !!(${expression});`);
        result = Boolean(fn(input));
      } catch {
        result = false;
      }
      return { status: "evaluated", branch: result ? "true" : "false", result };
    }

    // ── loop ──────────────────────────────────────────────────────────────────
    case "loop": {
      const count = Math.min((step.config.count as number | undefined) ?? 1, 100);
      return { status: "loop_configured", count, iterations: count };
    }

    // ── db ────────────────────────────────────────────────────────────────────
    case "db":
      return { status: "success", rows: [{ id: 1, data: "sample-db-row" }], rowCount: 1 };

    // ── auth ──────────────────────────────────────────────────────────────────
    case "auth":
      return { status: "success", authenticated: true, userId: "usr_mock_001", role: "user" };

    // ── storage ───────────────────────────────────────────────────────────────
    case "storage":
      return { status: "success", url: "https://storage.example.com/mock-file.bin", size: 1024 };

    // ── email ─────────────────────────────────────────────────────────────────
    case "email": {
      const to = (step.config.to as string | undefined) ?? "";
      const subject = (step.config.subject as string | undefined) ?? "Notification";
      return { status: "sent", to, subject, simulated: true };
    }

    // ── payments ──────────────────────────────────────────────────────────────
    case "payments": {
      const amount = (step.config.amount as number | undefined) ?? 0;
      const currency = (step.config.currency as string | undefined) ?? "USD";
      return { status: "success", paymentId: `pay_mock_${Date.now()}`, amount, currency };
    }

    // ── code ──────────────────────────────────────────────────────────────────
    case "code": {
      const script = (step.config.script as string | undefined) ?? "";
      const language = (step.config.language as string | undefined) ?? "javascript";
      if (language === "javascript" || language === "js") {
        try {
          const fn = new Function("input", script);
          const result = fn(input);
          return { status: "executed", result };
        } catch (err) {
          throw new Error(`code execution error: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
      return { status: "executed", language, simulated: true };
    }

    // ── ai ────────────────────────────────────────────────────────────────────
    case "ai":
      return { status: "completed", response: "[AI response placeholder — configure OPENAI_API_KEY]" };

    default:
      return { status: "skipped" };
  }
}

/**
 * Retrieves all in-memory notifications (for testing/debugging).
 */
export function getNotifications(): NotificationEntry[] {
  return [..._notificationStore];
}

