import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "overview";

  return NextResponse.json({
    ok: true,
    type,
    pipelines: [
      { id: "p1", name: "User Events ETL", type: "etl", source: "PostgreSQL", destination: "BigQuery", status: "running", recordsPerHour: 42000 },
      { id: "p2", name: "Product Catalog ELT", type: "elt", source: "REST API", destination: "Snowflake", status: "running", recordsPerHour: 8400 },
      { id: "p3", name: "Kafka Consumer", type: "streaming", source: "Kafka", destination: "ClickHouse", status: "running", recordsPerHour: 180000 },
      { id: "p4", name: "ML Feature Store", type: "etl", source: "Multiple", destination: "Feature Store", status: "scheduled", recordsPerHour: 24000 },
    ],
    warehouses: [
      { id: "bigquery", name: "BigQuery", status: "connected", tables: 142, storage: "1.2TB" },
      { id: "snowflake", name: "Snowflake", status: "connected", tables: 68, storage: "0.8TB" },
      { id: "redshift", name: "Redshift", status: "available", tables: 0, storage: "0" },
    ],
    streamingSources: ["Apache Kafka", "Amazon Kinesis", "Google Pub/Sub", "Azure Event Hubs", "RabbitMQ"],
    stats: {
      totalPipelines: 28,
      recordsProcessedToday: 4200000,
      dataQualityScore: 99.1,
      activeSources: 32,
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, config } = body;

    if (!action) {
      return NextResponse.json({ error: "Action required" }, { status: 400 });
    }

    const results: Record<string, object> = {
      "create-pipeline": {
        id: `pipeline-${Date.now()}`,
        name: config?.name || "New Pipeline",
        type: config?.type || "etl",
        source: config?.source || "PostgreSQL",
        destination: config?.destination || "BigQuery",
        status: "created",
        schedule: config?.schedule || "0 * * * *",
        createdAt: new Date().toISOString(),
      },
      "setup-kafka": {
        brokers: config?.brokers || ["kafka-1:9092", "kafka-2:9092", "kafka-3:9092"],
        topics: config?.topics || ["events", "transactions", "notifications"],
        consumerGroups: config?.groups || ["analytics", "ml-features", "audit"],
        schemaRegistry: "http://schema-registry:8081",
        config: { replicationFactor: 3, partitions: 12, retentionMs: 604800000 },
      },
      "setup-data-warehouse": {
        provider: config?.provider || "bigquery",
        dataset: config?.dataset || "zivo_analytics",
        tables: ["events", "users", "sessions", "conversions", "revenue"],
        partitioning: "DATE(_PARTITIONTIME)",
        clustering: ["user_id", "event_type"],
      },
      "validate-data": {
        rulesApplied: 24,
        recordsChecked: 125400,
        passRate: 99.1,
        failures: [
          { rule: "not_null:email", count: 82, severity: "warning" },
          { rule: "unique:user_id", count: 0, severity: "error" },
        ],
        validatedAt: new Date().toISOString(),
      },
    };

    if (action in results) {
      return NextResponse.json({ ok: true, action, result: results[action] });
    }

    return NextResponse.json({ ok: true, action, result: `${action} completed` });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Data action failed" }, { status: 500 });
  }
}
