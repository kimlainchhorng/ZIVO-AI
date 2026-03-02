import { NextResponse } from "next/server";

function applyFix(code: string, issueType: string): string {
  let fixed = code;

  if (issueType === "missing-alt") {
    fixed = fixed.replace(/<img(?![^>]*\balt\s*=)([^>]*)>/gi, '<img$1 alt="">');
  }

  if (issueType === "http-to-https") {
    fixed = fixed.replace(/http:\/\/(?!localhost)/gi, "https://");
  }

  if (issueType === "add-meta-viewport") {
    if (!/<meta[^>]+viewport/i.test(fixed)) {
      fixed = fixed.replace(/<head>/i, '<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1">');
    }
  }

  if (issueType === "add-charset") {
    if (!/<meta[^>]+charset/i.test(fixed)) {
      fixed = fixed.replace(/<head>/i, '<head>\n  <meta charset="UTF-8">');
    }
  }

  return fixed;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { code, fixes } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }
    if (!Array.isArray(fixes) || fixes.length === 0) {
      return NextResponse.json({ error: "fixes array is required" }, { status: 400 });
    }

    let fixed = code;
    const applied: string[] = [];

    for (const fix of fixes) {
      const before = fixed;
      fixed = applyFix(fixed, fix);
      if (fixed !== before) applied.push(fix);
    }

    return NextResponse.json({ ok: true, code: fixed, applied, totalApplied: applied.length });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Fix failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
