import OpenAI from "openai";
import { NextResponse } from "next/server";
import { bumpVersion } from "../../../lib/project-memory";

export const runtime = "nodejs";

// POST /api/deploy
// Body: { projectId: string, action: "prepare"|"verify"|"rollback"|"changelog", context?: object }
export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const { projectId, action, context, buildLogs, currentVersion, targetVersion } = body;

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    if (action === "prepare") {
      // Bump version and generate pre-deploy checklist
      let newVersion: string | null = null;
      try {
        newVersion = await bumpVersion(projectId);
      } catch {
        // Project not found in memory, generate version from context
        newVersion = "1.0.1";
      }

      const r = await client.responses.create({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: "You are a deployment expert. Generate pre-deployment checklists and verify readiness.",
          },
          {
            role: "user",
            content: `Generate a pre-deployment checklist for version ${newVersion}.\nContext: ${JSON.stringify(context ?? {})}`,
          },
        ],
      } as Parameters<typeof client.responses.create>[0]);

      return NextResponse.json({
        ok: true,
        version: newVersion,
        checklist: (r as { output_text?: string }).output_text ?? "",
      });
    }

    if (action === "verify") {
      const r = await client.responses.create({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: "You are a deployment verification expert. Analyze deployment logs and verify success.",
          },
          {
            role: "user",
            content: `Verify this deployment:\nBuild logs:\n${buildLogs ?? "No logs provided"}\n\nContext: ${JSON.stringify(context ?? {})}`,
          },
        ],
      } as Parameters<typeof client.responses.create>[0]);

      return NextResponse.json({
        ok: true,
        verification: (r as { output_text?: string }).output_text ?? "",
      });
    }

    if (action === "rollback") {
      const r = await client.responses.create({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: "You are a rollback expert. Generate rollback procedures for deployments.",
          },
          {
            role: "user",
            content: `Generate rollback procedure from v${currentVersion} to v${targetVersion}.\nContext: ${JSON.stringify(context ?? {})}`,
          },
        ],
      } as Parameters<typeof client.responses.create>[0]);

      return NextResponse.json({
        ok: true,
        rollback_plan: (r as { output_text?: string }).output_text ?? "",
      });
    }

    if (action === "changelog") {
      const r = await client.responses.create({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: "You are a technical writer. Generate clear, user-friendly changelogs and release notes.",
          },
          {
            role: "user",
            content: `Generate a changelog for this release.\nContext: ${JSON.stringify(context ?? {})}`,
          },
        ],
      } as Parameters<typeof client.responses.create>[0]);

      return NextResponse.json({
        ok: true,
        changelog: (r as { output_text?: string }).output_text ?? "",
      });
    }

    return NextResponse.json(
      { error: "action must be prepare, verify, rollback, or changelog" },
      { status: 400 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
