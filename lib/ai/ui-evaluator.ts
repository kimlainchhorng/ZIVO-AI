// lib/ai/ui-evaluator.ts — Multi-pass UI quality evaluator

import type { GeneratedFile } from './schema';
import type { WebsitePlan } from './website-plan';
import type { MobilePlan } from './mobile-plan';
import { validateColorUsage, DESIGN_TOKENS } from '../design/tokens';

export type IssueType =
  | 'spacing'
  | 'typography'
  | 'contrast'
  | 'layout'
  | 'copy'
  | 'navigation'
  | 'states';

export interface Issue {
  type: IssueType;
  file?: string;
  suggestion: string;
}

export interface EvaluationResult {
  score: number;
  issues: Issue[];
  passedChecks: string[];
}

// ─── Heuristic rules ──────────────────────────────────────────────────────────

function checkSpacing(content: string, filePath: string): Issue[] {
  const issues: Issue[] = [];

  // Warn if inline margin/padding values are large magic numbers
  const inlineSpacingPattern = /(margin|padding)\s*:\s*["']?\d{3,}px/gi;
  if (inlineSpacingPattern.test(content)) {
    issues.push({
      type: 'spacing',
      file: filePath,
      suggestion: `${filePath}: Consider using design token spacing values instead of large pixel values.`,
    });
  }

  return issues;
}

function checkTypography(content: string, filePath: string): Issue[] {
  const issues: Issue[] = [];

  // Warn if font sizes below 12px
  const tinyFontPattern = /fontSize\s*:\s*["']?(0\.[0-4]\d*rem|[1-9]px|1[01]px)/gi;
  if (tinyFontPattern.test(content)) {
    issues.push({
      type: 'typography',
      file: filePath,
      suggestion: `${filePath}: Font size too small — may harm readability. Use at least 12px (0.75rem).`,
    });
  }

  return issues;
}

function checkContrast(content: string, filePath: string): Issue[] {
  const issues: Issue[] = [];

  // Warn on non-token color usage
  const colorWarnings = validateColorUsage(content, filePath, DESIGN_TOKENS);
  for (const warning of colorWarnings) {
    issues.push({ type: 'contrast', file: filePath, suggestion: warning });
  }

  return issues;
}

function checkLayout(content: string, filePath: string): Issue[] {
  const issues: Issue[] = [];

  // Check that page files include Header and Footer
  if (filePath.startsWith('app/') && filePath.endsWith('page.tsx')) {
    if (!content.includes('Header') && !content.includes('header')) {
      issues.push({
        type: 'layout',
        file: filePath,
        suggestion: `${filePath}: Page component may be missing a Header.`,
      });
    }
    if (!content.includes('Footer') && !content.includes('footer')) {
      issues.push({
        type: 'layout',
        file: filePath,
        suggestion: `${filePath}: Page component may be missing a Footer.`,
      });
    }
  }

  return issues;
}

function checkNavigation(content: string, filePath: string): Issue[] {
  const issues: Issue[] = [];

  // Navigation file should have accessible aria roles
  if (filePath.includes('navigation') || filePath.includes('nav') || filePath.includes('Header')) {
    if (!content.includes('aria-label') && !content.includes('role=')) {
      issues.push({
        type: 'navigation',
        file: filePath,
        suggestion: `${filePath}: Navigation component should include ARIA roles/labels for accessibility.`,
      });
    }
  }

  return issues;
}

function checkStates(content: string, filePath: string): Issue[] {
  const issues: Issue[] = [];

  // Screen/page files should handle loading state
  if (filePath.includes('mobile/app/') && filePath.endsWith('.tsx')) {
    const hasLoadingState = /loading|isLoading|skeleton|spinner/i.test(content);
    const hasEmptyState = /empty|isEmpty|no.*(items|data|results)/i.test(content);
    if (!hasLoadingState) {
      issues.push({
        type: 'states',
        file: filePath,
        suggestion: `${filePath}: Mobile screen should handle loading state.`,
      });
    }
    if (!hasEmptyState) {
      issues.push({
        type: 'states',
        file: filePath,
        suggestion: `${filePath}: Mobile screen should handle empty state.`,
      });
    }
  }

  return issues;
}

function checkCopy(content: string, filePath: string): Issue[] {
  const issues: Issue[] = [];

  // Warn on placeholder text that wasn't filled in
  const loremPattern = /lorem ipsum/i;
  if (loremPattern.test(content)) {
    issues.push({
      type: 'copy',
      file: filePath,
      suggestion: `${filePath}: Contains placeholder "Lorem ipsum" text — replace with real copy.`,
    });
  }

  // Warn on TODO comments in generated code
  if (/\/\/\s*TODO/i.test(content)) {
    issues.push({
      type: 'copy',
      file: filePath,
      suggestion: `${filePath}: Contains TODO comments that should be resolved.`,
    });
  }

  return issues;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function computeScore(files: GeneratedFile[], issues: Issue[]): number {
  if (files.length === 0) return 0;

  let score = 100;

  // Deduct per issue by severity
  const deductions: Record<IssueType, number> = {
    contrast: 3,
    layout: 5,
    navigation: 4,
    states: 3,
    spacing: 1,
    typography: 2,
    copy: 2,
  };

  for (const issue of issues) {
    score -= deductions[issue.type] ?? 2;
  }

  // Bonus checks
  const passedChecks: string[] = [];

  const hasTokenFile = files.some(
    (f) => f.path.includes('tokens') || f.path.includes('globals.css')
  );
  if (hasTokenFile) {
    score += 5;
    passedChecks.push('Design tokens file present');
  }

  const hasAssetsFile = files.some((f) => f.path.includes('assets'));
  if (hasAssetsFile) {
    score += 3;
    passedChecks.push('Assets file present');
  }

  const hasLegalPages = ['/terms/', '/privacy/', '/cookies/'].some((legal) =>
    files.some((f) => f.path.includes(legal))
  );
  if (hasLegalPages) {
    score += 5;
    passedChecks.push('Legal pages included');
  }

  return Math.max(0, Math.min(100, score));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Run heuristic UI quality evaluation on website files.
 * The `plan` parameter is reserved for future LLM-based deep evaluation
 * that will cross-reference generated content against the original plan spec.
 */
export function evaluateWebsiteUI(
  files: GeneratedFile[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _plan: WebsitePlan
): EvaluationResult {
  const allIssues: Issue[] = [];
  const passedChecks: string[] = [];

  for (const file of files) {
    if (!file.content) continue;
    allIssues.push(
      ...checkSpacing(file.content, file.path),
      ...checkTypography(file.content, file.path),
      ...checkContrast(file.content, file.path),
      ...checkLayout(file.content, file.path),
      ...checkNavigation(file.content, file.path),
      ...checkCopy(file.content, file.path)
    );
  }

  const hasAllCorePages = ['app/page.tsx', 'app/about/page.tsx', 'app/contact/page.tsx'].every(
    (p) => files.some((f) => f.path === p)
  );
  if (hasAllCorePages) passedChecks.push('Core pages (/, /about, /contact) present');

  const hasHeaderFooter =
    files.some((f) => f.path.includes('Header')) &&
    files.some((f) => f.path.includes('Footer'));
  if (hasHeaderFooter) passedChecks.push('Header and Footer components present');

  const score = computeScore(files, allIssues);

  return { score, issues: allIssues, passedChecks };
}

/** Run heuristic UI quality evaluation on mobile files.
 * The `plan` parameter is reserved for future LLM-based deep evaluation
 * that will verify screen states and navigation against the original plan spec.
 */
export function evaluateMobileUI(
  files: GeneratedFile[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _plan: MobilePlan
): EvaluationResult {
  const allIssues: Issue[] = [];
  const passedChecks: string[] = [];

  for (const file of files) {
    if (!file.content) continue;
    allIssues.push(
      ...checkSpacing(file.content, file.path),
      ...checkTypography(file.content, file.path),
      ...checkContrast(file.content, file.path),
      ...checkNavigation(file.content, file.path),
      ...checkStates(file.content, file.path),
      ...checkCopy(file.content, file.path)
    );
  }

  const hasLayout = files.some((f) => f.path === 'mobile/app/_layout.tsx');
  if (hasLayout) passedChecks.push('Root Expo Router layout present');

  const hasTheme = files.some((f) => f.path.includes('mobile/theme/tokens'));
  if (hasTheme) passedChecks.push('Mobile theme tokens present');

  const hasMockData = files.some((f) => f.path.includes('mock-data'));
  if (hasMockData) passedChecks.push('Mock data file present');

  const score = computeScore(files, allIssues);

  return { score, issues: allIssues, passedChecks };
}
