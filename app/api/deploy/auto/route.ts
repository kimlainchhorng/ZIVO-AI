import { NextResponse } from "next/server";
import { DevOpsAgent } from "@/agents/devops-agent";
import { updateProjectMemory } from "@/lib/memory";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const { projectId, target, appDescription, environmentVariables, options } = body;

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }
    if (!target || !["vercel", "docker", "custom"].includes(target)) {
      return NextResponse.json(
        { error: "target must be one of: vercel, docker, custom" },
        { status: 400 }
      );
    }
    if (!appDescription || typeof appDescription !== "string") {
      return NextResponse.json({ error: "appDescription is required" }, { status: 400 });
    }

    const agent = new DevOpsAgent(apiKey);
    const result = await agent.generateConfig({
      projectId,
      target,
      appDescription,
      environmentVariables,
      options,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error, raw: result.raw }, { status: 422 });
    }

    updateProjectMemory(projectId, {
      deploymentHistory: [
        {
          id: `deploy-${Date.now()}`,
          target,
          status: "pending",
          timestamp: new Date().toISOString(),
        },
      ],
    });

    return NextResponse.json({ ok: true, config: result.config });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
