import { NextResponse } from "next/server";
import { runAgent, runAgentWithTools } from "@/lib/agent-runner";
import { updateShortTerm, recordDecision } from "@/lib/memory";
import type { AgentRole, AgentResponse, ReasoningStep } from "@/lib/types";

export const runtime = "nodejs";

const VALID_ROLES: AgentRole[] = [
  "architect",
  "ui",
  "backend",
  "database",
  "security",
  "performance",
  "devops",
  "code-review",
];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ agent: string }> }
) {
  try {
    const { agent } = await params;
    const role = agent as AgentRole;

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Unknown agent: ${agent}. Valid agents: ${VALID_ROLES.join(", ")}` },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      message,
      projectId = "default",
      context,
      useTools = false,
      enabledTools,
      conversationHistory = [],
    } = body as {
      message?: string;
      projectId?: string;
      context?: string;
      useTools?: boolean;
      enabledTools?: string[];
      conversationHistory?: Array<{ role: string; content: string }>;
    };

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    // Record request in memory
    updateShortTerm(projectId, { role: "user", content: message }, role);

    let response: AgentResponse;
    let steps: ReasoningStep[];

    if (useTools) {
      const result = await runAgentWithTools(
        role,
        message,
        context,
        conversationHistory as Array<{ role: "system" | "user" | "assistant"; content: string }>,
        enabledTools
      );
      response = result.response;
      steps = result.steps;
    } else {
      response = await runAgent(
        role,
        message,
        context,
        conversationHistory as Array<{ role: "system" | "user" | "assistant"; content: string }>
      );
      steps = [];
    }

    // Record assistant response in memory
    updateShortTerm(
      projectId,
      { role: "assistant", content: JSON.stringify(response.output) },
      role
    );

    // Record any decisions in long-term memory
    if (response.output.decisions && Array.isArray(response.output.decisions)) {
      for (const d of response.output.decisions as Array<{ decision: string; rationale: string }>) {
        if (d.decision && d.rationale) {
          recordDecision(projectId, role, d.decision, d.rationale);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      agent: role,
      projectId,
      response,
      steps,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Agent error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
