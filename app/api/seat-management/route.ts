import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface SeatRecord {
  userId: string;
  role: string;
  addedAt: string;
}

const mockSeats: SeatRecord[] = [
  { userId: "user_001", role: "admin", addedAt: "2024-01-15T10:00:00Z" },
  { userId: "user_002", role: "member", addedAt: "2024-02-01T09:30:00Z" },
  { userId: "user_003", role: "viewer", addedAt: "2024-03-10T14:00:00Z" },
];

export async function GET() {
  return NextResponse.json({
    description:
      "Team seat management API. Accepts { action: 'add'|'remove'|'list', userId?: string, role?: string } and manages team seat assignments.",
    seats: mockSeats,
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      action?: "add" | "remove" | "list";
      userId?: string;
      role?: string;
    };

    const { action, userId, role } = body;

    if (!action || !["add", "remove", "list"].includes(action)) {
      return NextResponse.json(
        { error: "Missing or invalid action. Must be 'add', 'remove', or 'list'" },
        { status: 400 }
      );
    }

    if (action === "list") {
      return NextResponse.json({ seats: mockSeats, total: mockSeats.length });
    }

    if (action === "add") {
      if (!userId || !role) {
        return NextResponse.json(
          { error: "userId and role are required for add action" },
          { status: 400 }
        );
      }
      const exists = mockSeats.some((s) => s.userId === userId);
      if (exists) {
        return NextResponse.json({ error: `User '${userId}' already has a seat` }, { status: 409 });
      }
      const newSeat: SeatRecord = { userId, role, addedAt: new Date().toISOString() };
      mockSeats.push(newSeat);
      return NextResponse.json({ added: true, seat: newSeat, total: mockSeats.length });
    }

    if (action === "remove") {
      if (!userId) {
        return NextResponse.json(
          { error: "userId is required for remove action" },
          { status: 400 }
        );
      }
      const index = mockSeats.findIndex((s) => s.userId === userId);
      if (index === -1) {
        return NextResponse.json({ error: `User '${userId}' not found` }, { status: 404 });
      }
      const [removed] = mockSeats.splice(index, 1);
      return NextResponse.json({ removed: true, seat: removed, total: mockSeats.length });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
