// Performance analysis engine — static checks on generated file content and package.json.

export interface GeneratedFile {
  path: string;
  content: string;
  action?: string;
}

export type PerfSeverity = "critical" | "high" | "medium" | "low";

export interface PerfIssue {
  rule: string;
  severity: PerfSeverity;
  description: string;
  file?: string;
  fix: string;
}

export interface PerfMetrics {
  estimatedBundleSize: number;
  imageCount: number;
  externalDependencies: number;
  synchronousImports: number;
  dynamicImports: number;
}

export interface PerformanceReport {
  score: number;
  issues: PerfIssue[];
  metrics: PerfMetrics;
  recommendations: string[];
}

const SEVERITY_DEDUCTIONS: Record<PerfSeverity, number> = {
  critical: 20,
  high: 15,
  medium: 10,
  low: 5,
};

function deduct(score: number, severity: PerfSeverity): number {
  return Math.max(0, score - SEVERITY_DEDUCTIONS[severity]);
}

function isComponentFile(file: GeneratedFile): boolean {
  return (
    file.path.endsWith(".tsx") ||
    file.path.endsWith(".jsx") ||
    file.path.endsWith(".ts") ||
    file.path.endsWith(".js")
  );
}

function _countDependencies(packageJsonStr: string): number {
  try {
    const pkg = JSON.parse(packageJsonStr) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const deps = Object.keys(pkg.dependencies ?? {}).length;
    return deps;
  } catch {
    return 0;
  }
}

function _estimateBundleSize(files: GeneratedFile[]): number {
  // Rough estimate: sum of file content lengths in bytes as a proxy
  return files.reduce((total, f) => total + Buffer.byteLength(f.content, "utf8"), 0);
}

