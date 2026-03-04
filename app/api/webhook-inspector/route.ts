import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface WebhookLogEntry {
  id: string;
  receivedAt: string;
  data: Record<string, unknown>;
  valid: boolean;
}

const webhookLog: WebhookLogEntry[] = [];

export async function GET() {
  return NextResponse.json({
    description:
      "Webhook inspector and debugger. Accepts { action: 'log'|'replay'|'validate', webhookData?: Record<string, unknown> } and returns the webhook log, replay result, or validation outcome.",
    log: webhookLog,
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      action?: "log" | "replay" | "validate";
      webhookData?: Record<string, unknown>;
    };

    const { action, webhookData } = body;

    if (!action || !["log", "replay", "validate"].includes(action)) {
      return NextResponse.json(
        { error: "Missing or invalid action. Must be 'log', 'replay', or 'validate'" },
        { status: 400 }
      );
    }

    if (action === "validate") {
      if (!webhookData) {
        return NextResponse.json({ error: "webhookData is required for validate action" }, { status: 400 });
      }
      const hasRequiredFields =
        typeof webhookData["event"] === "string" && webhookData["timestamp"] !== undefined;
      return NextResponse.json({
        valid: hasRequiredFields,
        missingFields: [
          ...(!webhookData["event"] ? ["event"] : []),
          ...(webhookData["timestamp"] === undefined ? ["timestamp"] : []),
        ],
        receivedFields: Object.keys(webhookData),
      });
    }

    if (action === "log") {
      if (!webhookData) {
        return NextResponse.json({ error: "webhookData is required for log action" }, { status: 400 });
      }
      const entry: WebhookLogEntry = {
        id: crypto.randomUUID(),
        receivedAt: new Date().toISOString(),
        data: webhookData,
        valid: typeof webhookData["event"] === "string",
      };
      webhookLog.unshift(entry);
      if (webhookLog.length > 100) webhookLog.pop();
      return NextResponse.json({ logged: true, entry });
    }

    if (action === "replay") {
      const lastEntry = webhookLog[0];
      if (!lastEntry) {
        return NextResponse.json({ error: "No webhook entries to replay" }, { status: 404 });
      }
      return NextResponse.json({ replayed: true, entry: lastEntry });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
