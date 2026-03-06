'use client';

import { useState, useEffect } from 'react';

const COLORS = {
  bgPanel: "#0f1120",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  accent: "#6366f1",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
};

const SHORTCUTS = [
  { keys: ['⌘', 'K'], description: 'Open Command Palette' },
  { keys: ['?'], description: 'Show Keyboard Shortcuts' },
  { keys: ['Esc'], description: 'Close modal / Cancel' },
  { keys: ['⌘', '/'], description: 'Focus search' },
  { keys: ['⌘', 'S'], description: 'Save current work' },
  { keys: ['⌘', 'Z'], description: 'Undo' },
  { keys: ['⌘', '⇧', 'Z'], description: 'Redo' },
  { keys: ['G', 'A'], description: 'Go to AI Studio' },
  { keys: ['G', 'D'], description: 'Go to Dashboard' },
  { keys: ['G', 'W'], description: 'Go to Workflow' },
  { keys: ['G', 'L'], description: 'Go to Logs' },
  { keys: ['G', 'H'], description: 'Go to Health' },
];

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let gPressed = false;
    let gTimer: ReturnType<typeof setTimeout>;

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === '?') { setOpen(true); return; }
      if (e.key === 'Escape') { setOpen(false); return; }

      if (e.key === 'g' || e.key === 'G') {
        gPressed = true;
        clearTimeout(gTimer);
        gTimer = setTimeout(() => { gPressed = false; }, 800);
        return;
      }
      if (gPressed) {
        clearTimeout(gTimer);
        gPressed = false;
        const routes: Record<string, string> = { a: '/ai', d: '/dashboard', w: '/workflow', l: '/logs', h: '/health' };
        const dest = routes[e.key.toLowerCase()];
        if (dest) window.location.href = dest;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (!open) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={() => setOpen(false)}
    >
      <div
        style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: '12px', padding: '1.5rem', maxWidth: '480px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: COLORS.textPrimary }}>⌨️ Keyboard Shortcuts</h2>
          <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: '1.25rem' }}>×</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
          {SHORTCUTS.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: COLORS.bgCard, borderRadius: '6px', border: `1px solid ${COLORS.border}` }}>
              <span style={{ fontSize: '0.8rem', color: COLORS.textSecondary }}>{s.description}</span>
              <div style={{ display: 'flex', gap: '3px' }}>
                {s.keys.map((k, ki) => (
                  <kbd key={ki} style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.08)', color: COLORS.textPrimary, padding: '2px 5px', borderRadius: '4px', border: `1px solid ${COLORS.border}` }}>{k}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p style={{ margin: '1rem 0 0', fontSize: '0.75rem', color: COLORS.textMuted, textAlign: 'center' }}>Press <kbd style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, padding: '1px 4px', borderRadius: '3px' }}>?</kbd> to toggle this panel</p>
      </div>
    </div>
  );
}
