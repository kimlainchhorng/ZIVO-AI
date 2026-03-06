import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    description:
      "Data retention policy configurator. Accepts { table: string, retentionDays: number, action: string } and returns a data retention policy configuration.",
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      table?: string;
      retentionDays?: number;
      action?: string;
    };

    const { table, retentionDays, action } = body;

    if (!table || retentionDays === undefined || !action) {
      return NextResponse.json(
        { error: "Missing required fields: table, retentionDays, and action" },
        { status: 400 }
      );
    }

    if (typeof retentionDays !== "number" || retentionDays < 1) {
      return NextResponse.json(
        { error: "retentionDays must be a positive number" },
        { status: 400 }
      );
    }

    const retentionPolicy = {
      table,
      retentionDays,
      action,
      expiresAfter: `${retentionDays}d`,
      scheduledJob: {
        cron: "0 2 * * *",
        description: `Daily cleanup: ${action} records from '${table}' older than ${retentionDays} days`,
        sql:
          action === "delete"
            ? `DELETE FROM "${table}" WHERE created_at < NOW() - INTERVAL '${retentionDays} days';`
            : `UPDATE "${table}" SET archived = true WHERE created_at < NOW() - INTERVAL '${retentionDays} days';`,
      },
      compliance: {
        gdprCompliant: retentionDays <= 730,
        recommendedReview: retentionDays > 365 ? "Annual review recommended" : "Policy within standard range",
      },
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ retentionPolicy });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
