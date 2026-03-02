import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface ChecklistItem {
  id: string;
  task: string;
  status: "complete" | "in-progress" | "pending";
  owner: string;
}

export async function GET() {
  return NextResponse.json({
    checklist: [
      { id: "1", task: "Set up CI/CD pipeline", status: "complete", owner: "engineering" },
      { id: "2", task: "Finalize onboarding flow", status: "in-progress", owner: "product" },
      { id: "3", task: "Load testing", status: "pending", owner: "engineering" },
      { id: "4", task: "Legal & compliance review", status: "complete", owner: "legal" },
    ] satisfies ChecklistItem[],
    launchDate: "2025-09-01T00:00:00.000Z",
    countdown: {
      days: 45,
      hours: 12,
      minutes: 30,
    },
    betaProgram: {
      enrolled: 320,
      capacity: 500,
      waitlist: 84,
      status: "open",
    },
    completionPercent: 50,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { task, owner } = body as { task?: string; owner?: string };
    if (!task || !owner) {
      return NextResponse.json(
        { error: "Missing required fields: task, owner" },
        { status: 400 }
      );
    }
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      task,
      owner,
      status: "pending",
    };
    return NextResponse.json(newItem, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
