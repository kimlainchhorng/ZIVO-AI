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

// ─── Design-quality validator rules ─────────────────────────────────────────

/** Warn when hardcoded hex colours appear outside token/config files */
const HARDCODED_HEX_RE = /#([0-9a-fA-F]{3,8})\b/g;
const TOKEN_FILE_RE = /tokens|design-system|tailwind|globals|theme/i;

/** Warn when inline styles are used for layout properties */
const INLINE_LAYOUT_STYLE_RE =
  /style=\{[^}]*\b(display|flex|grid|position|margin|padding|width|height|gap|align-items|justify-content)\b/;

function validateDesignQuality(
  files: AIOutput["files"],
  warnings: string[]
): void {
  for (const file of files) {
    if (!/\.(tsx|jsx|ts|js)$/.test(file.path)) continue;
    const lines = file.content.split("\n");
    let hexWarned = false;
    let layoutStyleWarned = false;

    for (const line of lines) {
      // Hex colour outside token files
      if (!hexWarned && !TOKEN_FILE_RE.test(file.path) && HARDCODED_HEX_RE.test(line)) {
        warnings.push(
          `${file.path}: hardcoded hex colour detected — use design tokens from lib/design/tokens.ts instead`
        );
        hexWarned = true;
      }
      // Inline layout style
      if (!layoutStyleWarned && INLINE_LAYOUT_STYLE_RE.test(line)) {
        warnings.push(
          `${file.path}: inline layout style detected — prefer Tailwind classes or a layout component`
        );
        layoutStyleWarned = true;
      }
      if (hexWarned && layoutStyleWarned) break;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────

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

  // Run design-quality checks (warnings only, never block)
  validateDesignQuality(output.files, warnings);

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
