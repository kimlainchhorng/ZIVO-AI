// SEO analysis engine — static checks on generated file content.

export interface GeneratedFile {
  path: string;
  content: string;
  action?: string;
}

export type SEOSeverity = "critical" | "high" | "medium" | "low";

export interface SEOIssue {
  severity: SEOSeverity;
  rule: string;
  description: string;
  file?: string;
  fix?: string;
}

export interface SEOReport {
  score: number;
  issues: SEOIssue[];
  recommendations: string[];
  passedChecks: string[];
}

const SEVERITY_DEDUCTIONS: Record<SEOSeverity, number> = {
  critical: 20,
  high: 15,
  medium: 10,
  low: 5,
};

function deduct(score: number, severity: SEOSeverity): number {
  return Math.max(0, score - SEVERITY_DEDUCTIONS[severity]);
}

function isHtmlFile(file: GeneratedFile): boolean {
  return (
    file.path.endsWith(".html") ||
    file.path.endsWith(".htm") ||
    file.path.endsWith(".tsx") ||
    file.path.endsWith(".jsx")
  );
}

function isLayoutFile(file: GeneratedFile): boolean {
  return file.path.includes("layout.tsx") || file.path.includes("layout.jsx");
}

export function analyzeSEO(files: GeneratedFile[]): SEOReport {
  const issues: SEOIssue[] = [];
  const passedChecks: string[] = [];

  const htmlFiles = files.filter(isHtmlFile);
  const allPaths = files.map((f) => f.path);

  // Check for robots.txt
  const hasRobots = allPaths.some((p) => p.includes("robots.txt"));
  if (hasRobots) {
    passedChecks.push("robots.txt present");
  } else {
    issues.push({
      severity: "medium",
      rule: "missing-robots-txt",
      description: "No robots.txt file found. Search engines need this to understand crawl rules.",
      fix: "Add a public/robots.txt file with appropriate directives.",
    });
  }

  // Check for sitemap.xml
  const hasSitemap = allPaths.some((p) => p.includes("sitemap.xml") || p.includes("sitemap.ts"));
  if (hasSitemap) {
    passedChecks.push("sitemap present");
  } else {
    issues.push({
      severity: "medium",
      rule: "missing-sitemap",
      description: "No sitemap.xml or sitemap.ts found. Sitemaps help search engines index your pages.",
      fix: "Add a public/sitemap.xml or app/sitemap.ts using Next.js MetadataRoute.Sitemap.",
    });
  }

  // Next.js: check for metadata export in layout.tsx
  const layoutFiles = files.filter(isLayoutFile);
  if (layoutFiles.length > 0) {
    const hasMetadataExport = layoutFiles.some(
      (f) =>
        f.content.includes("export const metadata") ||
        f.content.includes("export async function generateMetadata")
    );
    if (hasMetadataExport) {
      passedChecks.push("Next.js metadata export in layout");
    } else {
      issues.push({
        severity: "high",
        rule: "missing-nextjs-metadata",
        description: "layout.tsx is missing a `metadata` export. Next.js uses this for <title> and meta tags.",
        fix: "Add `export const metadata: Metadata = { title: '...', description: '...' }` to layout.tsx.",
        file: layoutFiles[0]?.path,
      });
    }
  }

  for (const file of htmlFiles) {
    const { content, path: filePath } = file;
    const lower = content.toLowerCase();

    // Missing <title>
    const hasTitle =
      lower.includes("<title") ||
      lower.includes("metadata") ||
      lower.includes("generatemetadata");
    if (hasTitle) {
      passedChecks.push(`<title> present in ${filePath}`);
    } else {
      issues.push({
        severity: "critical",
        rule: "missing-title",
        description: "Page is missing a <title> tag. The title is critical for SEO and browser tab display.",
        file: filePath,
        fix: "Add a descriptive <title> tag or Next.js metadata export.",
      });
    }

    // Missing meta description
    const hasDescription =
      lower.includes('name="description"') ||
      lower.includes("name='description'") ||
      (lower.includes("metadata") && lower.includes("description"));
    if (hasDescription) {
      passedChecks.push(`meta description present in ${filePath}`);
    } else {
      issues.push({
        severity: "high",
        rule: "missing-meta-description",
        description: "Page is missing a meta description. This appears in search result snippets.",
        file: filePath,
        fix: "Add `<meta name=\"description\" content=\"...\" />` or set `description` in Next.js metadata.",
      });
    }

    // Missing Open Graph tags
    const hasOG =
      lower.includes("og:title") ||
      lower.includes("og:description") ||
      lower.includes("opengraph");
    if (hasOG) {
      passedChecks.push(`Open Graph tags present in ${filePath}`);
    } else {
      issues.push({
        severity: "medium",
        rule: "missing-open-graph",
        description: "Page is missing Open Graph tags. These control how the page looks when shared on social media.",
        file: filePath,
        fix: "Add og:title, og:description, og:image, and og:url meta tags (or use Next.js openGraph metadata).",
      });
    }

    // Missing lang attribute on <html>
    const hasLang =
      lower.includes("<html lang") ||
      lower.includes("<html\n") ||
      lower.includes("lang={") ||
      (filePath.includes("layout") && lower.includes("lang"));
    if (hasLang) {
      passedChecks.push(`lang attribute present in ${filePath}`);
    } else if (filePath.includes("layout") || lower.includes("<html")) {
      issues.push({
        severity: "high",
        rule: "missing-lang-attribute",
        description: "The <html> element is missing a lang attribute. Screen readers use this to determine language.",
        file: filePath,
        fix: 'Add `lang="en"` to the <html> element.',
      });
    }

    // Images without alt
    const imgMatches = content.matchAll(/<img(?![^>]*\balt\s*=)[^>]*>/gi);
    const missingAltImgs = Array.from(imgMatches);
    if (missingAltImgs.length > 0) {
      issues.push({
        severity: "high",
        rule: "images-without-alt",
        description: `${missingAltImgs.length} image(s) found without an alt attribute. Alt text is required for SEO and accessibility.`,
        file: filePath,
        fix: "Add descriptive alt attributes to all <img> tags. Use alt=\"\" for decorative images.",
      });
    } else if (lower.includes("<img")) {
      passedChecks.push(`All images have alt in ${filePath}`);
    }

    // Non-semantic HTML: detect div-soup patterns
    const divCount = (content.match(/<div/gi) ?? []).length;
    const semanticCount = (
      content.match(/<(main|section|article|nav|aside|header|footer|h[1-6])\b/gi) ?? []
    ).length;
    if (divCount > 10 && semanticCount === 0) {
      issues.push({
        severity: "medium",
        rule: "non-semantic-html",
        description: `File uses ${divCount} <div> elements with no semantic landmarks. Semantic HTML improves SEO signals.`,
        file: filePath,
        fix: "Replace generic <div> elements with semantic tags: <main>, <section>, <article>, <nav>, <header>, <footer>.",
      });
    } else if (semanticCount > 0) {
      passedChecks.push(`Semantic HTML used in ${filePath}`);
    }

    // Missing JSON-LD structured data
    const hasJsonLd =
      lower.includes("application/ld+json") || lower.includes("json-ld");
    if (hasJsonLd) {
      passedChecks.push(`JSON-LD structured data in ${filePath}`);
    } else if (filePath.includes("page") || filePath.includes("layout")) {
      issues.push({
        severity: "low",
        rule: "missing-json-ld",
        description: "No JSON-LD structured data found. Structured data can enable rich search results.",
        file: filePath,
        fix: 'Add a <script type="application/ld+json"> block with appropriate Schema.org markup.',
      });
    }
  }

  // Compute final score
  let score = 100;
  for (const issue of issues) {
    score = deduct(score, issue.severity);
  }
  score = Math.max(0, score);

  // Build recommendations targeted at the specific issues found
  const recommendations: string[] = [];
  const rulesSeen = new Set(issues.map((i) => i.rule));

  if (rulesSeen.has("missing-title") || rulesSeen.has("missing-nextjs-metadata")) {
    recommendations.push("Ensure all pages have unique, descriptive titles under 60 characters.");
  }
  if (rulesSeen.has("missing-meta-description")) {
    recommendations.push("Add a meta description (150–160 characters) summarising the page for search snippets.");
  }
  if (rulesSeen.has("missing-open-graph")) {
    recommendations.push("Add og:title, og:description, og:image, and og:url Open Graph tags to every shareable page.");
  }
  if (rulesSeen.has("missing-lang-attribute")) {
    recommendations.push('Set lang="en" (or the correct locale) on the root <html> element.');
  }
  if (rulesSeen.has("images-without-alt")) {
    recommendations.push("Add descriptive alt attributes to all meaningful images; use alt=\"\" for purely decorative ones.");
  }
  if (rulesSeen.has("missing-robots-txt")) {
    recommendations.push("Create a public/robots.txt file to guide search-engine crawlers.");
  }
  if (rulesSeen.has("missing-sitemap")) {
    recommendations.push("Add a sitemap (app/sitemap.ts or public/sitemap.xml) and submit it to Google Search Console.");
  }
  if (rulesSeen.has("missing-json-ld")) {
    recommendations.push('Add JSON-LD structured data (<script type="application/ld+json">) for richer search results.');
  }
  // Generic best-practice recommendations always included
  recommendations.push("Add a canonical URL tag to every page to prevent duplicate-content penalties.");
  recommendations.push("Use descriptive, keyword-rich URL slugs for all routes.");

  return { score, issues, recommendations, passedChecks };
}
