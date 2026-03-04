import { NextResponse } from "next/server";

export const runtime = "nodejs";

const PII_PATTERNS: Array<{ name: string; pattern: RegExp; replacement: string }> = [
  {
    name: "email",
    pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
    replacement: "[EMAIL REDACTED]",
  },
  {
    name: "phone",
    pattern: /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    replacement: "[PHONE REDACTED]",
  },
  {
    name: "ssn",
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: "[SSN REDACTED]",
  },
  {
    name: "credit_card",
    // Matches major card formats: Visa (4), Mastercard (5), Amex (3), Discover (6)
    pattern: /\b(?:4\d{3}|5[1-5]\d{2}|3[47]\d{2}|6011)[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4,7}\b/g,
    replacement: "[CREDIT CARD REDACTED]",
  },
];

export async function GET() {
  return NextResponse.json({
    description:
      "PII redaction API. POST { text: string } — redacts emails, phones, SSNs, and credit card numbers using regex.",
    supported: PII_PATTERNS.map((p) => p.name),
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const text = typeof body.text === "string" ? body.text : "";

    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    let redacted = text;
    const detections: string[] = [];

    for (const { name, pattern, replacement } of PII_PATTERNS) {
      const matched = redacted.match(pattern);
      if (matched && matched.length > 0) {
        detections.push(name);
        redacted = redacted.replace(pattern, replacement);
      }
    }

    return NextResponse.json({
      original_length: text.length,
      redacted,
      detections,
      pii_found: detections.length > 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
