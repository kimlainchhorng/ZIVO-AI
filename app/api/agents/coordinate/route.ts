import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface GeneratedFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

interface CoordinateBody {
  files?: GeneratedFile[];
  task?: string;
  agents?: string[];
}

const ALL_AGENTS = ["Architect", "Frontend", "Backend", "Database", "Debug"];

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as CoordinateBody;
  const { files = [], task = "Analyze and improve the project", agents = ALL_AGENTS } = body;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      for (const agent of agents) {
        send({ agent, status: "thinking", message: `${agent} agent analyzing project...` });
        // Simulate agent work
        await new Promise((r) => setTimeout(r, 200));
        send({ agent, status: "working", message: `${agent} agent processing ${files.length} files for task: ${task}` });
        await new Promise((r) => setTimeout(r, 300));
        send({ agent, status: "done", message: `${agent} agent completed analysis.` });
      }

      send({ agent: "Coordinator", status: "done", message: "All agents completed. Project analysis done.", files });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export async function GET() {
  return NextResponse.json({ agents: ALL_AGENTS, status: "ready" });
}
