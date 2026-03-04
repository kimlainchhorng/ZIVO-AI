import { NextResponse } from "next/server";
import {
  listWorkflows,
  getWorkflow,
  saveWorkflow,
  executeWorkflow,
  type Workflow,
  type WorkflowInput,
} from "../../../lib/workflow-engine";

export const runtime = "nodejs";

let idCounter = 0;
function nextId(): string {
  return `wf_${Date.now()}_${++idCounter}`;
}

export async function GET() {
  return NextResponse.json({ workflows: listWorkflows() });
}

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { name, steps, trigger } = body as Partial<Workflow>;

    if (!name || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json({ error: "name and steps are required" }, { status: 400 });
    }

    const workflow: Workflow = {
      id: nextId(),
      name,
      steps,
      trigger: trigger ?? "manual",
    };

    saveWorkflow(workflow);
    return NextResponse.json({ workflow }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id query parameter is required" }, { status: 400 });
    }

    const workflow = getWorkflow(id);
    if (!workflow) {
      return NextResponse.json({ error: `Workflow ${id} not found` }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const input = (body as { input?: WorkflowInput }).input ?? {};

    // Stream NDJSON events
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const gen = executeWorkflow(workflow, input as WorkflowInput);
        for await (const event of gen) {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
