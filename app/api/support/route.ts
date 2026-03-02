import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface Ticket {
  id: string;
  subject: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  createdAt: string;
  assignedTo: string;
}

export async function GET() {
  return NextResponse.json({
    tickets: [
      {
        id: "T-001",
        subject: "Cannot log in after password reset",
        status: "open",
        priority: "high",
        createdAt: "2025-07-10T08:23:00.000Z",
        assignedTo: "agent-alice",
      },
      {
        id: "T-002",
        subject: "Billing charge discrepancy",
        status: "in-progress",
        priority: "medium",
        createdAt: "2025-07-09T14:05:00.000Z",
        assignedTo: "agent-bob",
      },
      {
        id: "T-003",
        subject: "Feature request: dark mode",
        status: "closed",
        priority: "low",
        createdAt: "2025-07-08T09:00:00.000Z",
        assignedTo: "agent-carol",
      },
    ] satisfies Ticket[],
    sla: {
      breachRisk: 2,
      withinSla: 98,
      averageFirstResponseMinutes: 18,
      averageResolutionHours: 6.4,
    },
    satisfactionScore: 4.6,
    openTickets: 2,
    resolvedToday: 11,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { subject, priority, description } = body as {
      subject?: string;
      priority?: "low" | "medium" | "high" | "critical";
      description?: string;
    };
    if (!subject || !description) {
      return NextResponse.json(
        { error: "Missing required fields: subject, description" },
        { status: 400 }
      );
    }
    const ticket: Ticket = {
      id: `T-${Date.now()}`,
      subject,
      priority: priority ?? "medium",
      status: "open",
      createdAt: new Date().toISOString(),
      assignedTo: "unassigned",
    };
    return NextResponse.json(ticket, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
