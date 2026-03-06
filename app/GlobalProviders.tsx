'use client';

import { useState } from 'react';
import CommandPalette from '@/components/CommandPalette';
import KeyboardShortcuts from '@/components/KeyboardShortcuts';

export default function GlobalProviders() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <>
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
      <KeyboardShortcuts />
    </>
  );
}
