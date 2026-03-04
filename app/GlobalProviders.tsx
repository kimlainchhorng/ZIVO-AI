'use client';

import CommandPalette from '@/components/CommandPalette';
import KeyboardShortcuts from '@/components/KeyboardShortcuts';

export default function GlobalProviders() {
  return (
    <>
      <CommandPalette />
      <KeyboardShortcuts />
    </>
  );
}