export function analyzePerformance(
  files: GeneratedFile[],
  packageJson?: string
): PerformanceReport {
  const issues: PerfIssue[] = [];

  const componentFiles = files.filter(isComponentFile);

  let totalSyncImports = 0;
  let totalDynamicImports = 0;
  let totalImages = 0;

  for (const file of componentFiles) {
    const { content, path: filePath } = file;

    // Missing next/image — using raw <img> for non-icon content
    const rawImgMatches = Array.from(content.matchAll(/<img\b[^>]*src\s*=/gi));
    const usesNextImage =
      content.includes("next/image") || content.includes("from 'next/image'");
    if (rawImgMatches.length > 0 && !usesNextImage) {
      totalImages += rawImgMatches.length;
      issues.push({
        rule: "use-next-image",
        severity: "high",
        description: `${rawImgMatches.length} raw <img> tag(s) detected. next/image provides automatic optimization, lazy loading, and WebP conversion.`,
        file: filePath,
        fix: "Replace <img> with the Next.js <Image> component from 'next/image'.",
      });
    } else if (usesNextImage) {
      totalImages += (content.match(/\bImage\b/g) ?? []).length;
    }

    // Missing lazy loading on native img tags
    const imgWithoutLazy = Array.from(
      content.matchAll(/<img(?![^>]*loading\s*=)[^>]*>/gi)
    );
    if (imgWithoutLazy.length > 0 && !usesNextImage) {
      issues.push({
        rule: "missing-lazy-loading",
        severity: "medium",
        description: `${imgWithoutLazy.length} image(s) without loading="lazy". Eager-loading off-screen images delays page render.`,
        file: filePath,
        fix: 'Add loading="lazy" to all <img> elements that are not above the fold.',
      });
    }

    // Missing dynamic() for heavy components
    const heavyLibImports = Array.from(
      content.matchAll(
        /import\s+.*\s+from\s+['"](?:chart\.js|recharts|@tiptap|@monaco-editor|react-pdf|@react-three|three|framer-motion)['"]/gi
      )
    );
    const usesDynamic =
      content.includes("dynamic(") || content.includes("next/dynamic");
    if (heavyLibImports.length > 0 && !usesDynamic) {
      const joinedNames = heavyLibImports.map((m) => m[0]).join(", ");
      const truncated = joinedNames.length > 80 ? `${joinedNames.slice(0, 80)}…` : joinedNames;
      issues.push({
        rule: "missing-dynamic-import",
        severity: "high",
        description: `Heavy library (${truncated}) imported statically. This increases the initial bundle size.`,
        file: filePath,
        fix: "Use Next.js dynamic() with ssr: false for heavy client-side libraries.",
      });
    }

    // Count dynamic imports
    totalDynamicImports += (content.match(/\bdynamic\s*\(/g) ?? []).length;

    // Large inline SVGs (> 2 KB of SVG content)
    const svgMatches = Array.from(content.matchAll(/<svg[\s\S]*?<\/svg>/gi));
    for (const svgMatch of svgMatches) {
      if (svgMatch[0].length > 2048) {
        issues.push({
          rule: "large-inline-svg",
          severity: "medium",
          description: `Inline SVG is ${Math.round(svgMatch[0].length / 1024)}KB. Large inline SVGs inflate HTML/JS bundle size.`,
          file: filePath,
          fix: "Extract large SVGs to separate .svg files and import them, or use next/image with an SVG src.",
        });
      }
    }

    // Synchronous fetch in component body (outside useEffect / server action)
    const syncFetchMatches = Array.from(
      content.matchAll(/(?<!async\s+function\s+\w+[^}]*|await\s)fetch\s*\(/gi)
    );
    const awaitedFetches = (content.match(/await\s+fetch\s*\(/g) ?? []).length;
    const allFetches = (content.match(/\bfetch\s*\(/g) ?? []).length;
    const unsafeFetches = allFetches - awaitedFetches;

    if (unsafeFetches > 0 && syncFetchMatches.length > 0) {
      totalSyncImports += unsafeFetches;
      issues.push({
        rule: "synchronous-fetch",
        severity: "high",
        description: `Potentially synchronous fetch() call(s) detected in component. This can block rendering.`,
        file: filePath,
        fix: "Wrap fetch() calls in useEffect with async handlers, or use a data-fetching library like SWR/React Query.",
      });
    }

    // Count synchronous static imports (non-dynamic)
    const staticImportCount = (content.match(/^import\s+/gm) ?? []).length;
    totalSyncImports += staticImportCount;
  }

  // Parse packageJson to count external dependencies
  const externalDependencies = packageJson ? _countDependencies(packageJson) : 0;

  if (externalDependencies > 50) {
    issues.push({
      rule: "too-many-dependencies",
      severity: "medium",
      description: `${externalDependencies} production dependencies detected. Large dependency trees increase bundle size and attack surface.`,
      fix: "Audit dependencies with `npm ls --depth=0` and remove unused packages. Prefer smaller, focused libraries.",
    });
  }

  const estimatedBundleSize = _estimateBundleSize(componentFiles);

  // Flag very large files as split candidates
  for (const file of componentFiles) {
    if (file.content.length > 15000) {
      issues.push({
        rule: "large-file",
        severity: "low",
        description: `File is ${Math.round(file.content.length / 1024)}KB — large files hurt code-splitting granularity.`,
        file: file.path,
        fix: "Split this file into smaller modules to improve tree-shaking and code-splitting.",
      });
    }
  }

  // Compute score
  let score = 100;
  for (const issue of issues) {
    score = deduct(score, issue.severity);
  }
  score = Math.max(0, score);

  const metrics: PerfMetrics = {
    estimatedBundleSize,
    imageCount: totalImages,
    externalDependencies,
    synchronousImports: totalSyncImports,
    dynamicImports: totalDynamicImports,
  };

  const recommendations: string[] = [
    "Use next/image for all images to get automatic WebP conversion and lazy loading.",
    "Leverage Next.js dynamic() imports for heavy client-side components.",
    "Enable React Server Components to move rendering to the server and reduce client JS.",
    "Use SWR or React Query for data fetching to benefit from caching and deduplication.",
    "Run `next build` and inspect the bundle analyzer output to identify large chunks.",
  ];

  return { score, issues, metrics, recommendations };
}
