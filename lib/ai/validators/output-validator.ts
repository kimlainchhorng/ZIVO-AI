import type { AIOutput } from "../schema";
import type { FeatureAnalysis } from "../feature-detector";

export interface ValidationResult {
  valid: boolean;
  missingPages: string[];
  missingComponents: string[];
  missingApiRoutes: string[];
  warnings: string[];
  fileCount: number;
  meetsMinimum: boolean;
}

export function validateOutput(output: AIOutput, analysis: FeatureAnalysis): ValidationResult {
  const generatedPaths = new Set(output.files.map((f) => f.path));

  const missingPages = analysis.requiredPages.filter((p) => !generatedPaths.has(p));
  const missingComponents = analysis.requiredComponents.filter((c) => !generatedPaths.has(c));
  const missingApiRoutes = analysis.requiredApiRoutes.filter((r) => !generatedPaths.has(r));

  const warnings: string[] = [];

  if (analysis.features.includes("auth") && missingPages.some((p) => p.includes("login") || p.includes("signup"))) {
    warnings.push("Prompt mentions auth but no login/signup pages were generated");
  }

  if (analysis.features.includes("database") && !generatedPaths.has("prisma/schema.prisma")) {
    warnings.push("Prompt mentions database but no Prisma schema was generated");
  }

  return {
    valid: missingPages.length === 0 && missingApiRoutes.length === 0,
    missingPages,
    missingComponents,
    missingApiRoutes,
    warnings,
    fileCount: output.files.length,
    meetsMinimum: output.files.length >= analysis.minimumFileCount,
  };
}
