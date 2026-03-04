'use client';
import { useState } from 'react';

interface ColorTokens {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

interface TypographyTokens {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

interface SpacingTokens {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

const defaultColors: ColorTokens = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  accent: '#06b6d4',
  background: '#0a0a0a',
  text: '#ffffff',
};

const defaultTypography: TypographyTokens = { sm: '14px', md: '16px', lg: '20px', xl: '24px' };
const defaultSpacing: SpacingTokens = { xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '24px', '2xl': '32px' };

export default function DesignTokensPage() {
  const [colors, setColors] = useState<ColorTokens>(defaultColors);
  const [typography, setTypography] = useState<TypographyTokens>(defaultTypography);
  const [spacing, setSpacing] = useState<SpacingTokens>(defaultSpacing);
  const [status, setStatus] = useState('');

  const exportAs = async (format: 'css' | 'tailwind' | 'json') => {
    setStatus('Exporting…');
    try {
      const res = await fetch('/api/design-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colors, typography, spacing, format }),
      });
      const data = await res.json() as { css?: string; tailwind?: string; tokens?: unknown; error?: string };
      let output = '';
      if (format === 'css') output = data.css ?? JSON.stringify(data, null, 2);
      else if (format === 'tailwind') output = data.tailwind ?? JSON.stringify(data, null, 2);
      else output = JSON.stringify(data.tokens ?? data, null, 2);
      navigator.clipboard.writeText(output);
      setStatus(`${format.toUpperCase()} copied to clipboard ✓`);
    } catch {
      setStatus('Export failed');
    }
    setTimeout(() => setStatus(''), 3000);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <h1 className="text-2xl font-bold mb-2">Design Token Manager</h1>
      <p className="text-gray-500 text-sm mb-8">Edit your design system tokens and export them.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Color palette */}
        <section className="bg-[#111] rounded-xl border border-white/10 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#6366f1] mb-4">Colors</h2>
          <div className="flex flex-col gap-4">
            {(Object.keys(colors) as (keyof ColorTokens)[]).map(key => (
              <label key={key} className="flex items-center gap-3">
                <input
                  type="color"
                  value={colors[key]}
                  onChange={e => setColors(prev => ({ ...prev, [key]: e.target.value }))}
                  className="w-9 h-9 rounded cursor-pointer border-0 bg-transparent"
                />
                <div className="flex-1">
                  <p className="text-xs text-gray-400 capitalize">{key}</p>
                  <input
                    value={colors[key]}
                    onChange={e => setColors(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-[#6366f1]"
                  />
                </div>
                <div
                  className="w-8 h-8 rounded border border-white/10"
                  style={{ backgroundColor: colors[key] }}
                />
              </label>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section className="bg-[#111] rounded-xl border border-white/10 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#6366f1] mb-4">Typography Scale</h2>
          <div className="flex flex-col gap-4">
            {(Object.keys(typography) as (keyof TypographyTokens)[]).map(key => (
              <label key={key} className="flex flex-col gap-1">
                <span className="text-xs text-gray-400 uppercase">{key}</span>
                <div className="flex items-center gap-2">
                  <input
                    value={typography[key]}
                    onChange={e => setTypography(prev => ({ ...prev, [key]: e.target.value }))}
                    className="flex-1 bg-[#1a1a1a] border border-white/10 rounded px-2 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-[#6366f1]"
                  />
                  <span className="text-gray-300" style={{ fontSize: typography[key] }}>Aa</span>
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* Spacing */}
        <section className="bg-[#111] rounded-xl border border-white/10 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#6366f1] mb-4">Spacing Scale</h2>
          <div className="flex flex-col gap-4">
            {(Object.keys(spacing) as (keyof SpacingTokens)[]).map(key => (
              <label key={key} className="flex flex-col gap-1">
                <span className="text-xs text-gray-400 uppercase">{key}</span>
                <div className="flex items-center gap-2">
                  <input
                    value={spacing[key]}
                    onChange={e => setSpacing(prev => ({ ...prev, [key]: e.target.value }))}
                    className="flex-1 bg-[#1a1a1a] border border-white/10 rounded px-2 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-[#6366f1]"
                  />
                  <div
                    className="bg-[#6366f1]/50 rounded"
                    style={{ width: spacing[key], height: '16px', minWidth: '4px' }}
                  />
                </div>
              </label>
            ))}
          </div>
        </section>
      </div>

      {/* Export buttons */}
      <div className="mt-8 flex items-center gap-3 flex-wrap">
        <button
          onClick={() => exportAs('css')}
          className="px-4 py-2 bg-[#6366f1] hover:bg-[#5254cc] rounded-lg text-sm font-semibold transition"
        >
          Export CSS Variables
        </button>
        <button
          onClick={() => exportAs('tailwind')}
          className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#222] border border-white/10 rounded-lg text-sm transition"
        >
          Export Tailwind Config
        </button>
        <button
          onClick={() => exportAs('json')}
          className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#222] border border-white/10 rounded-lg text-sm transition"
        >
          Export JSON
        </button>
        {status && <span className="text-sm text-green-400">{status}</span>}
      </div>
    </main>
  );
}
