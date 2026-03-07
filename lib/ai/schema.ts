import { z } from "zod";

// ─── Generated File ───────────────────────────────────────────────────────────

export const GeneratedFileSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
  action: z.enum(["create", "update", "delete"]).default("create"),
  language: z.string().optional(),
  description: z.string().optional(),
  size: z.number().int().nonnegative().optional(),
  checksum: z.string().optional(),
});

// ─── AI Output ────────────────────────────────────────────────────────────────

export const AIOutputSchema = z.object({
  thinking: z.string().optional(),
  files: z.array(GeneratedFileSchema).min(1),
  env: z.array(z.string()).optional().default([]),
  routes: z.array(z.string()).optional().default([]),
  commands: z.array(z.string()).optional().default([]),
  warnings: z.array(z.string()).optional().default([]),
  missing_env: z.array(z.string()).optional().default([]),
  next_steps: z.array(z.string()).optional().default([]),
  summary: z.string().optional().default(""),
  preview_html: z.string().optional(),
  model: z.string().optional(),
  durationMs: z.number().int().nonnegative().optional(),
  inputTokens: z.number().int().nonnegative().optional(),
  outputTokens: z.number().int().nonnegative().optional(),
  dependencies: z.array(z.string()).optional().default([]),
  devDependencies: z.array(z.string()).optional().default([]),
  schemaChanges: z.boolean().optional(),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type AIOutput = z.infer<typeof AIOutputSchema>;
export type GeneratedFile = z.infer<typeof GeneratedFileSchema>;
