// lib/ai/validators/completeness-gate.ts
// Validates that a website build contains all required files and minimal wiring.

import type { GeneratedFile } from "../schema";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CompletenessIssue {
  /** Short identifier for the failing check */
  rule: string;
  severity: "error" | "warn";
  message: string;
  /** Hint used when triggering targeted remediation */
  fixHint: string;
}

export interface CompletenessGateResult {
  /** True when there are no error-severity issues */
  passed: boolean;
  issues: CompletenessIssue[];
  passedRules: string[];
  /** Flat list of paths / descriptions missing — sent in SSE payload */
  missingItems: string[];
}

// ─── Required file lists ─────────────────────────────────────────────────────

/** Core marketing pages that must always exist */
const REQUIRED_CORE_PAGES = [
  "app/page.tsx",
  "app/about/page.tsx",
  "app/contact/page.tsx",
  "app/features/page.tsx",
  "app/pricing/page.tsx",
  "app/faq/page.tsx",
] as const;

/** Blog pages that must always exist */
const REQUIRED_BLOG_PAGES = [
  "app/blog/page.tsx",
  "app/blog/[slug]/page.tsx",
  "lib/content/blog-posts.ts",
] as const;

/** Legal pages that must always exist */
const REQUIRED_LEGAL_PAGES = [
  "app/(legal)/terms/page.tsx",
  "app/(legal)/privacy/page.tsx",
  "app/(legal)/cookies/page.tsx",
  "app/(legal)/acceptable-use/page.tsx",
  "app/(legal)/disclaimer/page.tsx",
] as const;

/** Brand/asset files that must always exist */
const REQUIRED_BRAND_ASSETS = [
  "lib/assets.ts",
  "components/brand/Logo.tsx",
  "components/site/Header.tsx",
  "components/site/Footer.tsx",
] as const;

// ─── Individual rule checks ───────────────────────────────────────────────────

function checkRequiredFiles(
  paths: Set<string>,
  requiredPaths: readonly string[],
  group: string
): CompletenessIssue[] {
  return requiredPaths
    .filter((p) => !paths.has(p))
    .map((p) => ({
      rule: `required-file:${p}`,
      severity: "error" as const,
      message: `Missing required ${group} file: ${p}`,
      fixHint: `Generate ${p} — see manifest description for content requirements.`,
    }));
}

function checkBlogListPageUsesPosts(files: GeneratedFile[]): CompletenessIssue | null {
  const blogList = files.find((f) => f.path === "app/blog/page.tsx");
  if (!blogList) return null; // Already caught by required-file check
  const content = blogList.content ?? "";
  const usesPosts =
    content.includes("blogPosts") ||
    content.includes("blog-posts") ||
    content.includes("BlogPost");
  if (!usesPosts) {
    return {
      rule: "blog-list-uses-posts",
      severity: "error",
      message: "app/blog/page.tsx does not import or use blogPosts from lib/content/blog-posts.",
      fixHint:
        'Import blogPosts from "@/lib/content/blog-posts" and render a card for each post.',
    };
  }
  return null;
}

function checkBlogListPageUsesImages(files: GeneratedFile[]): CompletenessIssue | null {
  const blogList = files.find((f) => f.path === "app/blog/page.tsx");
  if (!blogList) return null;
  const content = blogList.content ?? "";
  const usesImages =
    content.includes("coverImage") ||
    content.includes("picsum.photos") ||
    content.includes("getFeatureImageUrl") ||
    /<img\s/i.test(content) ||
    /next\/image/.test(content);
  if (!usesImages) {
    return {
      rule: "blog-list-uses-images",
      severity: "warn",
      message: "app/blog/page.tsx does not render blog cover images.",
      fixHint: "Render the post.coverImage field using next/image in each blog card.",
    };
  }
  return null;
}

function checkBlogPostPageUsesPosts(files: GeneratedFile[]): CompletenessIssue | null {
  const blogPost = files.find((f) => f.path === "app/blog/[slug]/page.tsx");
  if (!blogPost) return null;
  const content = blogPost.content ?? "";
  const usesPosts =
    content.includes("blogPosts") ||
    content.includes("blog-posts") ||
    content.includes("BlogPost");
  if (!usesPosts) {
    return {
      rule: "blog-post-uses-posts",
      severity: "error",
      message:
        "app/blog/[slug]/page.tsx does not import or use blogPosts from lib/content/blog-posts.",
      fixHint:
        'Import blogPosts from "@/lib/content/blog-posts", look up the post by params.slug, and render its fields.',
    };
  }
  return null;
}

