export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

interface SnapshotMetadata {
  files: number;
  version: string;
}

interface Snapshot {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  sizeBytes: number;
  metadata: SnapshotMetadata;
}

const mockSnapshots: Snapshot[] = [
  {
    id: "snap_001",
    name: "Pre-deployment v2.3",
    description: "Snapshot taken before the v2.3 agent pipeline refactor.",
    createdAt: "2026-01-10T06:00:00Z",
    sizeBytes: 10485760,
    metadata: { files: 142, version: "2.3.0" },
  },
  {
    id: "snap_002",
    name: "Post-migration checkpoint",
    description: "Stable state after database schema migration to v4.",
    createdAt: "2026-02-14T12:00:00Z",
    sizeBytes: 20971520,
    metadata: { files: 189, version: "2.3.5" },
  },
  {
    id: "snap_003",
    name: "Feature branch merge",
    description: "Snapshot after merging the knowledge-base feature branch into main.",
    createdAt: "2026-03-01T09:30:00Z",
    sizeBytes: 15728640,
    metadata: { files: 203, version: "2.4.0" },
  },
];

export async function GET() {
  try {
    return NextResponse.json({ snapshots: mockSnapshots });
  } catch {
    return NextResponse.json({ error: "Failed to fetch snapshots" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body as { name?: string; description?: string };

    if (!name) {
      return NextResponse.json({ error: "Missing required field: name" }, { status: 400 });
    }

    const newSnapshot: Snapshot = {
      id: `snap_${randomUUID().slice(0, 8)}`,
      name,
      description: description ?? "",
      createdAt: new Date().toISOString(),
      sizeBytes: Math.floor(Math.random() * 30000000) + 5000000,
      metadata: { files: Math.floor(Math.random() * 100) + 100, version: "2.4.1" },
    };

    return NextResponse.json({ snapshot: newSnapshot, success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create snapshot" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body as { id?: string; action?: string };

    if (!id || !action) {
      return NextResponse.json(
        { error: "Missing required fields: id, action" },
        { status: 400 }
      );
    }

    if (action !== "restore") {
      return NextResponse.json(
        { error: 'Invalid action. Only "restore" is supported' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, restored: id });
  } catch {
    return NextResponse.json({ error: "Failed to restore snapshot" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing required query param: id" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete snapshot" }, { status: 500 });
  }
}
