'use client';
import { useState, useMemo } from 'react';

type ThemeMode = 'dark' | 'light';

interface ThemeVars {
  '--color-primary': string;
  '--color-background': string;
  '--color-text': string;
  '--color-accent': string;
  '--color-surface': string;
}

const darkDefaults: ThemeVars = {
  '--color-primary': '#6366f1',
  '--color-background': '#0a0a0a',
  '--color-text': '#ffffff',
  '--color-accent': '#06b6d4',
  '--color-surface': '#111111',
};

const lightDefaults: ThemeVars = {
  '--color-primary': '#4f46e5',
  '--color-background': '#f9fafb',
  '--color-text': '#111827',
  '--color-accent': '#0891b2',
  '--color-surface': '#ffffff',
};

const VAR_LABELS: Record<keyof ThemeVars, string> = {
  '--color-primary': 'Primary',
  '--color-background': 'Background',
  '--color-text': 'Text',
  '--color-accent': 'Accent',
  '--color-surface': 'Surface',
};

export default function ThemeEditorPage() {
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [darkVars, setDarkVars] = useState<ThemeVars>(darkDefaults);
  const [lightVars, setLightVars] = useState<ThemeVars>(lightDefaults);
  const [status, setStatus] = useState('');

  const vars = mode === 'dark' ? darkVars : lightVars;
  const setVars = mode === 'dark' ? setDarkVars : setLightVars;

  const updateVar = (key: keyof ThemeVars, value: string) =>
    setVars(prev => ({ ...prev, [key]: value }));

  const cssPreview = useMemo(() => {
    const lines = (Object.entries(vars) as [keyof ThemeVars, string][])
      .map(([k, v]) => `  ${k}: ${v};`).join('\n');
    return `:root {\n${lines}\n}`;
  }, [vars]);

  const handleSave = async () => {
    setStatus('Saving…');
    try {
      const res = await fetch('/api/theme-editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: vars, mode }),
      });
      const data = await res.json() as { css?: string; error?: string };
      if (data.css) {
        navigator.clipboard.writeText(data.css);
        setStatus('CSS copied to clipboard ✓');
      } else {
        setStatus(data.error ?? 'Saved ✓');
      }
    } catch {
      setStatus('Save failed');
    }
    setTimeout(() => setStatus(''), 3000);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Theme Editor</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMode(m => m === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-sm transition hover:bg-[#222]"
          >
            {mode === 'dark' ? '☀️ Light mode' : '🌙 Dark mode'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Variable editor */}
        <section className="bg-[#111] rounded-xl border border-white/10 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#6366f1] mb-4">
            CSS Variables ({mode})
          </h2>
          <div className="flex flex-col gap-4">
            {(Object.keys(vars) as (keyof ThemeVars)[]).map(key => (
              <label key={key} className="flex flex-col gap-1">
                <span className="text-xs text-gray-400">{VAR_LABELS[key]} <code className="text-[10px] text-gray-600">{key}</code></span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={vars[key]}
                    onChange={e => updateVar(key, e.target.value)}
                    className="w-9 h-9 rounded cursor-pointer bg-transparent border-0"
                  />
                  <input
                    value={vars[key]}
                    onChange={e => updateVar(key, e.target.value)}
                    className="flex-1 bg-[#1a1a1a] border border-white/10 rounded px-2 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-[#6366f1]"
                  />
                  <div className="w-8 h-8 rounded border border-white/10" style={{ backgroundColor: vars[key] }} />
                </div>
              </label>
            ))}
          </div>
          <div className="flex gap-3 mt-5 flex-wrap">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#6366f1] hover:bg-[#5254cc] rounded-lg text-sm font-semibold transition"
            >
              Save & Export CSS
            </button>
            {status && <span className="text-sm text-green-400 self-center">{status}</span>}
          </div>
        </section>

        {/* Live preview */}
        <section className="bg-[#111] rounded-xl border border-white/10 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#6366f1] mb-4">Live Preview</h2>
          <div
            className="rounded-lg p-5 border"
            style={{
              backgroundColor: vars['--color-background'],
              color: vars['--color-text'],
              borderColor: `${vars['--color-primary']}33`,
            }}
          >
            <div
              className="px-3 py-2 rounded text-sm font-semibold mb-3 inline-block"
              style={{ backgroundColor: vars['--color-primary'], color: '#fff' }}
            >
              Primary Button
            </div>
            <p className="text-sm mb-2" style={{ color: vars['--color-text'] }}>
              Sample text using the current theme variables.
            </p>
            <div
              className="p-3 rounded border text-xs"
              style={{
                backgroundColor: vars['--color-surface'],
                borderColor: `${vars['--color-accent']}55`,
                color: vars['--color-accent'],
              }}
            >
              Accent surface card
            </div>
          </div>

          {/* CSS output */}
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Generated CSS</p>
            <pre className="bg-[#0a0a0a] rounded p-3 text-xs text-green-400 overflow-x-auto">{cssPreview}</pre>
          </div>
        </section>
      </div>
    </main>
  );
}
