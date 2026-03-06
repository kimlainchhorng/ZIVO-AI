// Accessibility (a11y) static analysis engine — WCAG-aligned checks on generated file content.

export interface GeneratedFile {
  path: string;
  content: string;
  action?: string;
}

export type A11ySeverity = "critical" | "serious" | "moderate" | "minor";

export interface A11yViolation {
  id: string;
  wcagCriteria: string;
  severity: A11ySeverity;
  description: string;
  file?: string;
  element?: string;
  fix: string;
}

export interface A11yWarning {
  id: string;
  description: string;
  file?: string;
}

export interface AccessibilityReport {
  score: number;
  violations: A11yViolation[];
  warnings: A11yWarning[];
  passedChecks: string[];
}

const SEVERITY_DEDUCTIONS: Record<A11ySeverity, number> = {
  critical: 20,
  serious: 15,
  moderate: 10,
  minor: 5,
};

function deduct(score: number, severity: A11ySeverity): number {
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

export function scanAccessibility(files: GeneratedFile[]): AccessibilityReport {
  const violations: A11yViolation[] = [];
  const warnings: A11yWarning[] = [];
  const passedChecks: string[] = [];

  const htmlFiles = files.filter(isHtmlFile);
  const allContents = files.map((f) => f.content).join("\n");

  // Check for skip navigation link (site-wide, typically in layout)
  const hasSkipLink =
    allContents.includes("skip") &&
    (allContents.includes("#main") || allContents.includes("#content"));
  if (hasSkipLink) {
    passedChecks.push("Skip navigation link present");
  } else {
    violations.push({
      id: "skip-link",
      wcagCriteria: "WCAG 2.4.1 (A)",
      severity: "serious",
      description:
        "No skip navigation link found. Keyboard users cannot bypass repetitive navigation.",
      fix: 'Add a "Skip to main content" link as the first focusable element on pages: <a href="#main-content" class="sr-only focus:not-sr-only">Skip to main content</a>.',
    });
  }

  for (const file of htmlFiles) {
    const { content, path: filePath } = file;
    const lower = content.toLowerCase();

    // Missing lang attribute
    const hasLang =
      lower.includes("<html lang") ||
      lower.includes("lang={") ||
      (filePath.includes("layout") && lower.includes("lang"));
    if (hasLang) {
      passedChecks.push(`lang attribute present in ${filePath}`);
    } else if (filePath.includes("layout") || lower.includes("<html")) {
      violations.push({
        id: "html-lang",
        wcagCriteria: "WCAG 3.1.1 (A)",
        severity: "critical",
        description:
          "The <html> element is missing a lang attribute. Screen readers need this to use the correct language profile.",
        file: filePath,
        element: "<html>",
        fix: 'Add `lang="en"` (or the appropriate language code) to the <html> element.',
      });
    }

    // Images without alt
    const imgWithoutAlt = Array.from(content.matchAll(/<img(?![^>]*\balt\s*=)[^>]*>/gi));
    if (imgWithoutAlt.length > 0) {
      violations.push({
        id: "image-alt",
        wcagCriteria: "WCAG 1.1.1 (A)",
        severity: "critical",
        description: `${imgWithoutAlt.length} image(s) are missing alt attributes. Screen readers cannot convey image content to blind users.`,
        file: filePath,
        element: "<img>",
        fix: 'Add a descriptive alt attribute to all meaningful images. Use alt="" for purely decorative images.',
      });
    } else if (lower.includes("<img")) {
      passedChecks.push(`All <img> elements have alt in ${filePath}`);
    }

    // Buttons without accessible text
    const emptyButtons = Array.from(
      content.matchAll(/<button(?![^>]*aria-label)[^>]*>\s*<\/button>/gi)
    );
    const iconOnlyButtons = Array.from(
      content.matchAll(/<button(?![^>]*aria-label)[^>]*>\s*<(?:svg|img)[^>]*>\s*<\/button>/gi)
    );
    if (emptyButtons.length > 0 || iconOnlyButtons.length > 0) {
      violations.push({
        id: "button-name",
        wcagCriteria: "WCAG 4.1.2 (A)",
        severity: "critical",
        description:
          "One or more buttons have no accessible name. Screen reader users cannot determine the button's purpose.",
        file: filePath,
        element: "<button>",
        fix: "Add visible text content or an aria-label attribute to all buttons.",
      });
    } else if (lower.includes("<button")) {
      passedChecks.push(`Buttons have accessible names in ${filePath}`);
    }

    // Form inputs without labels
    const inputMatches = Array.from(
      content.matchAll(/<input(?![^>]*(?:type\s*=\s*["']hidden["']|aria-label))[^>]*>/gi)
    );
    const labelMatches = Array.from(content.matchAll(/<label[^>]*>/gi));
    const inputCount = inputMatches.length;
    const labelCount = labelMatches.length;

    if (inputCount > 0 && labelCount < inputCount) {
      violations.push({
        id: "label",
        wcagCriteria: "WCAG 1.3.1 (A)",
        severity: "serious",
        description: `${inputCount} form input(s) found but only ${labelCount} <label> element(s). Inputs without labels are not accessible.`,
        file: filePath,
        element: "<input>",
        fix: "Associate every form input with a <label> using htmlFor/id, or add aria-label/aria-labelledby.",
      });
    } else if (inputCount > 0) {
      passedChecks.push(`Form inputs have labels in ${filePath}`);
    }

    // Missing aria-label on interactive elements with icons
    // Detect icon-only interactive elements: <a> or <button> containing only <svg> or <i> without an aria-label
    const interactiveWithoutLabel = Array.from(
      content.matchAll(/<(a|button)[^>]*>\s*<(?:svg|i\s)[^>]*>[\s\S]*?<\/\1>/gi)
    ).filter((m) => !m[0].includes("aria-label") && !m[0].includes("aria-labelledby"));
    if (interactiveWithoutLabel.length > 0) {
      warnings.push({
        id: "interactive-aria-label",
        description: `${interactiveWithoutLabel.length} icon-only interactive element(s) in ${filePath} may lack an accessible label.`,
        file: filePath,
      });
    }

    // Heading hierarchy — detect skipped heading levels
    const headingLevels = Array.from(content.matchAll(/<h([1-6])\b/gi)).map((m) =>
      parseInt(m[1], 10)
    );
    if (headingLevels.length > 1) {
      let hierarchyOk = true;
      for (let i = 1; i < headingLevels.length; i++) {
        const prev = headingLevels[i - 1] ?? 0;
        const curr = headingLevels[i] ?? 0;
        if (curr - prev > 1) {
          hierarchyOk = false;
          break;
        }
      }
      if (!hierarchyOk) {
        violations.push({
          id: "heading-order",
          wcagCriteria: "WCAG 1.3.1 (A)",
          severity: "moderate",
          description:
            "Heading levels are not sequential (e.g., jumping from h2 to h4). This confuses screen reader navigation.",
          file: filePath,
          element: "<h1>–<h6>",
          fix: "Ensure headings follow a logical hierarchy without skipping levels.",
        });
      } else {
        passedChecks.push(`Heading hierarchy is sequential in ${filePath}`);
      }
    }
  }

  // Compute score
  let score = 100;
  for (const violation of violations) {
    score = deduct(score, violation.severity);
  }
  score = Math.max(0, score);

  return { score, violations, warnings, passedChecks };
}
