import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { ExtendedProjectMemory, MemoryDecision, MemoryChange } from "@/lib/memory/project-memory";

export const runtime = "nodejs";

const MEMORY_DIR = "/tmp/memory";

function ensureDir(): void {
  if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });
}

function memoryPath(projectId: string): string {
  return path.join(MEMORY_DIR, `${projectId}.json`);
}

function loadMemory(projectId: string): ExtendedProjectMemory {
  try {
    const raw = fs.readFileSync(memoryPath(projectId), "utf-8");
    return JSON.parse(raw) as ExtendedProjectMemory;
  } catch {
    return { projectId, techStack: [], conventions: [], decisions: [], recentChanges: [] };
  }
}

function saveMemory(memory: ExtendedProjectMemory): void {
  ensureDir();
  fs.writeFileSync(memoryPath(memory.projectId), JSON.stringify(memory, null, 2), "utf-8");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const memory = loadMemory(projectId);
  return NextResponse.json(memory);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  const body = (await req.json().catch(() => ({}))) as {
    action?: "remember" | "recall";
    type?: "decision" | "convention" | "change";
    data?: unknown;
    query?: string;
  };

  const { action } = body;

  if (action === "recall") {
    const query = (body.query ?? "").toLowerCase();
    const memory = loadMemory(projectId);

    const all: string[] = [
      ...memory.conventions,
      ...memory.decisions.map((d: MemoryDecision) => `${d.decision}: ${d.reason}`),
      ...memory.recentChanges.map(
        (c: MemoryChange) => `Changed: ${c.summary} (${c.files.join(", ")})`
      ),
    ];

    const relevant = query
      ? all.filter((item) => item.toLowerCase().includes(query))
      : all;

    return NextResponse.json({
      results: relevant.slice(0, 10),
    });
  }

  if (action === "remember") {
    const memory = loadMemory(projectId);
    const { type, data } = body;

    if (type === "decision") {
      const d = data as { decision: string; reason: string };
      memory.decisions.push({ timestamp: new Date().toISOString(), decision: d.decision, reason: d.reason });
    } else if (type === "convention") {
      memory.conventions.push(String(data));
    } else if (type === "change") {
      const c = data as { summary: string; files: string[] };
      memory.recentChanges.push({ timestamp: new Date().toISOString(), summary: c.summary, files: c.files });
      if (memory.recentChanges.length > 20) memory.recentChanges.shift();
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    saveMemory(memory);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
