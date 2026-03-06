import { z } from "zod";

export const GeneratePipelineRequestSchema = z.object({
  appName: z.string().optional().default("My App"),
  pipelineType: z.enum(["etl", "cron", "webhook", "queue", "all"]).optional().default("etl"),
  description: z.string().optional().default("data processing pipeline"),
  queueProvider: z.enum(["bullmq", "inngest"]).optional().default("bullmq"),
});

export const PipelineFileSchema = z.object({
  path: z.string(),
  content: z.string(),
  action: z.enum(["create", "update", "delete"]),
});

export const GeneratePipelineResponseSchema = z.object({
  files: z.array(PipelineFileSchema),
  summary: z.string(),
  setupInstructions: z.string(),
  requiredEnvVars: z.array(z.string()),
});

export type GeneratePipelineRequest = z.infer<typeof GeneratePipelineRequestSchema>;
export type GeneratePipelineResponse = z.infer<typeof GeneratePipelineResponseSchema>;
