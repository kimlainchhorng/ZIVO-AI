// lib/diff-engine.ts — Patch/Diff System using line-level LCS algorithm

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DiffHunk {
  type: "add" | "remove" | "context";
  lineNumber: number;
  content: string;
}

export interface DiffResult {
  hunks: DiffHunk[];
  additions: number;
  deletions: number;
}

// ─── LCS-based diff algorithm ─────────────────────────────────────────────────

/**
 * Computes the longest common subsequence of two string arrays.
 */
function lcs(a: string[], b: string[]): string[] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find the LCS
  const result: string[] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      result.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  return result;
}

/**
 * Computes unified diffs between old and new file content using line-level LCS.
 * Returns an array of DiffHunk objects describing each changed line.
 */
export function computeDiff(oldContent: string, newContent: string): DiffHunk[] {
  const oldLines = oldContent.split("\n");
  const newLines = newContent.split("\n");
  const common = lcs(oldLines, newLines);

  const hunks: DiffHunk[] = [];
  let oi = 0;
  let ni = 0;
  let ci = 0;
  let lineNumber = 1;

  while (oi < oldLines.length || ni < newLines.length) {
    if (ci < common.length && oi < oldLines.length && oldLines[oi] === common[ci] && ni < newLines.length && newLines[ni] === common[ci]) {
      // Context line (unchanged)
      hunks.push({ type: "context", lineNumber, content: oldLines[oi] });
      oi++;
      ni++;
      ci++;
      lineNumber++;
    } else if (ni < newLines.length && (ci >= common.length || newLines[ni] !== common[ci])) {
      // Added line
      hunks.push({ type: "add", lineNumber, content: newLines[ni] });
      ni++;
      lineNumber++;
    } else if (oi < oldLines.length && (ci >= common.length || oldLines[oi] !== common[ci])) {
      // Removed line
      hunks.push({ type: "remove", lineNumber, content: oldLines[oi] });
      oi++;
    } else {
      break;
    }
  }

  return hunks;
}

/**
 * Applies a diff (array of DiffHunks) back to a base string.
 * Context and add hunks contribute to the output; remove hunks are skipped.
 */
export function applyPatch(base: string, patch: DiffHunk[]): string {
  const lines: string[] = [];
  for (const hunk of patch) {
    if (hunk.type === "add" || hunk.type === "context") {
      lines.push(hunk.content);
    }
    // remove hunks are excluded from the output
  }
  return lines.join("\n");
}

/**
 * Formats a diff as standard unified diff output.
 */
export function formatUnifiedDiff(filename: string, hunks: DiffHunk[]): string {
  const lines: string[] = [
    `--- a/${filename}`,
    `+++ b/${filename}`,
    `@@ -1 +1 @@`,
  ];

  for (const hunk of hunks) {
    if (hunk.type === "add") {
      lines.push(`+${hunk.content}`);
    } else if (hunk.type === "remove") {
      lines.push(`-${hunk.content}`);
    } else {
      lines.push(` ${hunk.content}`);
    }
  }

  return lines.join("\n");
}
