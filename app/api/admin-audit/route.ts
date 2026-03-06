import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface AuditEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  ipAddress: string;
  timestamp: string;
  status: "success" | "failure";
}

const mockAuditLog: AuditEntry[] = [
  { id: "a1", userId: "user_001", action: "LOGIN", resource: "auth", ipAddress: "192.168.1.10", timestamp: "2024-04-01T08:00:00Z", status: "success" },
  { id: "a2", userId: "user_002", action: "UPDATE_SETTINGS", resource: "settings", ipAddress: "192.168.1.11", timestamp: "2024-04-01T09:15:00Z", status: "success" },
  { id: "a3", userId: "user_001", action: "DELETE_USER", resource: "users/user_004", ipAddress: "192.168.1.10", timestamp: "2024-04-01T10:30:00Z", status: "failure" },
  { id: "a4", userId: "user_003", action: "EXPORT_DATA", resource: "data-export", ipAddress: "10.0.0.5", timestamp: "2024-04-02T11:00:00Z", status: "success" },
  { id: "a5", userId: "user_002", action: "LOGIN", resource: "auth", ipAddress: "192.168.1.11", timestamp: "2024-04-02T13:45:00Z", status: "failure" },
];

export async function GET() {
  return NextResponse.json({
    description:
      "Admin audit trail API. POST accepts { filters?: { userId?, action?, startDate?, endDate? }, export?: boolean } and returns filtered audit log entries.",
    recentEntries: mockAuditLog.slice(0, 5),
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      filters?: {
        userId?: string;
        action?: string;
        startDate?: string;
        endDate?: string;
      };
      export?: boolean;
    };

    const { filters, export: exportFlag } = body;

    let entries = [...mockAuditLog];

    if (filters) {
      if (filters.userId) {
        entries = entries.filter((e) => e.userId === filters.userId);
      }
      if (filters.action) {
        entries = entries.filter((e) =>
          e.action.toLowerCase().includes(filters.action!.toLowerCase())
        );
      }
      if (filters.startDate) {
        const start = new Date(filters.startDate).getTime();
        entries = entries.filter((e) => new Date(e.timestamp).getTime() >= start);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate).getTime();
        entries = entries.filter((e) => new Date(e.timestamp).getTime() <= end);
      }
    }

    if (exportFlag) {
      const headers = ["id", "userId", "action", "resource", "ipAddress", "timestamp", "status"];
      const csv = [
        headers.join(","),
        ...entries.map((e) =>
          headers.map((h) => JSON.stringify(e[h as keyof AuditEntry])).join(",")
        ),
      ].join("\n");
      return NextResponse.json({ format: "csv", csv, count: entries.length });
    }

    return NextResponse.json({ entries, count: entries.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
