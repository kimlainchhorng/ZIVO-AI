export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

interface Migration {
  id: string;
  name: string;
  status: "applied" | "pending" | "failed";
  appliedAt: string | null;
  durationMs: number | null;
}

const mockMigrations: Migration[] = [
  {
    id: "mig_001",
    name: "create_users_table",
    status: "applied",
    appliedAt: "2025-09-10T08:00:00Z",
    durationMs: 145,
  },
  {
    id: "mig_002",
    name: "add_agents_schema",
    status: "applied",
    appliedAt: "2025-10-05T09:30:00Z",
    durationMs: 320,
  },
  {
    id: "mig_003",
    name: "create_knowledge_base_table",
    status: "applied",
    appliedAt: "2025-11-20T11:00:00Z",
    durationMs: 210,
  },
  {
    id: "mig_004",
    name: "add_snapshots_table",
    status: "applied",
    appliedAt: "2026-01-15T10:00:00Z",
    durationMs: 180,
  },
  {
    id: "mig_005",
    name: "add_rbac_roles_column",
    status: "pending",
    appliedAt: null,
    durationMs: null,
  },
];

export async function GET() {
  try {
    const pendingCount = mockMigrations.filter((m) => m.status === "pending").length;
    return NextResponse.json({ migrations: mockMigrations, pendingCount });
  } catch {
    return NextResponse.json({ error: "Failed to fetch migrations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sql, name, dryRun } = body as {
      sql?: string;
      name?: string;
      dryRun?: boolean;
    };

    if (!sql || sql.trim() === "") {
      return NextResponse.json({ error: "Missing required field: sql" }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: "Missing required field: name" }, { status: 400 });
    }

    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (dryRun) {
      const warnings: string[] = [];

      if (sql.toUpperCase().includes("DROP TABLE")) {
        warnings.push("DROP TABLE detected — this operation is irreversible.");
      }
      if (sql.toUpperCase().includes("DELETE FROM") && !sql.toUpperCase().includes("WHERE")) {
        warnings.push("DELETE without WHERE clause will remove all rows.");
      }
      if (sql.toUpperCase().includes("ALTER TABLE")) {
        warnings.push("ALTER TABLE may lock the table during migration on large datasets.");
      }

      return NextResponse.json({
        dryRun: true,
        sql,
        parsedStatements: statements.length,
        warnings,
        success: true,
      });
    }

    const newMigration: Migration = {
      id: `mig_${randomUUID().slice(0, 8)}`,
      name,
      status: "applied",
      appliedAt: new Date().toISOString(),
      durationMs: Math.floor(Math.random() * 400) + 100,
    };

    return NextResponse.json({ applied: true, migration: newMigration, success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to run migration" }, { status: 500 });
  }
}
