'use client';
import { useState, useEffect } from 'react';
import NavBar from '../../components/NavBar';

const COLORS = {
  bg: "#0a0b14", bgPanel: "#0f1120", bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)", accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  textPrimary: "#f1f5f9", textSecondary: "#94a3b8", textMuted: "#64748b",
  success: "#22c55e", warning: "#f59e0b", error: "#ef4444",
};

const fadeInCSS = '@keyframes fadeIn { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }';

const cdnRules = [
  { pattern: '/static/**', ttl: '86400s', action: 'Cache' },
  { pattern: '/api/**', ttl: '0s', action: 'Bypass' },
  { pattern: '/images/**', ttl: '604800s', action: 'Cache + Compress' },
];

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 6, overflow: 'hidden', marginTop: 8 }}>
      <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
    </div>
  );
}

export default function InfrastructurePage() {
  const [cpu, setCpu] = useState(42);
  const [mem, setMem] = useState(61);
  const [disk, setDisk] = useState(38);

  useEffect(() => {
    const iv = setInterval(() => {
      setCpu(v => Math.min(99, Math.max(10, v + (Math.random() * 10 - 5))));
      setMem(v => Math.min(99, Math.max(10, v + (Math.random() * 6 - 3))));
      setDisk(v => Math.min(99, Math.max(10, v + (Math.random() * 4 - 2))));
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  const resources = [
    { name: 'Web Server', detail: '2 vCPU · 4GB RAM', metric: cpu, metricLabel: `CPU: ${cpu.toFixed(0)}%`, color: cpu > 80 ? COLORS.error : COLORS.accent, icon: '🖥' },
    { name: 'Database', detail: 'PostgreSQL 15 · 20GB', metric: 68, metricLabel: '68% used', color: COLORS.warning, icon: '🗄' },
    { name: 'Object Storage', detail: '50/200 GB · CDN enabled', metric: 25, metricLabel: '50 / 200 GB', color: COLORS.success, icon: '📦' },
    { name: 'Cache', detail: 'Redis 7 · 2GB', metric: 91, metricLabel: '91% hit rate', color: COLORS.success, icon: '⚡' },
  ];

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.textPrimary }}>
      <style>{fadeInCSS}</style>
      <NavBar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Infrastructure</h1>

        {/* Resource Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}>
          {resources.map((r, i) => (
            <div key={r.name} style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20, animation: `fadeIn 0.3s ease ${i * 0.08}s both` }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{r.icon}</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{r.name}</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>{r.detail}</div>
              <div style={{ fontSize: 14, color: r.color, fontWeight: 600 }}>{r.metricLabel}</div>
              <ProgressBar value={r.metric} color={r.color} />
            </div>
          ))}
        </div>

        {/* Server Monitor */}
        <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24, marginBottom: 32 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600 }}>Server Monitor <span style={{ fontSize: 12, color: COLORS.success, marginLeft: 8 }}>● Live</span></h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {[
              { label: 'CPU Usage', value: cpu, unit: '%', color: cpu > 80 ? COLORS.error : COLORS.accent },
              { label: 'Memory', value: mem, unit: '%', color: mem > 85 ? COLORS.error : COLORS.warning },
              { label: 'Disk I/O', value: disk, unit: '%', color: COLORS.success },
            ].map(m => (
              <div key={m.label}>
                <div style={{ color: COLORS.textSecondary, fontSize: 13, marginBottom: 6 }}>{m.label}</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: m.color }}>{m.value.toFixed(1)}<span style={{ fontSize: 16 }}>{m.unit}</span></div>
                <ProgressBar value={m.value} color={m.color} />
              </div>
            ))}
          </div>
        </div>

        {/* CDN Rules */}
        <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, marginBottom: 32, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${COLORS.border}` }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>CDN Rules</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['Path Pattern', 'TTL', 'Action'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: COLORS.textMuted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cdnRules.map(r => (
                <tr key={r.pattern} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: COLORS.accent }}>{r.pattern}</td>
                  <td style={{ padding: '12px 16px', color: COLORS.textSecondary }}>{r.ttl}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: 'rgba(99,102,241,0.1)', color: COLORS.accent, padding: '3px 10px', borderRadius: 6, fontSize: 13 }}>{r.action}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SVG Architecture Diagram */}
        <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600 }}>System Architecture</h2>
          <svg viewBox="0 0 700 300" style={{ width: '100%', maxWidth: 700 }}>
            {/* Lines */}
            <line x1="160" y1="150" x2="220" y2="150" stroke="#6366f1" strokeWidth="2" strokeDasharray="4,3" />
            <line x1="340" y1="150" x2="400" y2="150" stroke="#6366f1" strokeWidth="2" strokeDasharray="4,3" />
            <line x1="280" y1="170" x2="280" y2="210" stroke="#6366f1" strokeWidth="2" strokeDasharray="4,3" />
            <line x1="520" y1="170" x2="520" y2="210" stroke="#6366f1" strokeWidth="2" strokeDasharray="4,3" />
            {/* Web */}
            <rect x="60" y="120" width="100" height="60" rx="8" fill="rgba(99,102,241,0.15)" stroke="#6366f1" strokeWidth="1.5" />
            <text x="110" y="148" textAnchor="middle" fill="#f1f5f9" fontSize="13" fontWeight="600">Web</text>
            <text x="110" y="166" textAnchor="middle" fill="#94a3b8" fontSize="11">Nginx</text>
            {/* API */}
            <rect x="220" y="120" width="120" height="60" rx="8" fill="rgba(99,102,241,0.15)" stroke="#6366f1" strokeWidth="1.5" />
            <text x="280" y="148" textAnchor="middle" fill="#f1f5f9" fontSize="13" fontWeight="600">API Server</text>
            <text x="280" y="166" textAnchor="middle" fill="#94a3b8" fontSize="11">Next.js</text>
            {/* DB */}
            <rect x="400" y="120" width="100" height="60" rx="8" fill="rgba(245,158,11,0.12)" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="450" y="148" textAnchor="middle" fill="#f1f5f9" fontSize="13" fontWeight="600">Database</text>
            <text x="450" y="166" textAnchor="middle" fill="#94a3b8" fontSize="11">Postgres</text>
            {/* Storage */}
            <rect x="220" y="220" width="120" height="55" rx="8" fill="rgba(34,197,94,0.1)" stroke="#22c55e" strokeWidth="1.5" />
            <text x="280" y="248" textAnchor="middle" fill="#f1f5f9" fontSize="13" fontWeight="600">Storage</text>
            <text x="280" y="264" textAnchor="middle" fill="#94a3b8" fontSize="11">S3</text>
            {/* Cache */}
            <rect x="460" y="220" width="100" height="55" rx="8" fill="rgba(239,68,68,0.1)" stroke="#ef4444" strokeWidth="1.5" />
            <text x="510" y="248" textAnchor="middle" fill="#f1f5f9" fontSize="13" fontWeight="600">Cache</text>
            <text x="510" y="264" textAnchor="middle" fill="#94a3b8" fontSize="11">Redis</text>
            <line x1="450" y1="180" x2="510" y2="220" stroke="#6366f1" strokeWidth="2" strokeDasharray="4,3" />
          </svg>
        </div>
      </div>
    </div>
  );
}
