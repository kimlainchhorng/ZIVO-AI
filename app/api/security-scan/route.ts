import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const SCAN_SYSTEM_PROMPT = `You are a world-class application security expert (OWASP, SANS Top 25, CWE expert).

When given code, analyze it for security vulnerabilities and respond ONLY with a valid JSON object:
{
  "issues": [
    {
      "id": "unique-id",
      "severity": "critical" | "high" | "medium" | "low" | "info",
      "title": "Short title",
      "description": "Clear explanation of the vulnerability",
      "line": <line number or null>,
      "cwe": "CWE-XXX or null",
      "recommendation": "Specific fix recommendation"
    }
  ],
  "score": <integer 0-100, where 100 = perfectly secure>,
  "summary": "2-3 sentence executive summary of the security posture",
  "language": "<detected language>"
}

Check for:
- Injection flaws (SQL, NoSQL, command, LDAP injection)
- XSS (Cross-Site Scripting)
- CSRF vulnerabilities
- Exposed secrets, API keys, credentials hardcoded
- Insecure deserialization
- Missing authentication / authorization checks
- Insecure direct object references
- Security misconfiguration
- Using components with known vulnerabilities
- Insufficient logging and monitoring
- Path traversal vulnerabilities
- Prototype pollution
- ReDoS vulnerabilities
- Open redirect flaws
- Race conditions
- Buffer overflows (if applicable)
`;

const FIX_SYSTEM_PROMPT = `You are a world-class application security expert.
Given code and a list of security issues, rewrite the code to fix ALL identified vulnerabilities.
Respond with ONLY the fixed code — no explanations, no markdown fences, just the raw fixed code.
Preserve the original functionality while making it secure.`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const { code, language, mode } = body as { code?: unknown; language?: unknown; mode?: unknown; issues?: unknown };

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    if (mode !== "scan" && mode !== "fix") {
      return NextResponse.json({ error: "Invalid mode. Use 'scan' or 'fix'." }, { status: 400 });
    }

    const safeLanguage = typeof language === "string" && language ? language : "auto-detect";

    if (mode === "scan") {
      const completion = await getClient().chat.completions.create({
        model: "gpt-4o",
        temperature: 0.1,
        max_tokens: 2000,
        messages: [
          { role: "system", content: SCAN_SYSTEM_PROMPT },
          { role: "user", content: `Language: ${safeLanguage}\n\nCode to scan:\n\`\`\`\n${code}\n\`\`\`` },
        ],
      });

      let raw = completion.choices[0]?.message?.content ?? "";
      raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

      try {
        const result = JSON.parse(raw) as { issues: unknown[]; score: number; summary: string; language: string };
        return NextResponse.json(result);
      } catch {
        return NextResponse.json({ error: "Failed to parse scan result" }, { status: 500 });
      }
    }

    if (mode === "fix") {
      const issues = typeof body.issues === "string" ? body.issues : "";
      const completion = await getClient().chat.completions.create({
        model: "gpt-4o",
        temperature: 0.1,
        max_tokens: 4000,
        messages: [
          { role: "system", content: FIX_SYSTEM_PROMPT },
          { role: "user", content: `Language: ${safeLanguage}\n\nSecurity issues to fix:\n${issues}\n\nOriginal code:\n\`\`\`\n${code}\n\`\`\`` },
        ],
      });

      const fixedCode = completion.choices[0]?.message?.content ?? "";
      return NextResponse.json({ fixedCode });
    }

    return NextResponse.json({ error: "Invalid mode. Use 'scan' or 'fix'." }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}
