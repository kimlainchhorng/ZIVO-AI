'use client';

import { useState } from 'react';
import NavBar from '../components/NavBar';

const COLORS = {
  bg: "#0a0b14",
  bgPanel: "#0f1120",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
};

const fadeInCSS = '@keyframes fadeIn { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }';

type TimeRange = '7d' | '30d' | '90d';

const STATS: Record<TimeRange, { requests: string; tokens: string; cost: string; avgTime: string }> = {
  '7d':  { requests: '14,250', tokens: '3.8M',  cost: '$42.50',  avgTime: '1.2s' },
  '30d': { requests: '58,400', tokens: '15.2M', cost: '$174.30', avgTime: '1.1s' },
  '90d': { requests: '162,700', tokens: '44.1M', cost: '$512.80', avgTime: '1.3s' },
};

const COST_POINTS: Record<TimeRange, number[]> = {
  '7d':  [5.2, 6.8, 4.9, 7.3, 6.1, 5.9, 6.3],
  '30d': [142, 158, 171, 149, 163, 177, 168],
  '90d': [480, 498, 515, 502, 521, 509, 513],
};

const TOP_FEATURES = [
  { name: 'AI Chat',         pct: 38 },
  { name: 'Code Review',     pct: 24 },
  { name: 'Agent Studio',    pct: 18 },
  { name: 'Prompt Library',  pct: 12 },
  { name: 'API Inspector',   pct: 8  },
];

const MODEL_BARS = [
  { model: 'GPT-4o',    pct: 45, color: '#6366f1' },
  { model: 'GPT-4.1',   pct: 30, color: '#3b82f6' },
  { model: 'o3',        pct: 15, color: '#22c55e' },
  { model: 'o1-mini',   pct: 10, color: '#f59e0b' },
];

const FUNNEL = [
  { step: 'API Requests',    count: 14250, pct: 100 },
  { step: 'Processed',       count: 13980, pct: 98.1 },
  { step: 'Cached',          count: 4560,  pct: 32.0 },
  { step: 'Billed',          count: 9420,  pct: 66.1 },
];

function buildSVGPath(points: number[]): { area: string; line: string } {
  const w = 600, h = 160, pad = 20;
  const max = Math.max(...points);
  const min = Math.min(...points) * 0.9;
  const xs = points.map((_, i) => pad + (i / (points.length - 1)) * (w - pad * 2));
  const ys = points.map(v => h - pad - ((v - min) / (max - min)) * (h - pad * 2));
  const pts = xs.map((x, i) => `${x},${ys[i]}`).join(' ');
  const area = `${xs[0]},${h - pad} ` + pts + ` ${xs[xs.length - 1]},${h - pad}`;
  return { area, line: pts };
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<TimeRange>('7d');
  const [reqLimit, setReqLimit] = useState(60);
  const [tokenLimit, setTokenLimit] = useState(1000000);

  const stats = STATS[range];
  const { area, line } = buildSVGPath(COST_POINTS[range]);

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.textPrimary }}>
      <style>{fadeInCSS}</style>
      <NavBar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Analytics</h1>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['7d', '30d', '90d'] as TimeRange[]).map(r => (
              <button key={r} onClick={() => setRange(r)} style={{
                padding: '6px 18px', borderRadius: 8, border: `1px solid ${range === r ? COLORS.accent : COLORS.border}`,
                background: range === r ? 'rgba(99,102,241,0.2)' : 'transparent',
                color: range === r ? COLORS.textPrimary : COLORS.textSecondary,
                cursor: 'pointer', fontSize: 14, fontWeight: range === r ? 600 : 400, transition: 'all 0.15s',
              }}>{r}</button>
            ))}
          </div>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Requests',     value: stats.requests, icon: '📊' },
            { label: 'Total Tokens',       value: stats.tokens,   icon: '🔤' },
            { label: 'Total Cost',         value: stats.cost,     icon: '💰' },
            { label: 'Avg Response Time',  value: stats.avgTime,  icon: '⚡' },
          ].map(card => (
            <div key={card.label} style={{
              background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12,
              padding: '20px 24px', animation: 'fadeIn 0.4s ease',
            }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{card.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.textPrimary }}>{card.value}</div>
              <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4 }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Two-column: model bars + cost chart */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 20, marginBottom: 28 }}>

          {/* Token Usage by Model */}
          <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px' }}>Token Usage by Model</h2>
            {MODEL_BARS.map(b => (
              <div key={b.model} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14, color: COLORS.textSecondary }}>
                  <span>{b.model}</span><span style={{ color: COLORS.textPrimary, fontWeight: 600 }}>{b.pct}%</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${b.pct}%`, height: '100%', background: b.color, borderRadius: 4, transition: 'width 0.4s ease' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Cost Chart */}
          <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>Cost Over Time</h2>
            <svg viewBox="0 0 600 160" style={{ width: '100%', height: 160 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <polygon points={area} fill="url(#areaGrad)" />
              <polyline points={line} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Top Features + Funnel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>

          {/* Top Features */}
          <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px' }}>Top 5 Features</h2>
            {TOP_FEATURES.map((f, i) => (
              <div key={f.name} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 14, color: COLORS.textSecondary }}>
                  <span><span style={{ color: COLORS.textMuted, marginRight: 8 }}>#{i + 1}</span>{f.name}</span>
                  <span style={{ color: COLORS.textPrimary, fontWeight: 600 }}>{f.pct}%</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 6 }}>
                  <div style={{ width: `${f.pct}%`, height: '100%', background: COLORS.accentGradient, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Conversion Funnel */}
          <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px' }}>Conversion Funnel</h2>
            {FUNNEL.map((f, i) => (
              <div key={f.step} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 14, color: COLORS.textSecondary }}>
                  <span><span style={{ color: COLORS.textMuted, marginRight: 6 }}>Step {i + 1}</span>{f.step}</span>
                  <span style={{ color: COLORS.textPrimary, fontWeight: 600 }}>{f.count.toLocaleString()} <span style={{ color: COLORS.textMuted }}>({f.pct}%)</span></span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 8 }}>
                  <div style={{ width: `${f.pct}%`, height: '100%', background: `rgba(99,102,241,${0.9 - i * 0.15})`, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rate Limits */}
        <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px' }}>Rate Limit Configuration</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {[
              { label: 'Max Requests / Min', value: reqLimit, min: 10, max: 200, setter: setReqLimit, suffix: 'req/min' },
              { label: 'Max Tokens / Day', value: tokenLimit, min: 100000, max: 5000000, step: 100000, setter: setTokenLimit, suffix: 'tokens' },
            ].map(sl => (
              <div key={sl.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14, color: COLORS.textSecondary }}>
                  <span>{sl.label}</span>
                  <span style={{ color: COLORS.textPrimary, fontWeight: 600 }}>{sl.value.toLocaleString()} {sl.suffix}</span>
                </div>
                <input type="range" min={sl.min} max={sl.max} step={sl.step ?? 1} value={sl.value}
                  onChange={e => sl.setter(Number(e.target.value))}
                  style={{ width: '100%', accentColor: COLORS.accent, cursor: 'pointer' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>
                  <span>{sl.min.toLocaleString()}</span><span>{sl.max.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
