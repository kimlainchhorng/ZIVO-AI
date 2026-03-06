export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

interface A11yIssue {
  id: string;
  rule: string;
  severity: "error" | "warning" | "info";
  description: string;
  element: string;
  suggestion: string;
}

interface A11yResponse {
  issues: A11yIssue[];
  score: number;
  summary: string;
}

// Mock issues — representative of common accessibility violations for demo purposes.
const MOCK_ISSUES: A11yIssue[] = [
  {
    id: "a11y_001",
    rule: "img-alt",
    severity: "error",
    description: "Image elements must have an alt attribute.",
    element: '<img src="hero.png">',
    suggestion: 'Add a descriptive alt attribute: <img src="hero.png" alt="Hero image description">',
  },
  {
    id: "a11y_002",
    rule: "color-contrast",
    severity: "error",
    description: "Text has insufficient color contrast ratio (2.3:1, required 4.5:1).",
    element: '<p style="color:#aaa">Sample text</p>',
    suggestion: "Increase text color contrast to at least 4.5:1 for normal text.",
  },
  {
    id: "a11y_003",
    rule: "label",
    severity: "error",
    description: "Form input is missing an associated label.",
    element: '<input type="email" name="email">',
    suggestion:
      'Wrap with <label> or use aria-label: <input type="email" aria-label="Email address">',
  },
  {
    id: "a11y_004",
    rule: "button-name",
    severity: "warning",
    description: "Button does not have a discernible accessible name.",
    element: "<button><span class=\"icon-search\"></span></button>",
    suggestion: 'Add aria-label: <button aria-label="Search"><span class="icon-search"></span></button>',
  },
  {
    id: "a11y_005",
    rule: "heading-order",
    severity: "warning",
    description: "Heading levels are skipped (h1 followed by h4).",
    element: "<h4>Section Title</h4>",
    suggestion: "Maintain sequential heading order: h1 → h2 → h3 → h4.",
  },
  {
    id: "a11y_006",
    rule: "link-purpose",
    severity: "info",
    description: 'Link text "click here" does not describe the destination.',
    element: '<a href="/docs">click here</a>',
    suggestion: 'Use descriptive link text: <a href="/docs">View documentation</a>',
  },
];

function calculateScore(issues: A11yIssue[]): number {
  const deductions = issues.reduce((acc, issue) => {
    if (issue.severity === "error") return acc + 10;
    if (issue.severity === "warning") return acc + 5;
    return acc + 2;
  }, 0);
  return Math.max(0, 100 - deductions);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { html } = body as { html?: string };

    if (!html || html.trim() === "") {
      return NextResponse.json(
        { error: "Missing or empty required field: html" },
        { status: 400 }
      );
    }

    const score = calculateScore(MOCK_ISSUES);
    const errorCount = MOCK_ISSUES.filter((i) => i.severity === "error").length;
    const warningCount = MOCK_ISSUES.filter((i) => i.severity === "warning").length;
    const infoCount = MOCK_ISSUES.filter((i) => i.severity === "info").length;

    const summary = `Found ${MOCK_ISSUES.length} accessibility issues: ${errorCount} error(s), ${warningCount} warning(s), ${infoCount} info. Accessibility score: ${score}/100.`;

    const response: A11yResponse = {
      issues: MOCK_ISSUES,
      score,
      summary,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "Accessibility check failed" }, { status: 500 });
  }
}
