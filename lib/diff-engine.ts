/**
 * Diff engine — string-level diff (for version-history.ts) and
 * UIOutput snapshot diff (for builder versions compare).
 */
import type { UIOutput, Page, Section } from '@/types/builder';

// ─── String diff (backward-compatible) ───────────────────────────────────────

export interface DiffHunk {
  type: 'equal' | 'insert' | 'delete';
  lines: string[];
  startA: number;
  startB: number;
}

/**
 * Computes a line-level diff between two string contents.
 * Returns an array of DiffHunk objects.
 */
export function computeDiff(contentA: string, contentB: string): DiffHunk[] {
  const linesA = contentA.split('\n');
  const linesB = contentB.split('\n');
  const hunks: DiffHunk[] = [];

  // Simple line-by-line LCS approach
  let ia = 0;
  let ib = 0;

  while (ia < linesA.length || ib < linesB.length) {
    if (ia < linesA.length && ib < linesB.length && linesA[ia] === linesB[ib]) {
      hunks.push({ type: 'equal', lines: [linesA[ia]], startA: ia, startB: ib });
      ia++;
      ib++;
    } else if (ib < linesB.length && (ia >= linesA.length || linesA[ia] !== linesB[ib])) {
      const insertLines: string[] = [];
      const startB = ib;
      while (ib < linesB.length && (ia >= linesA.length || linesA[ia] !== linesB[ib])) {
        insertLines.push(linesB[ib]);
        ib++;
        if (ia < linesA.length && ia + 1 < linesA.length && linesA[ia + 1] === linesB[ib]) break;
      }
      hunks.push({ type: 'insert', lines: insertLines, startA: ia, startB: startB });
    } else {
      const deleteLines: string[] = [];
      const startA = ia;
      while (ia < linesA.length && (ib >= linesB.length || linesA[ia] !== linesB[ib])) {
        deleteLines.push(linesA[ia]);
        ia++;
        if (ib < linesB.length && ib + 1 < linesB.length && linesA[ia] === linesB[ib + 1]) break;
      }
      hunks.push({ type: 'delete', lines: deleteLines, startA: startA, startB: ib });
    }
  }

  return hunks;
}

// ─── UIOutput snapshot diff ───────────────────────────────────────────────────

function diffSections(a: Section[], b: Section[]): string[] {
  const lines: string[] = [];
  const aMap = new Map(a.map((s) => [s.id, s]));
  const bMap = new Map(b.map((s) => [s.id, s]));

  for (const [id, sec] of aMap) {
    if (!bMap.has(id)) {
      lines.push(`  - REMOVED section: "${sec.title}" (type: ${sec.type})`);
    }
  }
  for (const [id, sec] of bMap) {
    if (!aMap.has(id)) {
      lines.push(`  + ADDED section: "${sec.title}" (type: ${sec.type})`);
    }
  }
  for (const [id, secA] of aMap) {
    const secB = bMap.get(id);
    if (!secB) continue;
    const changes: string[] = [];
    if (secA.title !== secB.title) changes.push(`title: "${secA.title}" → "${secB.title}"`);
    if (secA.content !== secB.content) changes.push(`content changed`);
    if (secA.bgColor !== secB.bgColor) changes.push(`bgColor: ${secA.bgColor} → ${secB.bgColor}`);
    if (secA.textColor !== secB.textColor) changes.push(`textColor: ${secA.textColor} → ${secB.textColor}`);
    if (secA.order !== secB.order) changes.push(`order: ${secA.order} → ${secB.order}`);
    if (changes.length > 0) {
      lines.push(`  ~ CHANGED section "${secA.title}": ${changes.join(', ')}`);
    }
  }
  return lines;
}

function diffPages(a: Page[], b: Page[]): string[] {
  const lines: string[] = [];
  const aMap = new Map(a.map((p) => [p.id, p]));
  const bMap = new Map(b.map((p) => [p.id, p]));

  for (const [id, page] of aMap) {
    if (!bMap.has(id)) {
      lines.push(`- REMOVED page: "${page.name}" (/${page.slug})`);
    }
  }
  for (const [id, page] of bMap) {
    if (!aMap.has(id)) {
      lines.push(`+ ADDED page: "${page.name}" (/${page.slug})`);
    }
  }
  for (const [id, pageA] of aMap) {
    const pageB = bMap.get(id);
    if (!pageB) continue;
    const sectionDiffs = diffSections(pageA.sections, pageB.sections);
    if (sectionDiffs.length > 0) {
      lines.push(`~ CHANGED page: "${pageA.name}"`);
      lines.push(...sectionDiffs);
    }
  }
  return lines;
}

export function computeUIOutputDiff(snapshotA: UIOutput, snapshotB: UIOutput): string {
  const lines: string[] = [];

  if (snapshotA.title !== snapshotB.title) {
    lines.push(`title: "${snapshotA.title}" → "${snapshotB.title}"`);
  }
  if (snapshotA.stylePreset !== snapshotB.stylePreset) {
    lines.push(`stylePreset: ${snapshotA.stylePreset ?? 'none'} → ${snapshotB.stylePreset ?? 'none'}`);
  }

  const pageDiffs = diffPages(snapshotA.pages, snapshotB.pages);
  lines.push(...pageDiffs);

  if (lines.length === 0) return 'No differences found.';
  return lines.join('\n');
}
