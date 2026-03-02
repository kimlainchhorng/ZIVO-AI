import type { DiffChunk, FileDiff } from "./types";

/** Compute a line-level diff between two strings */
export function computeDiff(before: string, after: string, filePath = ""): FileDiff {
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  const chunks: DiffChunk[] = [];
  const patch: string[] = [`--- ${filePath} (before)`, `+++ ${filePath} (after)`];

  // Simple LCS-based diff
  const lcs = computeLCS(beforeLines, afterLines);
  let bi = 0;
  let ai = 0;
  let li = 0;

  while (bi < beforeLines.length || ai < afterLines.length) {
    if (
      bi < beforeLines.length &&
      ai < afterLines.length &&
      li < lcs.length &&
      beforeLines[bi] === lcs[li] &&
      afterLines[ai] === lcs[li]
    ) {
      chunks.push({
        type: "equal",
        line_number_before: bi + 1,
        line_number_after: ai + 1,
        content: beforeLines[bi],
      });
      patch.push(` ${beforeLines[bi]}`);
      bi++;
      ai++;
      li++;
    } else if (
      ai < afterLines.length &&
      (bi >= beforeLines.length ||
        !lcs.slice(li).includes(beforeLines[bi]) ||
        (lcs.slice(li).includes(afterLines[ai]) &&
          lcs.indexOf(afterLines[ai], li) <= lcs.indexOf(beforeLines[bi], li)))
    ) {
      chunks.push({ type: "add", line_number_after: ai + 1, content: afterLines[ai] });
      patch.push(`+${afterLines[ai]}`);
      ai++;
    } else {
      chunks.push({ type: "remove", line_number_before: bi + 1, content: beforeLines[bi] });
      patch.push(`-${beforeLines[bi]}`);
      bi++;
    }
  }

  return {
    path: filePath,
    before,
    after,
    chunks,
    patch: patch.join("\n"),
  };
}

/** Compute Longest Common Subsequence of two string arrays */
function computeLCS(a: string[], b: string[]): string[] {
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

  // Backtrack
  const lcs: string[] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      lcs.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  return lcs;
}

/** Apply a unified diff patch string to source text (simplified) */
export function applyPatch(source: string, patch: string): string {
  const lines = source.split("\n");
  const patchLines = patch.split("\n").filter(
    (l) => l.startsWith("+") || l.startsWith("-") || l.startsWith(" ")
  );

  const result: string[] = [];
  let si = 0;

  for (const pLine of patchLines) {
    if (pLine.startsWith(" ")) {
      result.push(lines[si] ?? pLine.slice(1));
      si++;
    } else if (pLine.startsWith("+")) {
      result.push(pLine.slice(1));
    } else if (pLine.startsWith("-")) {
      si++;
    }
  }

  // Append any remaining source lines
  while (si < lines.length) {
    result.push(lines[si++]);
  }

  return result.join("\n");
}

/** Generate a summary of changes for a commit message */
export function summarizeChanges(diffs: FileDiff[]): string {
  const adds = diffs.reduce(
    (s, d) => s + d.chunks.filter((c) => c.type === "add").length,
    0
  );
  const removes = diffs.reduce(
    (s, d) => s + d.chunks.filter((c) => c.type === "remove").length,
    0
  );
  const files = diffs.map((d) => d.path).join(", ");
  return `Changed ${diffs.length} file(s) (+${adds} -${removes}): ${files}`;
}
