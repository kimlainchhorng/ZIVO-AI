import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface CollabUser {
  userId: string;
  userName: string;
  joinedAt: string;
  cursorPosition?: { x: number; y: number };
}

interface CollabComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
  resolved: boolean;
}

interface CollabRoom {
  roomId: string;
  users: CollabUser[];
  comments: CollabComment[];
  lastActivity: string;
}

type CollabAction = "join" | "leave" | "update" | "comment";

interface CollabBody {
  action: CollabAction;
  roomId: string;
  userId: string;
  userName: string;
  data?: {
    cursorPosition?: { x: number; y: number };
    content?: string;
    [key: string]: unknown;
  };
}

// In-memory store — intentional per spec; data is ephemeral and does not
// persist across server restarts. For production use, swap with Redis or a DB.
const rooms = new Map<string, CollabRoom>();

function getOrCreateRoom(roomId: string): CollabRoom {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { roomId, users: [], comments: [], lastActivity: new Date().toISOString() });
  }
  return rooms.get(roomId)!;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");
  if (!roomId) {
    return NextResponse.json({ error: "Missing query param: roomId" }, { status: 400 });
  }
  const room = rooms.get(roomId);
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  return NextResponse.json({ room });
}

export async function POST(req: Request) {
  const body: CollabBody = await req.json().catch(() => ({} as CollabBody));
  const { action, roomId, userId, userName, data } = body;

  if (!action || !roomId || !userId || !userName) {
    return NextResponse.json(
      { error: "Missing required fields: action, roomId, userId, userName" },
      { status: 400 }
    );
  }

  const room = getOrCreateRoom(roomId);
  room.lastActivity = new Date().toISOString();

  if (action === "join") {
    const alreadyIn = room.users.some((u) => u.userId === userId);
    if (!alreadyIn) {
      room.users.push({ userId, userName, joinedAt: new Date().toISOString() });
    }
    return NextResponse.json({ ok: true, room });
  }

  if (action === "leave") {
    room.users = room.users.filter((u) => u.userId !== userId);
    return NextResponse.json({ ok: true, room });
  }

  if (action === "update") {
    const user = room.users.find((u) => u.userId === userId);
    if (user && data?.cursorPosition) {
      user.cursorPosition = data.cursorPosition;
    }
    return NextResponse.json({ ok: true, room });
  }

  if (action === "comment") {
    const content = data?.content;
    if (!content) {
      return NextResponse.json({ error: "Missing data.content for comment action" }, { status: 400 });
    }
    const comment: CollabComment = {
      id: crypto.randomUUID(),
      userId,
      userName,
      content,
      timestamp: new Date().toISOString(),
      resolved: false,
    };
    room.comments.push(comment);
    return NextResponse.json({ ok: true, comment, room });
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}
