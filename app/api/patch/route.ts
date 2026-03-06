// POST { prompt: string; files: FileEntry[]; model?: string }
// Returns { patches: FilePatch[]; thinking: string; summary: string }
import { NextResponse } from "next/server";
import { generatePatchesFromPrompt } from "@/lib/ai/diff-patcher";
import type { FileEntry } from "@/lib/ai/file-map";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({})) as { prompt?: string; files?: FileEntry[]; model?: string };
    const { prompt, files = [], model } = body;
    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }
    const filesWithContent = files
      .filter((f): f is FileEntry & { content: string } => typeof f.content === "string")
      .map((f) => ({ path: f.path, content: f.content }));
    const result = await generatePatchesFromPrompt(prompt, filesWithContent, model);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error)?.message ?? "Server error" }, { status: 500 });
  }
}
