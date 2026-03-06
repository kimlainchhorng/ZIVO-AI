import { NextResponse } from "next/server";
import {
  listTriggers,
  getTrigger,
  saveTrigger,
  deleteTrigger,
  parseCronExpression,
  validateWebhookSignature,
  type CronTrigger,
  type WebhookTrigger,
  type TriggerConfig,
} from "../../../lib/triggers";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// GET /api/triggers — list all triggers
export async function GET() {
  return NextResponse.json({ triggers: listTriggers() });
}

// POST /api/triggers — create a trigger
export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { type, workflowId, schedule, secret } = body as {
      type: "cron" | "webhook";
      workflowId: string;
      schedule?: string;
      secret?: string;
    };

    if (!type || !workflowId) {
      return NextResponse.json({ error: "type and workflowId are required" }, { status: 400 });
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    let trigger: TriggerConfig;

    if (type === "cron") {
      if (!schedule) {
        return NextResponse.json({ error: "schedule is required for cron triggers" }, { status: 400 });
      }
      let parsedSchedule;
      try {
        parsedSchedule = parseCronExpression(schedule);
      } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 400 });
      }
      trigger = { id, type: "cron", schedule: parsedSchedule, workflowId, enabled: true, createdAt: now } satisfies CronTrigger;
    } else {
      trigger = { id, type: "webhook", secret: secret ?? randomUUID(), workflowId, enabled: true, createdAt: now } satisfies WebhookTrigger;
    }

    saveTrigger(trigger);
    return NextResponse.json({ trigger }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/triggers?id=xxx
export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id query parameter is required" }, { status: 400 });
  }
  const deleted = deleteTrigger(id);
  if (!deleted) {
    return NextResponse.json({ error: `Trigger ${id} not found` }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

// PUT /api/triggers/webhook/{id} is handled via a separate route — stub below
export async function PUT(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const trigger = getTrigger(id);
    if (!trigger || trigger.type !== "webhook") {
      return NextResponse.json({ error: "Webhook trigger not found" }, { status: 404 });
    }

    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256") ?? "";
    const webhookTrigger = trigger as WebhookTrigger;
    const valid = validateWebhookSignature(rawBody, signature, webhookTrigger.secret);

    if (!valid) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    webhookTrigger.lastFiredAt = new Date().toISOString();
    saveTrigger(webhookTrigger);

    return NextResponse.json({ received: true, triggerId: id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
