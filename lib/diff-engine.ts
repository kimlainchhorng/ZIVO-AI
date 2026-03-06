/**
 * Simple diff engine for comparing two UIOutput snapshots.
 * Returns a human-readable diff string.
 */
import type { UIOutput, Page, Section } from '@/types/builder';

function diffSections(a: Section[], b: Section[]): string[] {
  const lines: string[] = [];
  const aMap = new Map(a.map((s) => [s.id, s]));
  const bMap = new Map(b.map((s) => [s.id, s]));

  // Removed sections
  for (const [id, sec] of aMap) {
    if (!bMap.has(id)) {
      lines.push(`  - REMOVED section: "${sec.title}" (type: ${sec.type})`);
    }
  }
  // Added sections
  for (const [id, sec] of bMap) {
    if (!aMap.has(id)) {
      lines.push(`  + ADDED section: "${sec.title}" (type: ${sec.type})`);
    }
  }
  // Changed sections
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

export function computeDiff(snapshotA: UIOutput, snapshotB: UIOutput): string {
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
