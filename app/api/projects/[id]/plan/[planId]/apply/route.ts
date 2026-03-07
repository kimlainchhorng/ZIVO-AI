/**
 * POST /api/projects/[id]/plan/[planId]/apply
 *
 * Phase 2: Apply AI-generated changes, but only if:
 *   1. The plan status is "approved".
 *   2. Every file touched by the patch is declared in plan_json.planned_files.
 *
 * If the patch touches unplanned files the request is rejected with a 422 and
 * a clear error message instructing the caller to create a new plan.
 *
 * Body: { instruction?: string; model?: string }
 *
 * Returns: { buildId, buildNumber, changedFiles } on success.
 *
 * Auth: Bearer token required. Caller must own the project.
 */

import { NextResponse } from "next/server";
import OpenAI from "openai";
import {
  extractBearerToken,
  getUserFromToken,
  getProjectById,
  getProjectFiles,
  getChangePlan,
  updateChangePlan,
  upsertProjectFiles,
  appendProjectBuild,
  appendProjectMessage,
} from "@/lib/db/projects-db";
import { checkFilesAgainstPlan } from "@/lib/plan-guardrail";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string; planId: string }>;
}

const APPLY_SYSTEM_PROMPT = `You are a senior software engineer applying a pre-approved change plan to a Next.js/TypeScript project.
You will be given the plan (steps and planned_files) plus the current file contents.
Apply ONLY the changes described by the plan. Do NOT modify files not listed in planned_files.

Return ONLY a valid JSON array of file objects (no markdown fences):
[
  { "path": "relative/path/to/file.ts", "content": "<full file content>", "action": "create|update|delete" },
  ...
]

Rules:
- For "delete" actions, set content to "".
- Only include files that actually change.
- Preserve existing code style and formatting.`;

export async function POST(req: Request, { params }: RouteParams) {
  const { id: projectId, planId } = await params;

  // ── Auth ──────────────────────────────────────────────────────────────────
  const token = extractBearerToken(req.headers.get("Authorization"));
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── Ownership ─────────────────────────────────────────────────────────────
  const project = await getProjectById(token, projectId);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (project.owner_user_id !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // ── Load and validate plan ────────────────────────────────────────────────
  const plan = await getChangePlan(token, planId);
  if (!plan || plan.project_id !== projectId)
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  if (plan.status !== "approved") {
    return NextResponse.json(
      { error: `Plan must be approved before applying. Current status: ${plan.status}` },
      { status: 409 }
    );
  }

  if (plan.apply_attempts >= plan.max_apply_attempts) {
    return NextResponse.json(
      { error: `Maximum apply attempts (${plan.max_apply_attempts}) reached` },
      { status: 409 }
    );
  }

  // ── Increment apply_attempts ──────────────────────────────────────────────
  await updateChangePlan(token, planId, {
    apply_attempts: plan.apply_attempts + 1,
  });

  // ── Parse optional body ───────────────────────────────────────────────────
  let model = "gpt-4o";
  try {
    const body = (await req.json().catch(() => ({}))) as { model?: unknown };
    if (typeof body.model === "string") model = body.model;
  } catch {
    // use defaults
  }

  // ── Load current project files ────────────────────────────────────────────
  const dbFiles = await getProjectFiles(token, projectId);
  const fileMap = Object.fromEntries(dbFiles.map((f) => [f.path, f.content]));

  // ── Call AI to apply changes ──────────────────────────────────────────────
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const planSummary = [
    `Steps:\n${plan.plan_json.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`,
    `Planned files:\n${plan.plan_json.planned_files.map((f) => `  - ${f}`).join("\n")}`,
  ].join("\n\n");

  const fileContext = dbFiles
    .filter((f) => plan.plan_json.planned_files.includes(f.path))
    .map((f) => `// FILE: ${f.path}\n${f.content}`)
    .join("\n\n---\n\n");

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.1,
    messages: [
      { role: "system", content: APPLY_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Project: ${project.title}\n\nApproved Plan:\n${planSummary}\n\nRelevant current files:\n${fileContext || "(no matching files yet)"}`,
      },
    ],
  });

  let patchedFiles: Array<{ path: string; content: string; action: string }> = [];
  try {
    let raw = completion.choices[0]?.message?.content ?? "[]";
    // Strip markdown fences if present
    raw = raw.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) throw new Error("Expected array");
    patchedFiles = (parsed as Array<{ path: string; content: string; action?: string }>).map((f) => ({
      path: f.path,
      content: f.content ?? "",
      action: f.action ?? "update",
    }));
  } catch {
    await updateChangePlan(token, planId, {
      status: "failed",
      result_json: { error: "AI returned an invalid patch" },
    });
    return NextResponse.json({ error: "AI returned an invalid patch" }, { status: 502 });
  }

  // ── Guardrail: verify all patched files are in planned_files ──────────────
  const touchedPaths = patchedFiles.map((f) => f.path);
  const guardrail = checkFilesAgainstPlan(touchedPaths, plan.plan_json.planned_files);
  if (!guardrail.allowed) {
    await updateChangePlan(token, planId, {
      status: "failed",
      result_json: { error: guardrail.message, unplanned: guardrail.unplanned },
    });
    return NextResponse.json(
      { error: guardrail.message, unplanned: guardrail.unplanned },
      { status: 422 }
    );
  }

  // ── Persist file changes ──────────────────────────────────────────────────
  const toUpsert = patchedFiles.filter((f) => f.action !== "delete");
  if (toUpsert.length > 0) {
    await upsertProjectFiles(
      token,
      projectId,
      toUpsert.map((f) => ({ path: f.path, content: f.content, generated_by: `plan:${planId}` }))
    );
  }

  // Merge patched files back into the full file map for the summary
  for (const f of patchedFiles) {
    if (f.action === "delete") {
      delete fileMap[f.path];
    } else {
      fileMap[f.path] = f.content;
    }
  }

  const buildSummary = `Plan applied: ${plan.plan_json.steps[0] ?? "changes applied"} (${patchedFiles.length} file(s) modified)`;
  const buildRecord = await appendProjectBuild(token, projectId, buildSummary);

  // ── Persist assistant message ─────────────────────────────────────────────
  const changedLines = patchedFiles
    .map((f) => `${f.action ?? "update"}: ${f.path}`)
    .join("\n");
  const assistantContent = [
    buildSummary,
    patchedFiles.length > 0 ? `Changed files:\n${changedLines}` : "",
    `buildId: ${buildRecord.id} (build #${buildRecord.build_number})`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    await appendProjectMessage(token, projectId, user.id, "assistant", assistantContent);
  } catch {
    // Non-fatal
  }

  // ── Mark plan as applied ──────────────────────────────────────────────────
  await updateChangePlan(token, planId, {
    status: "applied",
    result_json: {
      buildId: buildRecord.id,
      buildNumber: buildRecord.build_number,
      changedFiles: patchedFiles.map((f) => ({ action: f.action, path: f.path })),
    },
  });

  return NextResponse.json({
    buildId: buildRecord.id,
    buildNumber: buildRecord.build_number,
    changedFiles: patchedFiles.map((f) => ({ action: f.action, path: f.path })),
    plan: await getChangePlan(token, planId),
  });
}
