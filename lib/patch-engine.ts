// lib/patch-engine.ts — Diff patch engine for surgical file updates

import { stripMarkdownFences } from "./code-parser";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PatchFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
  diff?: string; // unified diff string
}

export interface PatchStats {
  filesCreated: number;
  filesUpdated: number;
  filesDeleted: number;
  totalLinesAdded: number;
  totalLinesRemoved: number;
}

// ─── Unified diff generation ──────────────────────────────────────────────────

/**
 * Generates a unified diff string from old and new content for a given file path.
 * Uses a line-by-line longest-common-subsequence approach.
 */
export function generateUnifiedDiff(
  oldContent: string,
  newContent: string,
  filePath: string
): string {
  const oldLines = oldContent ? oldContent.split("\n") : [];
  const newLines = newContent ? newContent.split("\n") : [];

  if (oldContent === newContent) return "";

  const lcsMatrix = _buildLcsMatrix(oldLines, newLines);
  const hunks = _buildHunks(oldLines, newLines, lcsMatrix);

  if (hunks.length === 0) return "";

  const header = `--- a/${filePath}\n+++ b/${filePath}`;
  return header + "\n" + hunks.join("\n");
}

/** Build LCS DP table for two arrays of strings. */
function _buildLcsMatrix(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0)
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp;
}

type EditOp = { type: "equal" | "insert" | "delete"; line: string };

/** Backtrack through the LCS matrix to produce edit operations. */
function _buildEditScript(
  oldLines: string[],
  newLines: string[],
  dp: number[][]
): EditOp[] {
  const ops: EditOp[] = [];
  let i = oldLines.length;
  let j = newLines.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      ops.push({ type: "equal", line: oldLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ type: "insert", line: newLines[j - 1] });
      j--;
    } else {
      ops.push({ type: "delete", line: oldLines[i - 1] });
      i--;
    }
  }

  return ops.reverse();
}

const CONTEXT_LINES = 3;

/** Convert edit operations into unified diff hunk strings. */
function _buildHunks(
  oldLines: string[],
  newLines: string[],
  dp: number[][]
): string[] {
  const ops = _buildEditScript(oldLines, newLines, dp);
  const hunks: string[] = [];

  // Track positions in old and new files
  let oldPos = 0;
  let newPos = 0;

  // Find ranges of changes with context
  const changeRanges: Array<{ start: number; end: number }> = [];
  let inChange = false;
  let changeStart = 0;

  for (let k = 0; k < ops.length; k++) {
    if (ops[k].type !== "equal") {
      if (!inChange) {
        inChange = true;
        changeStart = Math.max(0, k - CONTEXT_LINES);
      }
    } else if (inChange) {
      const contextEnd = Math.min(ops.length - 1, k + CONTEXT_LINES - 1);
      const nextChange = ops.slice(k).findIndex((o) => o.type !== "equal");
      if (nextChange === -1 || nextChange > CONTEXT_LINES * 2) {
        changeRanges.push({ start: changeStart, end: contextEnd });
        inChange = false;
      }
    }
  }
  if (inChange) {
    changeRanges.push({
      start: changeStart,
      end: Math.min(ops.length - 1, ops.length - 1 + CONTEXT_LINES),
    });
  }

  for (const range of changeRanges) {
    const hunkOps = ops.slice(range.start, range.end + 1);

    // Calculate old and new line ranges for the @@ header
    let hunkOldStart = 1;
    let hunkNewStart = 1;
    let prevOld = 0;
    let prevNew = 0;

    for (let k = 0; k < range.start; k++) {
      if (ops[k].type === "equal" || ops[k].type === "delete") prevOld++;
      if (ops[k].type === "equal" || ops[k].type === "insert") prevNew++;
    }
    hunkOldStart = prevOld + 1;
    hunkNewStart = prevNew + 1;
    oldPos = prevOld;
    newPos = prevNew;

    let oldCount = 0;
    let newCount = 0;
    const lines: string[] = [];

    for (const op of hunkOps) {
      if (op.type === "equal") {
        lines.push(` ${op.line}`);
        oldCount++;
        newCount++;
      } else if (op.type === "insert") {
        lines.push(`+${op.line}`);
        newCount++;
      } else {
        lines.push(`-${op.line}`);
        oldCount++;
      }
    }

    hunks.push(
      `@@ -${hunkOldStart},${oldCount} +${hunkNewStart},${newCount} @@\n${lines.join("\n")}`
    );
    oldPos += oldCount;
    newPos += newCount;
  }

  return hunks;
}

