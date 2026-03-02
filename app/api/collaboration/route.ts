import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Real-Time Collaboration API
 * GET  /api/collaboration  – list active collaboration sessions
 * POST /api/collaboration  – create a new collaboration session
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  return NextResponse.json({
    ok: true,
    sessions: [],
    activeParticipants: 0,
    projectId,
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { projectId, ownerId, participants } = body as {
    projectId?: string;
    ownerId?: string;
    participants?: string[];
  };

  if (!projectId || !ownerId) {
    return NextResponse.json({ error: "projectId and ownerId required" }, { status: 400 });
  }

  const sessionId = crypto.randomUUID();

  // TODO: spin up WebSocket room, initialise CRDT state, invite participants
  return NextResponse.json({
    ok: true,
    session: {
      id: sessionId,
      projectId,
      ownerId,
      participants: participants ?? [],
      wsUrl: `/api/collaboration/ws/${sessionId}`,
      createdAt: new Date().toISOString(),
    },
  });
}
