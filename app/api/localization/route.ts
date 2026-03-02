import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPPORTED_LOCALES = [
  "en", "es", "fr", "de", "it", "pt", "zh", "ja", "ko", "ar",
  "hi", "ru", "tr", "nl", "pl", "sv", "da", "fi", "nb", "cs",
  "ro", "hu", "el", "th", "vi", "id", "ms", "uk", "bg", "hr",
];

/**
 * Localization Engine API
 * GET  /api/localization  – list supported locales
 * POST /api/localization  – translate content into a target locale
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    locales: SUPPORTED_LOCALES,
    total: SUPPORTED_LOCALES.length,
    rtlLocales: ["ar", "he", "fa", "ur"],
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { content, sourceLocale, targetLocale } = body as {
    content?: string;
    sourceLocale?: string;
    targetLocale?: string;
  };

  if (!content || !targetLocale) {
    return NextResponse.json({ error: "content and targetLocale required" }, { status: 400 });
  }

  if (!SUPPORTED_LOCALES.includes(targetLocale)) {
    return NextResponse.json({ error: "Unsupported locale" }, { status: 400 });
  }

  // TODO: integrate with translation provider (DeepL, Google Translate, etc.)
  return NextResponse.json({
    ok: true,
    translation: {
      id: crypto.randomUUID(),
      content,
      sourceLocale: sourceLocale ?? "en",
      targetLocale,
      translated: content, // placeholder – real translation happens asynchronously
      status: "queued",
      requestedAt: new Date().toISOString(),
    },
  });
}
