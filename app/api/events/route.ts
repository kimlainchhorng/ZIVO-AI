import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface Event {
  id: string;
  title: string;
  type: "webinar" | "workshop" | "conference" | "ama" | "demo";
  date: string;
  registrations: number;
  capacity: number;
  status: "upcoming" | "live" | "completed" | "cancelled";
  recordingUrl?: string;
}

export async function GET() {
  return NextResponse.json({
    events: [
      {
        id: "EV-001",
        title: "ZIVO Product Deep Dive",
        type: "webinar",
        date: "2025-07-24T17:00:00.000Z",
        registrations: 312,
        capacity: 500,
        status: "upcoming",
      },
      {
        id: "EV-002",
        title: "Getting Started Workshop",
        type: "workshop",
        date: "2025-07-18T14:00:00.000Z",
        registrations: 88,
        capacity: 100,
        status: "upcoming",
      },
      {
        id: "EV-003",
        title: "Q2 Community AMA",
        type: "ama",
        date: "2025-06-30T15:00:00.000Z",
        registrations: 240,
        capacity: 300,
        status: "completed",
        recordingUrl: "https://example.com/recordings/q2-ama",
      },
    ] satisfies Event[],
    summary: {
      upcomingEvents: 2,
      totalRegistrationsThisMonth: 400,
      completedEvents: 1,
      averageAttendanceRate: 74,
    },
    recordings: [
      {
        id: "EV-003",
        title: "Q2 Community AMA",
        views: 520,
        url: "https://example.com/recordings/q2-ama",
      },
    ],
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, type, date, capacity } = body as {
      title?: string;
      type?: Event["type"];
      date?: string;
      capacity?: number;
    };
    if (!title || !type || !date) {
      return NextResponse.json(
        { error: "Missing required fields: title, type, date" },
        { status: 400 }
      );
    }
    const event: Event = {
      id: `EV-${Date.now()}`,
      title,
      type,
      date,
      capacity: capacity ?? 100,
      registrations: 0,
      status: "upcoming",
    };
    return NextResponse.json(event, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