function checkAssetsExports(files: GeneratedFile[]): CompletenessIssue | null {
  const assets = files.find((f) => f.path === "lib/assets.ts");
  if (!assets) return null; // Caught by required-file check
  const content = assets.content ?? "";
  const hasImages = content.includes("images") || content.includes("picsum.photos");
  const hasBrand = content.includes("brand") || content.includes("brandLogoSvg");
  if (!hasImages || !hasBrand) {
    return {
      rule: "assets-exports-image-sets",
      severity: "error",
      message:
        "lib/assets.ts must export both `brand`/`brandLogoSvg` and `images` (hero + features + avatars).",
      fixHint:
        "Ensure lib/assets.ts exports: brand, brandLogoSvg, and images with hero/features/avatars arrays.",
    };
  }
  return null;
}

function checkHeaderInLayout(files: GeneratedFile[]): CompletenessIssue | null {
  const layout = files.find((f) => f.path === "app/layout.tsx");
  if (!layout) return null;
  const content = layout.content ?? "";
  if (!content.includes("Header")) {
    return {
      rule: "layout-includes-header",
      severity: "warn",
      message: "app/layout.tsx does not appear to include the Header component.",
      fixHint: 'Import Header from "@/components/site/Header" and render <Header /> in the layout.',
    };
  }
  return null;
}

function checkFooterInLayout(files: GeneratedFile[]): CompletenessIssue | null {
  const layout = files.find((f) => f.path === "app/layout.tsx");
  if (!layout) return null;
  const content = layout.content ?? "";
  if (!content.includes("Footer")) {
    return {
      rule: "layout-includes-footer",
      severity: "warn",
      message: "app/layout.tsx does not appear to include the Footer component.",
      fixHint: 'Import Footer from "@/components/site/Footer" and render <Footer /> in the layout.',
    };
  }
  return null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Run the CompletenessGate against a set of generated website files.
 *
 * Returns `passed: true` when there are no error-severity issues.
 * `missingItems` contains human-readable descriptions of everything that failed —
 * this is streamed back to the client as part of the `COMPLETENESS_GATE_FAILED` SSE event.
 */
export function runCompletenessGate(files: GeneratedFile[]): CompletenessGateResult {
  const paths = new Set(files.map((f) => f.path));
  const issues: CompletenessIssue[] = [];
  const passedRules: string[] = [];

  // ── 1. Required file presence checks ──────────────────────────────────────
  const fileChecks: Array<[readonly string[], string]> = [
    [REQUIRED_CORE_PAGES, "core marketing page"],
    [REQUIRED_BLOG_PAGES, "blog"],
    [REQUIRED_LEGAL_PAGES, "legal"],
    [REQUIRED_BRAND_ASSETS, "brand/asset"],
  ];

  for (const [required, group] of fileChecks) {
    const fileIssues = checkRequiredFiles(paths, required, group);
    for (const issue of fileIssues) {
      issues.push(issue);
    }
    for (const p of required) {
      if (paths.has(p)) passedRules.push(`required-file:${p}`);
    }
  }

  // ── 2. Content/wiring checks ───────────────────────────────────────────────
  const contentChecks: Array<() => CompletenessIssue | null> = [
    () => checkBlogListPageUsesPosts(files),
    () => checkBlogListPageUsesImages(files),
    () => checkBlogPostPageUsesPosts(files),
    () => checkAssetsExports(files),
    () => checkHeaderInLayout(files),
    () => checkFooterInLayout(files),
  ];

  const contentRuleNames = [
    "blog-list-uses-posts",
    "blog-list-uses-images",
    "blog-post-uses-posts",
    "assets-exports-image-sets",
    "layout-includes-header",
    "layout-includes-footer",
  ];

  for (let i = 0; i < contentChecks.length; i++) {
    const issue = contentChecks[i]();
    if (issue) {
      issues.push(issue);
    } else {
      passedRules.push(contentRuleNames[i]);
    }
  }

  const passed = issues.every((iss) => iss.severity !== "error");

  const missingItems = issues.map((iss) => iss.message);

  return { passed, issues, passedRules, missingItems };
}

/**
 * Returns a short summary string suitable for SSE stage messages.
 */
export function summarizeCompletenessGate(result: CompletenessGateResult): string {
  if (result.passed && result.issues.length === 0) {
    return `CompletenessGate passed — all ${result.passedRules.length} checks OK.`;
  }
  const errors = result.issues.filter((i) => i.severity === "error").length;
  const warns = result.issues.filter((i) => i.severity === "warn").length;
  const parts: string[] = [];
  if (errors) parts.push(`${errors} missing file(s)/wiring error(s)`);
  if (warns) parts.push(`${warns} warning(s)`);
  return `CompletenessGate: ${parts.join(", ")}.`;
}
