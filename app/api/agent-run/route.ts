export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

type AgentName = "orchestrator" | "researcher" | "coder" | "reviewer";

const VALID_AGENTS: AgentName[] = ["orchestrator", "researcher", "coder", "reviewer"];

const mockResults: Record<AgentName, (task: string) => string> = {
  orchestrator: (task) =>
    `Orchestrator coordinated 3 sub-agents to complete: "${task}". Pipeline: researcher → coder → reviewer. All steps finished successfully with no conflicts detected.`,
  researcher: (task) =>
    `Researcher found 12 relevant sources for: "${task}". Key findings: (1) Latest patterns suggest async-first design, (2) Three authoritative references confirmed the approach, (3) No conflicting data found.`,
  coder: (task) =>
    `Coder generated a solution for: "${task}". Produced 84 lines of TypeScript with full type coverage, unit test scaffolding, and inline documentation. No lint errors detected.`,
  reviewer: (task) =>
    `Reviewer analyzed the output for: "${task}". Score: 94/100. Issues found: 1 minor naming inconsistency, 1 missing edge-case guard. Suggestions provided inline.`,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentName, task, context } = body as {
      agentName?: string;
      task?: string;
      context?: string;
    };

    if (!agentName || !task) {
      return NextResponse.json(
        { error: "Missing required fields: agentName, task" },
        { status: 400 }
      );
    }

    if (!VALID_AGENTS.includes(agentName as AgentName)) {
      return NextResponse.json(
        {
          error: `Invalid agentName. Must be one of: ${VALID_AGENTS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const agent = agentName as AgentName;
    const durationMs = Math.floor(Math.random() * 1800) + 400;
    const tokensUsed = Math.floor(Math.random() * 1200) + 300;

    return NextResponse.json({
      result: mockResults[agent](task),
      agentName: agent,
      task,
      context: context ?? null,
      tokensUsed,
      durationMs,
      success: true,
    });
  } catch {
    return NextResponse.json({ error: "Failed to run agent" }, { status: 500 });
  }
}
