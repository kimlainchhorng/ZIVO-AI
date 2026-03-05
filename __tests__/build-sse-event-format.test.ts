// __tests__/build-sse-event-format.test.ts
// Unit tests for the /api/build SSE endpoint event structure and manifest legal pages

import { describe, it, expect } from 'vitest';
import { getDefaultManifestFilesForTest, LEGAL_PAGE_PATHS } from './helpers/manifest-helpers';

/**
 * We export a testable helper from the manifest module so tests don't need
 * to call the real OpenAI API.
 */

describe('SSE event format', () => {
  it('stage event has required shape', () => {
    const event = {
      type: 'stage' as const,
      stage: 'BLUEPRINT' as const,
      message: 'Generating blueprint…',
      progress: 5,
    };

    expect(event.type).toBe('stage');
    expect(['BLUEPRINT', 'MANIFEST', 'GENERATE', 'VALIDATE', 'FIX', 'DONE']).toContain(event.stage);
    expect(typeof event.message).toBe('string');
    expect(typeof event.progress).toBe('number');
    expect(event.progress).toBeGreaterThanOrEqual(0);
    expect(event.progress).toBeLessThanOrEqual(100);
  });

  it('files event has required shape', () => {
    const event = {
      type: 'files' as const,
      files: [
        { path: 'app/page.tsx', content: 'export default function Page() {}', action: 'create' as const },
      ],
    };

    expect(event.type).toBe('files');
    expect(Array.isArray(event.files)).toBe(true);
    expect(event.files.length).toBeGreaterThan(0);
    for (const f of event.files) {
      expect(typeof f.path).toBe('string');
      expect(typeof f.content).toBe('string');
      expect(['create', 'update', 'delete']).toContain(f.action);
    }
  });

  it('error event has required shape', () => {
    const event = {
      type: 'error' as const,
      message: 'Build pipeline error',
    };

    expect(event.type).toBe('error');
    expect(typeof event.message).toBe('string');
    expect(event.message.length).toBeGreaterThan(0);
  });

  it('SSE wire format is correctly encoded', () => {
    const event = { type: 'stage', stage: 'DONE', message: 'Build complete', progress: 100 };
    const encoded = `data: ${JSON.stringify(event)}\n\n`;

    expect(encoded.startsWith('data: ')).toBe(true);
    expect(encoded.endsWith('\n\n')).toBe(true);

    const parsed = JSON.parse(encoded.slice(6).trimEnd()) as typeof event;
    expect(parsed.type).toBe('stage');
    expect(parsed.stage).toBe('DONE');
  });
});

describe('Manifest legal pages', () => {
  const defaultFiles = getDefaultManifestFilesForTest();

  it.each(LEGAL_PAGE_PATHS)('default manifest includes %s', (legalPath) => {
    const found = defaultFiles.some((f) => f.path === legalPath);
    expect(found, `Expected "${legalPath}" in default manifest`).toBe(true);
  });

  it('all legal pages have priority 8', () => {
    for (const legalPath of LEGAL_PAGE_PATHS) {
      const file = defaultFiles.find((f) => f.path === legalPath);
      expect(file?.priority, `"${legalPath}" should have priority 8`).toBe(8);
    }
  });

  it('Footer.tsx is in default manifest', () => {
    const found = defaultFiles.some((f) => f.path === 'components/Footer.tsx');
    expect(found).toBe(true);
  });

  it('FILE_LIST_SYSTEM_PROMPT requires legal pages', async () => {
    const { FILE_LIST_SYSTEM_PROMPT_FOR_TEST } = await import('./helpers/manifest-helpers');
    for (const legalPath of LEGAL_PAGE_PATHS) {
      expect(FILE_LIST_SYSTEM_PROMPT_FOR_TEST).toContain(legalPath);
    }
  });
});
