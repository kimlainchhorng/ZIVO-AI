import { NextResponse } from "next/server";

interface ScanIssue {
  type: "error" | "warning" | "info";
  category: "syntax" | "security" | "performance" | "accessibility" | "seo";
  line?: number;
  message: string;
  suggestion: string;
}

function scanHTML(code: string): ScanIssue[] {
  const issues: ScanIssue[] = [];
  const lines = code.split("\n");

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // Check for inline scripts (security)
    if (/<script[^>]*>[^<]+<\/script>/i.test(line) || /onclick\s*=/i.test(line) || /onload\s*=/i.test(line)) {
      issues.push({ type: "warning", category: "security", line: lineNum, message: "Inline JavaScript detected", suggestion: "Move JavaScript to external files and use event listeners instead of inline handlers" });
    }

    // Check for missing alt on images
    if (/<img(?![^>]*\balt\s*=)[^>]*>/i.test(line)) {
      issues.push({ type: "error", category: "accessibility", line: lineNum, message: "Image missing alt attribute", suggestion: "Add descriptive alt text to the <img> tag for accessibility" });
    }

    // Check for potential XSS with innerHTML
    if (/innerHTML\s*=/.test(line)) {
      issues.push({ type: "warning", category: "security", line: lineNum, message: "Direct innerHTML assignment detected", suggestion: "Use textContent or sanitize HTML before inserting into innerHTML to prevent XSS" });
    }

    // Check for document.write
    if (/document\.write\s*\(/.test(line)) {
      issues.push({ type: "error", category: "performance", line: lineNum, message: "document.write() usage detected", suggestion: "Replace document.write() with DOM manipulation methods like appendChild() for better performance" });
    }

    // Check for missing HTTPS in links/src
    if (/\bhttp:\/\/(?!localhost)/i.test(line)) {
      issues.push({ type: "warning", category: "security", line: lineNum, message: "Non-HTTPS URL detected", suggestion: "Use HTTPS URLs to ensure secure connections" });
    }

    // Check for missing meta viewport
    if (idx < 20 && /<head>/i.test(line)) {
      const headSection = lines.slice(idx, Math.min(idx + 10, lines.length)).join("\n");
      if (!/meta[^>]+viewport/i.test(headSection)) {
        issues.push({ type: "warning", category: "seo", line: lineNum, message: "Missing meta viewport tag", suggestion: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> for mobile responsiveness' });
      }
    }
  });

  return issues;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { code, language = "html" } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const issues = scanHTML(code);
    const errorCount = issues.filter(i => i.type === "error").length;
    const warningCount = issues.filter(i => i.type === "warning").length;

    return NextResponse.json({
      ok: true,
      language,
      summary: { total: issues.length, errors: errorCount, warnings: warningCount, infos: issues.filter(i => i.type === "info").length },
      issues,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Scan failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
