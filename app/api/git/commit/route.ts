import { NextResponse } from "next/server";
import { storeMemory } from "@/lib/memory";

export const runtime = "nodejs";

interface CommitRecord {
  id: string;
  projectId?: string;
  message: string;
  files: string[];
  timestamp: string;
  author?: string;
}

// In-memory commit log (replace with real Git integration in production)
const commitLog: CommitRecord[] = [];

export function getCommitLog(): CommitRecord[] {
  return [...commitLog];
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { message, files, projectId, author } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }
    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: "files array is required" }, { status: 400 });
    }

    const commit: CommitRecord = {
      id: `commit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      projectId,
      message,
      files,
      timestamp: new Date().toISOString(),
      author,
    };

    commitLog.push(commit);

    // Store in project memory if projectId provided
    if (projectId) {
      storeMemory(projectId, "generated_artifact", `commit: ${message}`, {
        commitId: commit.id,
        files,
      });
    }

    return NextResponse.json({ ok: true, commit });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
