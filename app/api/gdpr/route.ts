import { NextResponse } from "next/server";

export const runtime = "nodejs";

type GdprAction = "export" | "erase" | "consent";

export async function GET() {
  return NextResponse.json({
    description:
      "GDPR tools API. POST { action: 'export' | 'erase' | 'consent', userId: string, data?: unknown }",
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const rawAction = typeof body.action === "string" ? body.action : "";
    const userId = typeof body.userId === "string" ? body.userId : "";
    const data = body.data;

    if (!rawAction || !["export", "erase", "consent"].includes(rawAction)) {
      return NextResponse.json(
        { error: "action must be one of: export, erase, consent" },
        { status: 400 }
      );
    }
    const action = rawAction as GdprAction;
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const timestamp = new Date().toISOString();

    switch (action) {
      case "export":
        return NextResponse.json({
          action,
          userId,
          timestamp,
          status: "completed",
          exportedData: {
            profile: { userId, exportedAt: timestamp },
            activityLog: [],
            preferences: {},
          },
          format: "JSON",
          regulation: "GDPR Article 20",
        });

      case "erase":
        return NextResponse.json({
          action,
          userId,
          timestamp,
          status: "completed",
          erasedFields: ["profile", "activityLog", "preferences", "personalData"],
          regulation: "GDPR Article 17",
          retentionExceptions: [],
        });

      case "consent":
        return NextResponse.json({
          action,
          userId,
          timestamp,
          status: "recorded",
          consentData: data ?? {},
          consentId: `consent_${userId}_${Date.now()}`,
          regulation: "GDPR Article 7",
        });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
