// app/api/apply-patch/route.ts — Apply patch files to an existing project file map

import { NextResponse } from "next/server";
import {
  applyPatch,
  computeDiffStats,
  generateUnifiedDiff,
  type PatchFile,
} from "../../../lib/patch-engine";

export const runtime = "nodejs";

interface ApplyPatchRequest {
  patches: PatchFile[];
  existingFiles: Record<string, string>;
}

interface ApplyPatchResponse {
  applied: Record<string, string>;
  stats: ReturnType<typeof computeDiffStats>;
  diffs: Record<string, string>;
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json().catch(() => ({}))) as Partial<ApplyPatchRequest>;

    const { patches, existingFiles } = body;

    if (!Array.isArray(patches) || patches.length === 0) {
      return NextResponse.json(
        { error: "Missing or empty 'patches' array" },
        { status: 400 }
      );
    }

    if (
      typeof existingFiles !== "object" ||
      existingFiles === null ||
      Array.isArray(existingFiles)
    ) {
      return NextResponse.json(
        { error: "'existingFiles' must be a non-null object" },
        { status: 400 }
      );
    }

    // Validate every patch entry
    const invalid = patches.filter(
      (p) =>
        typeof p.path !== "string" ||
        p.path.trim() === "" ||
        typeof p.content !== "string" ||
        !["create", "update", "delete"].includes(p.action)
    );
    if (invalid.length > 0) {
      return NextResponse.json(
        {
          error: `${invalid.length} patch file(s) are missing required fields (path, content, action)`,
        },
        { status: 400 }
      );
    }

    // Generate diffs for each patch relative to existing files
    const diffs: Record<string, string> = {};
    for (const patch of patches) {
      if (patch.action !== "delete") {
        const oldContent = existingFiles[patch.path] ?? "";
        const diff =
          patch.diff ?? generateUnifiedDiff(oldContent, patch.content, patch.path);
        if (diff) {
          diffs[patch.path] = diff;
        }
      }
    }

    const applied = applyPatch(existingFiles, patches);
    const stats = computeDiffStats(patches, existingFiles);

    const response: ApplyPatchResponse = { applied, stats, diffs };
    return NextResponse.json(response);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
