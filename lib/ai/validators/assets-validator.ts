// lib/ai/validators/assets-validator.ts — Validates that website builds include logo + images

import type { GeneratedFile } from "../schema";

export interface AssetValidationIssue {
  rule: string;
  severity: "error" | "warn";
  message: string;
  fixHint: string;
}

export interface AssetValidationResult {
  passed: boolean;
  issues: AssetValidationIssue[];
  passedRules: string[];
}

// ─── Rules ────────────────────────────────────────────────────────────────────

function checkAssetsFile(paths: Set<string>): AssetValidationIssue | null {
  if (!paths.has("lib/assets.ts")) {
    return {
      rule: "assets-file-present",
      severity: "error",
      message: "lib/assets.ts is missing — no stable image URLs or brandLogoSvg available.",
      fixHint: "Generate lib/assets.ts with brand, brandLogoSvg, and images exports.",
    };
  }
  return null;
}

function checkLogoComponent(paths: Set<string>): AssetValidationIssue | null {
  if (!paths.has("components/brand/Logo.tsx")) {
    return {
      rule: "logo-component-present",
      severity: "error",
      message: "components/brand/Logo.tsx is missing — Logo cannot be rendered.",
      fixHint: "Generate components/brand/Logo.tsx that renders brandLogoSvg from lib/assets.ts.",
    };
  }
  return null;
}

function checkHeaderLogo(files: GeneratedFile[]): AssetValidationIssue | null {
  const header = files.find((f) => f.path === "components/site/Header.tsx");
  if (!header) return null; // Header not generated yet — skip
  const content = header.content ?? "";
  if (!content.includes("Logo") && !content.includes("brandLogoSvg")) {
    return {
      rule: "header-displays-logo",
      severity: "warn",
      message: "components/site/Header.tsx does not import or use the Logo component.",
      fixHint: 'Add `import Logo from "@/components/brand/Logo"` and render <Logo /> in the header.',
    };
  }
  return null;
}

function checkFooterLogo(files: GeneratedFile[]): AssetValidationIssue | null {
  const footer = files.find((f) => f.path === "components/site/Footer.tsx");
  if (!footer) return null;
  const content = footer.content ?? "";
  if (!content.includes("Logo") && !content.includes("brandLogoSvg")) {
    return {
      rule: "footer-displays-logo",
      severity: "warn",
      message: "components/site/Footer.tsx does not import or use the Logo component.",
      fixHint: 'Add `import Logo from "@/components/brand/Logo"` and render <Logo /> in the footer.',
    };
  }
  return null;
}

function checkHeroImage(files: GeneratedFile[]): AssetValidationIssue | null {
  const hero = files.find(
    (f) =>
      f.path.toLowerCase().includes("hero") &&
      (f.path.endsWith(".tsx") || f.path.endsWith(".jsx"))
  );
  if (!hero) return null;
  const content = hero.content ?? "";
  const hasImage =
    content.includes("images.hero") ||
    content.includes("getHeroImageUrl") ||
    content.includes("picsum.photos") ||
    /<img\s/i.test(content) ||
    /next\/image/.test(content);
  if (!hasImage) {
    return {
      rule: "hero-renders-image",
      severity: "warn",
      message: `${hero.path} does not render a hero image.`,
      fixHint: 'Import `images` from "@/lib/assets" and render <img src={images.hero} />.',
    };
  }
  return null;
}

function checkFeaturesImages(files: GeneratedFile[]): AssetValidationIssue | null {
  const features = files.find(
    (f) =>
      f.path.toLowerCase().includes("feature") &&
      (f.path.endsWith(".tsx") || f.path.endsWith(".jsx"))
  );
  if (!features) return null;
  const content = features.content ?? "";
  const hasImages =
    content.includes("images.features") ||
    content.includes("getFeatureImageUrl") ||
    content.includes("picsum.photos") ||
    /<img\s/i.test(content) ||
    /next\/image/.test(content);
  if (!hasImages) {
    return {
      rule: "features-render-images",
      severity: "warn",
      message: `${features.path} does not render feature images.`,
      fixHint: 'Import `images` from "@/lib/assets" and map over images.features.',
    };
  }
  return null;
}

function checkTestimonialsAvatars(files: GeneratedFile[]): AssetValidationIssue | null {
  const testimonials = files.find(
    (f) =>
      f.path.toLowerCase().includes("testimonial") &&
      (f.path.endsWith(".tsx") || f.path.endsWith(".jsx"))
  );
  if (!testimonials) return null;
  const content = testimonials.content ?? "";
  const hasAvatars =
    content.includes("images.avatars") ||
    content.includes("getAvatarUrl") ||
    content.includes("picsum.photos") ||
    /<img\s/i.test(content) ||
    /next\/image/.test(content);
  if (!hasAvatars) {
    return {
      rule: "testimonials-render-avatars",
      severity: "warn",
      message: `${testimonials.path} does not render avatar images.`,
      fixHint: 'Import `images` from "@/lib/assets" and map over images.avatars.',
    };
  }
  return null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Validate that a website build includes all required logo and image assets.
 * Returns a list of issues and a `passed` flag (true when no errors exist).
 */
export function validateAssets(files: GeneratedFile[]): AssetValidationResult {
  const paths = new Set(files.map((f) => f.path));
  const issues: AssetValidationIssue[] = [];
  const passedRules: string[] = [];

  const rules: Array<() => AssetValidationIssue | null> = [
    () => checkAssetsFile(paths),
    () => checkLogoComponent(paths),
    () => checkHeaderLogo(files),
    () => checkFooterLogo(files),
    () => checkHeroImage(files),
    () => checkFeaturesImages(files),
    () => checkTestimonialsAvatars(files),
  ];

  const ruleNames = [
    "assets-file-present",
    "logo-component-present",
    "header-displays-logo",
    "footer-displays-logo",
    "hero-renders-image",
    "features-render-images",
    "testimonials-render-avatars",
  ];

  for (let i = 0; i < rules.length; i++) {
    const issue = rules[i]();
    if (issue) {
      issues.push(issue);
    } else {
      passedRules.push(ruleNames[i]);
    }
  }

  const passed = issues.every((iss) => iss.severity !== "error");

  return { passed, issues, passedRules };
}

/**
 * Returns a summary string suitable for SSE stage messages.
 */
export function summarizeAssetValidation(result: AssetValidationResult): string {
  if (result.passed && result.issues.length === 0) {
    return "Assets validation passed — logo and images present.";
  }
  const errors = result.issues.filter((i) => i.severity === "error").length;
  const warns = result.issues.filter((i) => i.severity === "warn").length;
  const parts: string[] = [];
  if (errors) parts.push(`${errors} error(s)`);
  if (warns) parts.push(`${warns} warning(s)`);
  return `Assets validation: ${parts.join(", ")} found.`;
}
