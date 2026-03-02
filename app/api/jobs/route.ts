import { NextResponse } from "next/server";
import { createJob, getJob, listJobs, runInBackground } from "@/lib/jobs";
import { runAgent } from "@/lib/agent-runner";
import type { AgentRole } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");

  if (jobId) {
    const job = getJob(jobId);
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    return NextResponse.json({ ok: true, job });
  }

  return NextResponse.json({ ok: true, jobs: listJobs() });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const { type, payload } = body as {
      type?: string;
      payload?: Record<string, unknown>;
    };

    if (!type) {
      return NextResponse.json({ error: "type is required" }, { status: 400 });
    }

    const job = createJob();

    switch (type) {
      case "agent_task": {
        const { agent, message, context } = (payload ?? {}) as {
          agent?: string;
          message?: string;
          context?: string;
        };
        if (!agent || !message) {
          return NextResponse.json({ error: "agent and message required in payload" }, { status: 400 });
        }

        runInBackground(job.jobId, async (updateProgress) => {
          updateProgress(10);
          const response = await runAgent(agent as AgentRole, message, context);
          updateProgress(90);
          return response;
        });
        break;
      }

      case "multi_agent_pipeline": {
        const { agents, task, context } = (payload ?? {}) as {
          agents?: string[];
          task?: string;
          context?: string;
        };
        if (!task) {
          return NextResponse.json({ error: "task required in payload" }, { status: 400 });
        }

        const agentList = (agents ?? ["architect", "ui", "backend"]) as AgentRole[];

        runInBackground(job.jobId, async (updateProgress) => {
          const results: Record<string, unknown> = {};
          let ctx = context ?? "";

          for (let i = 0; i < agentList.length; i++) {
            const role = agentList[i];
            updateProgress(Math.round(((i + 1) / agentList.length) * 90));
            const response = await runAgent(role, task, ctx);
            results[role] = response.output;
            ctx += `\n\n${role}: ${JSON.stringify(response.output)}`;
          }

          return results;
        });
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown job type: ${type}` }, { status: 400 });
    }

    return NextResponse.json({ ok: true, job, message: "Job started in background" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Job error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
