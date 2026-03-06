/**
 * POST /api/projects/[id]/plan
 *
 * Phase 1: AI generates a change plan (steps, planned_files, checklist, risks)
 * without modifying any project files.  Returns { planId }.
 *
 * Body: { instruction: string }
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
  createChangePlan,
  type PlanJson,
} from "@/lib/db/projects-db";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const PLAN_SYSTEM_PROMPT = `You are a senior software engineer working on a Next.js/TypeScript project.
Given a user instruction and the current project file list, produce a detailed change plan.

Return ONLY a valid JSON object (no markdown fences):
{
  "steps": ["step 1 description", "step 2 description", ...],
  "planned_files": ["path/to/file1.ts", "path/to/file2.tsx", ...],
  "checklist": ["item 1 to verify after applying", "item 2", ...],
  "risks": ["potential risk 1", "potential risk 2", ...]
}

Rules:
- planned_files MUST list every file that will be created, modified, or deleted.
- steps should be concise and action-oriented.
- checklist should include testable acceptance criteria.
- risks should flag anything that could break existing functionality.`;

export async function POST(req: Request, { params }: RouteParams) {
  const { id: projectId } = await params;

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

  // ── Parse body ────────────────────────────────────────────────────────────
  let instruction = "";
  try {
    const body = (await req.json().catch(() => ({}))) as { instruction?: unknown };
    if (typeof body.instruction === "string") instruction = body.instruction.trim();
  } catch {
    // fall through with empty instruction
  }
  if (!instruction) {
    return NextResponse.json({ error: "instruction is required" }, { status: 400 });
  }

  // ── Load current file list ────────────────────────────────────────────────
  const dbFiles = await getProjectFiles(token, projectId);
  const fileList = dbFiles.map((f) => f.path).join("\n");

  // ── Call AI to generate plan ──────────────────────────────────────────────
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: PLAN_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Project: ${project.title}\n\nInstruction: ${instruction}\n\nCurrent files:\n${fileList || "(no files yet)"}`,
      },
    ],
  });

  let planJson: PlanJson;
  try {
    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as Partial<PlanJson>;
    planJson = {
      steps: Array.isArray(parsed.steps) ? (parsed.steps as string[]) : [],
      planned_files: Array.isArray(parsed.planned_files) ? (parsed.planned_files as string[]) : [],
      checklist: Array.isArray(parsed.checklist) ? (parsed.checklist as string[]) : [],
      risks: Array.isArray(parsed.risks) ? (parsed.risks as string[]) : [],
    };
  } catch {
    return NextResponse.json({ error: "AI returned an invalid plan" }, { status: 502 });
  }

  // ── Persist plan ──────────────────────────────────────────────────────────
  const plan = await createChangePlan(token, projectId, user.id, planJson);

  return NextResponse.json({ planId: plan.id, plan }, { status: 201 });
}
