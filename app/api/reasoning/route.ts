import { NextResponse } from "next/server";
import { runAgent } from "@/lib/agent-runner";
import { getOrCreateMemory, setCurrentTask, recordDecision } from "@/lib/memory";
import type { AgentRole, ReasoningStep, DependencyGraph } from "@/lib/types";

export const runtime = "nodejs";

const AGENT_SEQUENCE: AgentRole[] = [
  "architect",
  "database",
  "backend",
  "ui",
  "security",
  "performance",
];

interface ReasoningChain {
  chainId: string;
  projectId: string;
  task: string;
  graph: DependencyGraph;
  status: "running" | "completed" | "failed";
  startedAt: string;
  completedAt?: string;
}

// In-memory store for chains
const chainStore = new Map<string, ReasoningChain>();

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      task,
      projectId = "default",
      agents = AGENT_SEQUENCE,
    } = body as { task?: string; projectId?: string; agents?: AgentRole[] };

    if (!task || typeof task !== "string") {
      return NextResponse.json({ error: "task is required" }, { status: 400 });
    }

    const chainId = `chain-${Date.now()}`;
    const memory = getOrCreateMemory(projectId);
    setCurrentTask(projectId, task);

    // Build initial dependency graph
    const steps: ReasoningStep[] = agents.map((role, i) => ({
      id: `step-${i + 1}`,
      agentRole: role,
      thought: `${role} agent will process the task`,
      dependencies: i > 0 ? [`step-${i}`] : [],
      status: "pending" as const,
    }));

    const chain: ReasoningChain = {
      chainId,
      projectId,
      task,
      graph: { steps },
      status: "running",
      startedAt: new Date().toISOString(),
    };
    chainStore.set(chainId, chain);

    // Build context from long-term memory
    const ctx = memory.longTerm.architecture
      ? `Architecture: ${memory.longTerm.architecture}\nTech Stack: ${(memory.longTerm.techStack ?? []).join(", ")}`
      : undefined;

    const results: Record<string, unknown> = {};
    let cumulativeContext = ctx ?? "";

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      step.status = "running";
      step.startedAt = new Date().toISOString();

      try {
        const agentMsg = `Task: ${task}${cumulativeContext ? `\n\nContext from previous agents:\n${cumulativeContext}` : ""}`;
        const response = await runAgent(step.agentRole, agentMsg, cumulativeContext);

        step.status = "completed";
        step.completedAt = new Date().toISOString();
        step.thought = response.reasoning;
        results[step.agentRole] = response.output;

        // Feed output into next agent's context
        cumulativeContext += `\n\n### ${step.agentRole} Agent Output:\n${JSON.stringify(response.output, null, 2)}`;

        // Record decisions from architect
        if (step.agentRole === "architect" && Array.isArray(response.output.decisions)) {
          for (const d of response.output.decisions as Array<{ decision: string; rationale: string }>) {
            if (d.decision) recordDecision(projectId, step.agentRole, d.decision, d.rationale ?? "");
          }
        }
      } catch (err: unknown) {
        step.status = "failed";
        step.completedAt = new Date().toISOString();
        step.thought = `Error: ${err instanceof Error ? err.message : String(err)}`;
      }
    }

    chain.status = "completed";
    chain.completedAt = new Date().toISOString();

    return NextResponse.json({
      ok: true,
      chainId,
      projectId,
      task,
      graph: chain.graph,
      results,
      completedAt: chain.completedAt,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Reasoning error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const chainId = searchParams.get("chainId");

  if (chainId) {
    const chain = chainStore.get(chainId);
    if (!chain) return NextResponse.json({ error: "Chain not found" }, { status: 404 });
    return NextResponse.json({ ok: true, chain });
  }

  return NextResponse.json({
    ok: true,
    chains: Array.from(chainStore.values()),
  });
}
