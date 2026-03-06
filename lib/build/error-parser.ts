export type ErrorSeverity = "error" | "warning";
export type ErrorSource = "typescript" | "eslint" | "import" | "runtime" | "schema";

export interface ParsedBuildError {
  file: string;
  line?: number;
  column?: number;
  message: string;
  rule?: string;
  source: ErrorSource;
  severity: ErrorSeverity;
  raw: string;
}

const TS_ERROR_PATTERN = /^(.+)\((\d+),(\d+)\):\s+(error|warning)\s+(TS\d+):\s+(.+)$/;
const ESLINT_PATTERN = /^(.+):\s+line (\d+),\s+col (\d+),\s+(Error|Warning)\s+-\s+(.+)$/;
const IMPORT_PATTERN = /Cannot find module '([^']+)'/;

export function parseBuildErrors(output: string): ParsedBuildError[] {
  const errors: ParsedBuildError[] = [];
  const lines = output.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // TypeScript errors
    const tsMatch = trimmed.match(TS_ERROR_PATTERN);
    if (tsMatch) {
      errors.push({
        file: tsMatch[1],
        line: parseInt(tsMatch[2]),
        column: parseInt(tsMatch[3]),
        severity: tsMatch[4] as ErrorSeverity,
        rule: tsMatch[5],
        message: tsMatch[6],
        source: "typescript",
        raw: line,
      });
      continue;
    }

    // ESLint errors
    const eslintMatch = trimmed.match(ESLINT_PATTERN);
    if (eslintMatch) {
      errors.push({
        file: eslintMatch[1],
        line: parseInt(eslintMatch[2]),
        column: parseInt(eslintMatch[3]),
        severity: eslintMatch[4].toLowerCase() as ErrorSeverity,
        message: eslintMatch[5],
        source: "eslint",
        raw: line,
      });
      continue;
    }

    // Missing import errors
    if (IMPORT_PATTERN.test(trimmed)) {
      errors.push({
        file: "unknown",
        message: trimmed,
        source: "import",
        severity: "error",
        raw: line,
      });
    }
  }

  return errors;
}

export function groupErrorsByFile(errors: ParsedBuildError[]): Map<string, ParsedBuildError[]> {
  const groups = new Map<string, ParsedBuildError[]>();
  for (const error of errors) {
    const existing = groups.get(error.file) ?? [];
    existing.push(error);
    groups.set(error.file, existing);
  }
  return groups;
}