// ─── Patch application ────────────────────────────────────────────────────────

/**
 * Merges a set of patch files into an existing file map.
 * - 'create': adds or overwrites the file
 * - 'update': adds or overwrites the file
 * - 'delete': removes the file from the map
 */
export function applyPatch(
  existingFiles: Record<string, string>,
  patches: PatchFile[]
): Record<string, string> {
  const result: Record<string, string> = { ...existingFiles };

  for (const patch of patches) {
    if (patch.action === "delete") {
      delete result[patch.path];
    } else {
      result[patch.path] = patch.content;
    }
  }

  return result;
}

// ─── Diff statistics ──────────────────────────────────────────────────────────

/**
 * Computes statistics for a set of patches relative to existing files.
 */
export function computeDiffStats(
  patches: PatchFile[],
  existingFiles: Record<string, string>
): PatchStats {
  let filesCreated = 0;
  let filesUpdated = 0;
  let filesDeleted = 0;
  let totalLinesAdded = 0;
  let totalLinesRemoved = 0;

  for (const patch of patches) {
    if (patch.action === "delete") {
      filesDeleted++;
      const old = existingFiles[patch.path] ?? "";
      totalLinesRemoved += old ? old.split("\n").length : 0;
    } else if (patch.action === "create" && !(patch.path in existingFiles)) {
      filesCreated++;
      totalLinesAdded += patch.content ? patch.content.split("\n").length : 0;
    } else {
      filesUpdated++;
      const oldContent = existingFiles[patch.path] ?? "";
      const diff = patch.diff ?? generateUnifiedDiff(oldContent, patch.content, patch.path);
      for (const line of diff.split("\n")) {
        if (line.startsWith("+") && !line.startsWith("+++")) totalLinesAdded++;
        else if (line.startsWith("-") && !line.startsWith("---")) totalLinesRemoved++;
      }
    }
  }

  return { filesCreated, filesUpdated, filesDeleted, totalLinesAdded, totalLinesRemoved };
}

// ─── AI response parsing ──────────────────────────────────────────────────────

/**
 * Parses an AI JSON response into an array of PatchFile objects.
 * Reuses `stripMarkdownFences` from lib/code-parser.ts.
 */
export function parsePatchResponse(aiResponse: string): PatchFile[] {
  const cleaned = stripMarkdownFences(aiResponse);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("AI patch response does not contain valid JSON");
    }
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      throw new Error("Failed to parse JSON from AI patch response");
    }
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("files" in parsed) ||
    !Array.isArray((parsed as Record<string, unknown>).files)
  ) {
    throw new Error("AI patch response missing required 'files' array");
  }

  const raw = (parsed as { files: unknown[] }).files;
  const patches: PatchFile[] = [];

  for (const item of raw) {
    if (
      item &&
      typeof item === "object" &&
      typeof (item as Record<string, unknown>).path === "string" &&
      typeof (item as Record<string, unknown>).content === "string" &&
      typeof (item as Record<string, unknown>).action === "string" &&
      ["create", "update", "delete"].includes(
        (item as Record<string, unknown>).action as string
      )
    ) {
      const f = item as Record<string, unknown>;
      patches.push({
        path: f.path as string,
        content: f.content as string,
        action: f.action as "create" | "update" | "delete",
        diff: typeof f.diff === "string" ? f.diff : undefined,
      });
    }
  }

  return patches;
}
