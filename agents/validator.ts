// agents/validator.ts — TypeScript + ESLint validator for generated code

export interface ValidationIssue {
  type: "error" | "warning";
  file: string;
  line?: number;
  column?: number;
  message: string;
  rule?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  summary: string;
}

/**
 * Validate generated TypeScript files by scanning for common issues without
 * requiring a full compiler toolchain at runtime.
 */
export function validateFiles(
  files: Array<{ path: string; content: string }>
): ValidationResult {
  const issues: ValidationIssue[] = [];

  // ── Project-level checks ────────────────────────────────────────────────

  const allPaths = files.map((f) => f.path);

  // Check for missing package.json in projects that have TS/JS files
  const hasTsJsFiles = allPaths.some((p) => p.match(/\.(ts|tsx|js|jsx)$/));
  const hasPackageJson = allPaths.some((p) => p === "package.json" || p.endsWith("/package.json"));
  if (hasTsJsFiles && !hasPackageJson) {
    issues.push({
      type: "error",
      file: "package.json",
      message: "Missing package.json — required for Node.js/Next.js projects",
      rule: "project/missing-package-json",
    });
  }

  // Check for missing Next.js App Router required files
  const hasNextJsFiles = allPaths.some(
    (p) => p.startsWith("app/") || p.includes("/app/")
  );
  if (hasNextJsFiles) {
    const hasLayout = allPaths.some((p) => p === "app/layout.tsx" || p === "app/layout.ts");
    if (!hasLayout) {
      issues.push({
        type: "error",
        file: "app/layout.tsx",
        message: "Missing app/layout.tsx — required root layout for Next.js App Router",
        rule: "nextjs/missing-root-layout",
      });
    }

    const hasPage = allPaths.some((p) => p === "app/page.tsx" || p === "app/page.ts");
    if (!hasPage) {
      issues.push({
        type: "warning",
        file: "app/page.tsx",
        message: "Missing app/page.tsx — root page is recommended for Next.js App Router",
        rule: "nextjs/missing-root-page",
      });
    }
  }

  // Check for Prisma schema without any API routes
  const hasPrismaSchema = allPaths.some((p) => p === "prisma/schema.prisma" || p.endsWith("/schema.prisma"));
  const hasApiRoutes = allPaths.some((p) => p.includes("/api/") || p.includes("api/"));
  if (hasPrismaSchema && !hasApiRoutes) {
    issues.push({
      type: "warning",
      file: "prisma/schema.prisma",
      message: "Prisma schema found but no API routes detected — add API routes to expose the database",
      rule: "project/prisma-without-api-routes",
    });
  }

  // ── Per-file checks ─────────────────────────────────────────────────────

  for (const file of files) {
    if (!file.path.match(/\.(ts|tsx)$/)) continue;
    const lines = file.content.split("\n");

    lines.forEach((line, idx) => {
      const lineNo = idx + 1;

      // Detect implicit any
      if (/:\s*any\b/.test(line) && !line.trim().startsWith("//")) {
        issues.push({
          type: "warning",
          file: file.path,
          line: lineNo,
          message: "Avoid using implicit `any` type",
          rule: "no-explicit-any",
        });
      }

      // Detect console.log in non-test files
      if (
        /console\.log\(/.test(line) &&
        !file.path.includes("__tests__") &&
        !file.path.includes(".spec.") &&
        !file.path.includes(".test.")
      ) {
        issues.push({
          type: "warning",
          file: file.path,
          line: lineNo,
          message: "Unexpected console.log statement",
          rule: "no-console",
        });
      }

      // Detect missing return type on exported functions
      if (
        /^export\s+(async\s+)?function\s+\w+\s*\(/.test(line.trim()) &&
        !line.includes(":")
      ) {
        issues.push({
          type: "warning",
          file: file.path,
          line: lineNo,
          message: "Missing return type annotation on exported function",
          rule: "explicit-function-return-type",
        });
      }

      // Detect TODO/FIXME comments
      if (/\/\/\s*(TODO|FIXME|HACK)\b/i.test(line)) {
        issues.push({
          type: "warning",
          file: file.path,
          line: lineNo,
          message: "Unresolved TODO/FIXME comment",
          rule: "no-warning-comments",
        });
      }

      // Detect useRouter from wrong import for Next.js App Router
      if (
        /from\s+['"]next\/router['"]/.test(line) &&
        (file.path.startsWith("app/") || file.path.includes("/app/"))
      ) {
        issues.push({
          type: "error",
          file: file.path,
          line: lineNo,
          message:
            "In Next.js App Router, use `next/navigation` instead of `next/router` for useRouter/usePathname/useSearchParams",
          rule: "nextjs/wrong-router-import",
        });
      }
    });

    // Detect missing imports for commonly used identifiers
    if (
      file.content.includes("NextResponse") &&
      !file.content.includes("from \"next/server\"") &&
      !file.content.includes("from 'next/server'")
    ) {
      issues.push({
        type: "error",
        file: file.path,
        message: "Missing import: NextResponse from 'next/server'",
        rule: "import/no-unresolved",
      });
    }

    if (
      (file.content.includes("useState") || file.content.includes("useEffect")) &&
      !file.content.includes("from \"react\"") &&
      !file.content.includes("from 'react'")
    ) {
      issues.push({
        type: "error",
        file: file.path,
        message: "Missing import: React hooks from 'react'",
        rule: "import/no-unresolved",
      });
    }

    // Detect Supabase client usage without env variable checks
    if (
      (file.content.includes("createClient") || file.content.includes("supabase")) &&
      (file.content.includes("SUPABASE_URL") || file.content.includes("SUPABASE_ANON_KEY"))
    ) {
      const hasEnvAccess =
        file.content.includes("process.env") || file.content.includes("import.meta.env");
      const hasHardcodedValue =
        /SUPABASE_(URL|ANON_KEY)\s*[:=]\s*['"`][^$]/.test(file.content);
      if (!hasEnvAccess || hasHardcodedValue) {
        issues.push({
          type: "warning",
          file: file.path,
          message: "Supabase client may be using hardcoded credentials — use environment variables via process.env",
          rule: "security/no-hardcoded-credentials",
        });
      }
    }
  }

  const errors = issues.filter((i) => i.type === "error");
  const valid = errors.length === 0;

  return {
    valid,
    issues,
    summary: valid
      ? `Validation passed with ${issues.length} warning(s)`
      : `Validation failed: ${errors.length} error(s), ${issues.length - errors.length} warning(s)`,
  };
}
