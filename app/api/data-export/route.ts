import { NextResponse } from "next/server";

export const runtime = "nodejs";

const mockData: Record<string, Record<string, unknown>[]> = {
  users: [
    { id: "u1", name: "Alice", email: "alice@example.com", createdAt: "2024-01-10" },
    { id: "u2", name: "Bob", email: "bob@example.com", createdAt: "2024-02-15" },
  ],
  orders: [
    { id: "o1", userId: "u1", total: 99.99, status: "completed", createdAt: "2024-03-01" },
    { id: "o2", userId: "u2", total: 49.50, status: "pending", createdAt: "2024-03-10" },
  ],
};

export async function GET() {
  return NextResponse.json({
    description:
      "Data export API. Accepts { format: 'csv'|'json'|'xlsx', table: string, filters?: Record<string, unknown> } and returns mock exported data in the requested format.",
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      format?: "csv" | "json" | "xlsx";
      table?: string;
      filters?: Record<string, unknown>;
    };

    const { format, table, filters } = body;

    if (!format || !["csv", "json", "xlsx"].includes(format)) {
      return NextResponse.json(
        { error: "Missing or invalid format. Must be 'csv', 'json', or 'xlsx'" },
        { status: 400 }
      );
    }

    if (!table) {
      return NextResponse.json({ error: "Missing required field: table" }, { status: 400 });
    }

    const tableData = mockData[table] ?? [];
    let rows = tableData;

    if (filters && typeof filters === "object") {
      rows = tableData.filter((row) =>
        Object.entries(filters).every(([key, value]) => row[key] === value)
      );
    }

    if (format === "json") {
      return NextResponse.json({ format, table, rows, count: rows.length });
    }

    if (format === "csv") {
      if (rows.length === 0) {
        return NextResponse.json({ format, table, csv: "", count: 0 });
      }
      const headers = Object.keys(rows[0]);
      const csvLines = [
        headers.join(","),
        ...rows.map((row) =>
          headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")
        ),
      ];
      return NextResponse.json({ format, table, csv: csvLines.join("\n"), count: rows.length });
    }

    if (format === "xlsx") {
      return NextResponse.json({
        format,
        table,
        message: "XLSX export requires server-side rendering. Use the download endpoint with format=xlsx.",
        rows,
        count: rows.length,
      });
    }

    return NextResponse.json({ error: "Unknown format" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
