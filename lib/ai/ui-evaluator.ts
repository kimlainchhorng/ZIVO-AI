// lib/ai/ui-evaluator.ts — Heuristic UI quality evaluator for generated code
// Returns a numeric score (0-100) and a list of actionable issues.

export type IssueType =
  | "inline-layout-style"
  | "hardcoded-color"
  | "emoji-in-icon"
  | "missing-alt"
  | "missing-aria"
  | "no-loading-state"
  | "no-empty-state"
  | "no-error-state"
  | "large-component"
  | "generic-text";

export interface UIIssue {
  type: IssueType;
  file?: string;
  line?: number;
  suggestion: string;
}

export interface UIEvalResult {
  score: number;
  issues: UIIssue[];
}

// Regex patterns for heuristic detection
const INLINE_LAYOUT_STYLE_RE =
  /style=\{[^}]*\b(display|flex|grid|position|margin|padding|width|height|gap|align-items|justify-content)\b/;
const HARDCODED_HEX_RE = /#([0-9a-fA-F]{3,8})\b/g;
const EMOJI_IN_PROP_RE = /(?:icon|label|title|nav)\s*[:=]\s*["'`][^"'`]*[\u{1F300}-\u{1FAFF}]|[\u{1F300}-\u{1FAFF}][^"'`]*["'`]/u;
const MISSING_ALT_RE = /<img(?![^>]*\balt=)[^>]*>/;
const NO_LOADING_RE_FILE = /loading|isLoading|isFetching|skeleton/i;
const NO_EMPTY_RE_FILE = /empty|noData|isEmpty|no.items/i;
const NO_ERROR_RE_FILE = /error|isError|hasError|catch/i;
const GENERIC_TEXT_RE = /["'`](Lorem ipsum|placeholder text|your text here|TODO|FIXME|TBD)["'`]/i;

interface FileEntry {
  path: string;
  content: string;
}

/**
 * Evaluate an array of generated files heuristically.
 * Returns a score between 0–100 and a list of issues.
 */
export function evaluateUI(files: FileEntry[]): UIEvalResult {
  const issues: UIIssue[] = [];

  // Track which screen-like files have state coverage
  const screenFiles = files.filter(
    (f) => /\.(tsx|jsx)$/.test(f.path) && /screen|page|view/i.test(f.path)
  );

  for (const file of files) {
    if (!/\.(tsx|jsx|ts|js)$/.test(file.path)) continue;
    const lines = file.content.split("\n");

    lines.forEach((line, idx) => {
      // Inline layout styles
      if (INLINE_LAYOUT_STYLE_RE.test(line)) {
        issues.push({
          type: "inline-layout-style",
          file: file.path,
          line: idx + 1,
          suggestion: "Replace inline layout style with a Tailwind class or design token.",
        });
      }

      // Hardcoded hex colors
      const hexMatches = [...line.matchAll(HARDCODED_HEX_RE)];
      for (const match of hexMatches) {
        // Allow hex in token/config files
        if (/tokens|design-system|tailwind|globals|theme/i.test(file.path)) continue;
        issues.push({
          type: "hardcoded-color",
          file: file.path,
          line: idx + 1,
          suggestion: `Replace hardcoded color "${match[0]}" with a design token from lib/design/tokens.ts.`,
        });
      }

      // Emoji in icon/label/title/nav props
      if (EMOJI_IN_PROP_RE.test(line)) {
        issues.push({
          type: "emoji-in-icon",
          file: file.path,
          line: idx + 1,
          suggestion: "Replace emoji with <Icon name=\"...\" /> from components/icons/Icon.tsx.",
        });
      }

      // Missing alt on img tags
      if (MISSING_ALT_RE.test(line)) {
        issues.push({
          type: "missing-alt",
          file: file.path,
          line: idx + 1,
          suggestion: 'Add descriptive alt text to the <img> element.',
        });
      }

      // Generic placeholder text
      if (GENERIC_TEXT_RE.test(line)) {
        issues.push({
          type: "generic-text",
          file: file.path,
          line: idx + 1,
          suggestion: "Replace placeholder text with realistic, believable copy.",
        });
      }
    });

    // Screen-level state checks (per file)
    if (/screen|page|view/i.test(file.path) && /\.(tsx|jsx)$/.test(file.path)) {
      if (!NO_LOADING_RE_FILE.test(file.content)) {
        issues.push({
          type: "no-loading-state",
          file: file.path,
          suggestion: "Add a loading skeleton or spinner state for async data.",
        });
      }
      if (!NO_EMPTY_RE_FILE.test(file.content)) {
        issues.push({
          type: "no-empty-state",
          file: file.path,
          suggestion: "Add an empty-state illustration/message when there is no data.",
        });
      }
      if (!NO_ERROR_RE_FILE.test(file.content)) {
        issues.push({
          type: "no-error-state",
          file: file.path,
          suggestion: "Add error handling and an error-state UI.",
        });
      }
    }

    // Large component warning
    if (/\.(tsx|jsx)$/.test(file.path) && file.content.split("\n").length > 300) {
      issues.push({
        type: "large-component",
        file: file.path,
        suggestion: "This component is large (>300 lines). Consider splitting into smaller sub-components.",
      });
    }
  }

  // Deduplicate: collapse repeated inline-style and hardcoded-color per file (keep first 3)
  const dedupedIssues = deduplicateIssues(issues);

  // Score calculation: start at 100, deduct per issue type
  const DEDUCTIONS: Record<IssueType, number> = {
    "inline-layout-style": 1,
    "hardcoded-color": 1.5,
    "emoji-in-icon": 3,
    "missing-alt": 2,
    "missing-aria": 1,
    "no-loading-state": 4,
    "no-empty-state": 3,
    "no-error-state": 3,
    "large-component": 2,
    "generic-text": 2,
  };

  const totalDeduction = dedupedIssues.reduce((sum, issue) => sum + (DEDUCTIONS[issue.type] ?? 1), 0);
  const score = Math.max(0, Math.min(100, Math.round(100 - totalDeduction)));

  // Bonus: more screen coverage => higher score
  const stateBonus = screenFiles.length > 0 ? Math.min(10, screenFiles.length * 2) : 0;

  return { score: Math.min(100, score + stateBonus), issues: dedupedIssues };
}

function deduplicateIssues(issues: UIIssue[]): UIIssue[] {
  const countByType: Partial<Record<IssueType, number>> = {};
  const MAX_PER_TYPE = 5;
  const result: UIIssue[] = [];
  for (const issue of issues) {
    const count = countByType[issue.type] ?? 0;
    if (count < MAX_PER_TYPE) {
      result.push(issue);
      countByType[issue.type] = count + 1;
    }
  }
  return result;
}
