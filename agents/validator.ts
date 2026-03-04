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
