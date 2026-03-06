import { NextResponse } from "next/server";
import {
  extractBearerToken,
  getUserFromToken,
  getProjectMessages,
  appendProjectMessage,
} from "@/lib/db/projects-db";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** GET /api/projects/[id]/messages — list conversation messages for a project. */
export async function GET(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const token = extractBearerToken(req.headers.get("Authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const messages = await getProjectMessages(token, id);
    return NextResponse.json({ messages });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message ?? "Failed to get messages" },
      { status: 500 }
    );
  }
}

/** POST /api/projects/[id]/messages — append a message to the project conversation. */
export async function POST(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const token = extractBearerToken(req.headers.get("Authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { role?: unknown; content?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const role = body.role;
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (role !== "user" && role !== "assistant" && role !== "system") {
    return NextResponse.json({ error: "role must be user|assistant|system" }, { status: 400 });
  }
  if (!content) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  try {
    const message = await appendProjectMessage(token, id, user.id, role, content);
    return NextResponse.json({ message }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message ?? "Failed to append message" },
      { status: 500 }
    );
  }
}
