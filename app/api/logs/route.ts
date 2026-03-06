import { NextResponse } from "next/server";
import { queryLogs, clearLogs, type LogLevel } from "../../../lib/logger";

export const runtime = "nodejs";

const VALID_LEVELS = new Set(["debug", "info", "warn", "error"]);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const level = url.searchParams.get("level");
  const limitParam = url.searchParams.get("limit");
  const since = url.searchParams.get("since");

  if (level && !VALID_LEVELS.has(level)) {
    return NextResponse.json(
      { error: `Invalid level. Must be one of: ${Array.from(VALID_LEVELS).join(", ")}` },
      { status: 400 }
    );
  }

  const limit = limitParam ? parseInt(limitParam, 10) : undefined;
  if (limit !== undefined && isNaN(limit)) {
    return NextResponse.json({ error: "limit must be a number" }, { status: 400 });
  }

  const entries = queryLogs({
    level: level as LogLevel | undefined,
    limit,
    since: since ?? undefined,
  });

  return NextResponse.json({ entries, count: entries.length });
}

export async function DELETE() {
  clearLogs();
  return NextResponse.json({ success: true, message: "Logs cleared" });
}
