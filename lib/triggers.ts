// lib/triggers.ts — Cron and Webhook trigger definitions

import { createHmac } from "crypto";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CronSchedule {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
  expression: string;
}

export interface CronTrigger {
  id: string;
  type: "cron";
  schedule: CronSchedule;
  workflowId: string;
  enabled: boolean;
  createdAt: string;
}

export interface WebhookTrigger {
  id: string;
  type: "webhook";
  secret: string;
  workflowId: string;
  enabled: boolean;
  createdAt: string;
  lastFiredAt?: string;
}

export type TriggerConfig = CronTrigger | WebhookTrigger;

// ─── In-memory trigger store ──────────────────────────────────────────────────

const triggerStore = new Map<string, TriggerConfig>();

export function saveTrigger(trigger: TriggerConfig): void {
  triggerStore.set(trigger.id, trigger);
}

export function getTrigger(id: string): TriggerConfig | undefined {
  return triggerStore.get(id);
}

export function listTriggers(): TriggerConfig[] {
  return Array.from(triggerStore.values());
}

export function deleteTrigger(id: string): boolean {
  return triggerStore.delete(id);
}

// ─── Cron parsing ─────────────────────────────────────────────────────────────

/**
 * Parses a standard 5-field cron expression into a CronSchedule object.
 * Throws if the expression is not valid.
 */
export function parseCronExpression(expr: string): CronSchedule {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(`Invalid cron expression: expected 5 fields, got ${parts.length}`);
  }
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  return { minute, hour, dayOfMonth, month, dayOfWeek, expression: expr };
}

// ─── Webhook signature ────────────────────────────────────────────────────────

/**
 * Validates a GitHub-style webhook HMAC-SHA256 signature.
 * Expects signature in the format "sha256=<hex>".
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = `sha256=${createHmac("sha256", secret).update(payload, "utf8").digest("hex")}`;
  // Constant-time comparison to avoid timing attacks
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}
