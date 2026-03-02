import { NextRequest, NextResponse } from "next/server";

interface Workflow {
  id: string;
  name: string;
  trigger: "webhook" | "schedule" | "event";
  lastRun: string;
  status: boolean;
  createdAt: string;
}

// In-memory store for demo purposes
const workflows: Workflow[] = [
  { id: "1", name: "Daily Analytics Report", trigger: "schedule", lastRun: "2h ago", status: true, createdAt: "2024-11-01" },
  { id: "2", name: "New User Onboarding", trigger: "event", lastRun: "15m ago", status: true, createdAt: "2024-10-15" },
  { id: "3", name: "GitHub PR Review Alert", trigger: "webhook", lastRun: "1d ago", status: false, createdAt: "2024-09-20" },
];

export async function GET() {
  return NextResponse.json({ workflows });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, trigger } = body as { name?: string; trigger?: string };

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const validTriggers = ["webhook", "schedule", "event"];
    const workflowTrigger = validTriggers.includes(trigger ?? "") ? trigger as Workflow["trigger"] : "event";

    const newWorkflow: Workflow = {
      id: Date.now().toString(),
      name,
      trigger: workflowTrigger,
      lastRun: "Never",
      status: false,
      createdAt: new Date().toISOString().split("T")[0],
    };

    workflows.push(newWorkflow);

    return NextResponse.json(newWorkflow, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
