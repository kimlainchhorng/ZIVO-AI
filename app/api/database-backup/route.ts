import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface DatabaseBackupBody {
  dbType: string;
  schedule: string;
  retention: number;
}

interface BackupConfiguration {
  id: string;
  dbType: string;
  schedule: string;
  retentionDays: number;
  createdAt: string;
  storageOptions: {
    compression: string;
    encryption: string;
    storageClass: string;
  };
  notificationWebhook: string | null;
  estimatedDuration: string;
  recommendedTool: string;
}

const dbToolMap: Record<string, string> = {
  postgres: "pg_dump / pg_restore",
  postgresql: "pg_dump / pg_restore",
  mysql: "mysqldump / mysqlpump",
  mariadb: "mysqldump / mariabackup",
  mongodb: "mongodump / mongorestore",
  redis: "redis-cli BGSAVE / RDB snapshot",
  sqlite: "sqlite3 .backup command",
  mssql: "SQL Server Backup T-SQL / sqlcmd",
  oracle: "expdp / impdp (Data Pump)",
};

function getRecommendedTool(dbType: string): string {
  const normalized = dbType.toLowerCase().trim();
  return dbToolMap[normalized] ?? `${dbType} native backup utility`;
}

function estimateDuration(dbType: string): string {
  const normalized = dbType.toLowerCase().trim();
  if (["redis"].includes(normalized)) return "< 1 minute";
  if (["sqlite"].includes(normalized)) return "< 5 minutes";
  return "5–30 minutes depending on data volume";
}

export async function GET() {
  return NextResponse.json({
    description:
      "Database backup configuration API. Accepts dbType, schedule (cron expression), and retention (days) to produce a structured backup configuration object.",
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as DatabaseBackupBody;
    const { dbType, schedule, retention } = body;

    if (!dbType || typeof dbType !== "string") {
      return NextResponse.json(
        { error: "Missing required field: dbType" },
        { status: 400 }
      );
    }

    if (!schedule || typeof schedule !== "string") {
      return NextResponse.json(
        { error: "Missing required field: schedule (cron expression)" },
        { status: 400 }
      );
    }

    if (typeof retention !== "number" || retention < 1) {
      return NextResponse.json(
        { error: "Invalid retention value. Must be a positive number (days)" },
        { status: 400 }
      );
    }

    const config: BackupConfiguration = {
      id: `backup_cfg_${Date.now()}`,
      dbType,
      schedule,
      retentionDays: retention,
      createdAt: new Date().toISOString(),
      storageOptions: {
        compression: "gzip",
        encryption: "AES-256",
        storageClass: "STANDARD_IA",
      },
      notificationWebhook: null,
      estimatedDuration: estimateDuration(dbType),
      recommendedTool: getRecommendedTool(dbType),
    };

    return NextResponse.json({ configuration: config }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
