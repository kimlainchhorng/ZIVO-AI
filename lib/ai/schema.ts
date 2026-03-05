import { z } from "zod";

export const GeneratedFileSchema = z.object({
  path: z.string(),
  content: z.string(),
  action: z.enum(["create", "update", "delete"]).default("create"),
  language: z.string().optional(),
});

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
});

export type AIOutput = z.infer<typeof AIOutputSchema>;
export type GeneratedFile = z.infer<typeof GeneratedFileSchema>;
