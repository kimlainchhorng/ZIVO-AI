import { z } from "zod";

export const BuildErrorSchema = z.object({
  file: z.string().optional(),
  line: z.number().optional(),
  message: z.string(),
  type: z.enum(["typescript", "eslint", "runtime", "missing-import"]),
});

export const FixFileSchema = z.object({
  path: z.string(),
  content: z.string(),
  action: z.enum(["create", "update", "delete"]),
});

export const FixErrorsRequestSchema = z.object({
  files: z.array(FixFileSchema).min(1, "At least one file required"),
  errors: z.array(BuildErrorSchema),
  iteration: z.number().optional().default(0),
  broadFix: z.boolean().optional().default(false),
});

export const FixErrorsResponseSchema = z.object({
  files: z.array(FixFileSchema),
  fixed: z.number(),
  summary: z.string(),
  iterations: z.number(),
});

export type BuildError = z.infer<typeof BuildErrorSchema>;
export type FixFile = z.infer<typeof FixFileSchema>;
export type FixErrorsRequest = z.infer<typeof FixErrorsRequestSchema>;
export type FixErrorsResponse = z.infer<typeof FixErrorsResponseSchema>;
