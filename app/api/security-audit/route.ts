import { NextResponse } from "next/server";

interface SecurityFinding {
  severity: "critical" | "high" | "medium" | "low" | "info";
  type: string;
  description: string;
  line?: number;
  recommendation: string;
}

function auditCode(code: string): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  const lines = code.split("\n");

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // SQL Injection patterns
    if (/\$_(GET|POST|REQUEST|COOKIE)\[/.test(line) && /SELECT|INSERT|UPDATE|DELETE/i.test(line)) {
      findings.push({ severity: "critical", type: "SQL Injection", description: "Potential SQL injection vulnerability detected", line: lineNum, recommendation: "Use parameterized queries or prepared statements" });
    }

    // XSS patterns
    if (/document\.write\(.*\$_(GET|POST)/i.test(line) || /innerHTML\s*=.*location/i.test(line)) {
      findings.push({ severity: "high", type: "XSS (Cross-Site Scripting)", description: "Potential XSS vulnerability: user input rendered without sanitization", line: lineNum, recommendation: "Sanitize all user input before rendering, use Content Security Policy" });
    }

    // Hardcoded credentials
    if (/(password|passwd|secret|api_key|apikey|token)\s*[=:]\s*["'][^"']{4,}/i.test(line) && !/placeholder|example|your_|REPLACE/i.test(line)) {
      findings.push({ severity: "critical", type: "Hardcoded Credentials", description: "Potential hardcoded secret or credential detected", line: lineNum, recommendation: "Use environment variables or a secrets manager instead of hardcoding credentials" });
    }

    // eval() usage
    if (/\beval\s*\(/.test(line)) {
      findings.push({ severity: "high", type: "Code Injection", description: "eval() usage detected - can execute arbitrary code", line: lineNum, recommendation: "Avoid eval(). Use JSON.parse() for JSON or Function() as a last resort with proper input validation" });
    }

    // Insecure random
    if (/Math\.random\(\)/.test(line) && /token|session|id|key|secret/i.test(line)) {
      findings.push({ severity: "medium", type: "Weak Randomness", description: "Math.random() used for security-sensitive values", line: lineNum, recommendation: "Use crypto.getRandomValues() or a cryptographically secure random number generator" });
    }

    // CORS wildcard
    if (/Access-Control-Allow-Origin.*\*/i.test(line)) {
      findings.push({ severity: "medium", type: "Permissive CORS", description: "Wildcard CORS policy allows any origin", line: lineNum, recommendation: "Restrict CORS to specific trusted origins instead of using wildcard (*)" });
    }
  });

  // Check for missing Content Security Policy
  if (!/Content-Security-Policy/i.test(code)) {
    findings.push({ severity: "info", type: "Missing CSP", description: "No Content Security Policy header detected", recommendation: "Add a Content-Security-Policy header to prevent XSS and data injection attacks" });
  }

  return findings;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const findings = auditCode(code);
    const critical = findings.filter(f => f.severity === "critical").length;
    const high = findings.filter(f => f.severity === "high").length;
    const medium = findings.filter(f => f.severity === "medium").length;
    const low = findings.filter(f => f.severity === "low").length;
    const score = Math.max(0, 100 - critical * 25 - high * 15 - medium * 8 - low * 3);

    return NextResponse.json({
      ok: true,
      score,
      grade: score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F",
      summary: { total: findings.length, critical, high, medium, low, info: findings.filter(f => f.severity === "info").length },
      findings,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Security audit failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
