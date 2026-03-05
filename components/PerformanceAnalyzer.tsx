'use client';

import { useState } from 'react';
import type { PerformanceReport, PerfIssue, PerfSeverity } from '@/lib/ai/performance-analyzer';

interface PerformanceAnalyzerProps {
  report?: PerformanceReport;
  files?: Array<{ path: string; content: string }>;
  packageJsonContent?: string;
}

const COLORS = {
  bg: '#0a0b14',
  bgPanel: '#0f1120',
  bgCard: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  accent: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
};

const SEVERITY_COLORS: Record<PerfSeverity, string> = {
  critical: COLORS.error,
  high: '#fb923c',
  medium: COLORS.warning,
  low: COLORS.textMuted,
};

function scoreColor(score: number): string {
  if (score >= 80) return COLORS.success;
  if (score >= 50) return COLORS.warning;
  return COLORS.error;
}

function ScoreGauge({ score }: { score: number }) {
  const color = scoreColor(score);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={90} height={90} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={45} cy={45} r={radius} fill="none" stroke={COLORS.bgCard} strokeWidth={8} />
        <circle cx={45} cy={45} r={radius} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div style={{ marginTop: -70, textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 10, color: COLORS.textMuted }}>/ 100</div>
      </div>
      <div style={{ marginTop: 36 }} />
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

interface MetricCardProps { label: string; value: string | number; sub?: string }
function MetricCard({ label, value, sub }: MetricCardProps) {
  return (
    <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '12px 16px', flex: 1, minWidth: 110 }}>
      <div style={{ color: COLORS.textMuted, fontSize: 11, marginBottom: 4 }}>{label}</div>
      <div style={{ color: COLORS.textPrimary, fontSize: 18, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ color: COLORS.textMuted, fontSize: 10 }}>{sub}</div>}
    </div>
  );
}

export default function PerformanceAnalyzer({ report, files, packageJsonContent }: PerformanceAnalyzerProps) {
  const [loading, setLoading] = useState(false);
  const [localReport, setLocalReport] = useState<PerformanceReport | undefined>(report);

  const active = localReport ?? report;

  async function handleAnalyze() {
    if (!files?.length) return;
    setLoading(true);
    try {
      const res = await fetch('/api/performance-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files, packageJson: packageJsonContent }),
      });
      if (res.ok) {
        const data = await res.json() as PerformanceReport;
        setLocalReport(data);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {active && <ScoreGauge score={active.score} />}
          <div>
            <h3 style={{ margin: 0, color: COLORS.textPrimary, fontSize: 15, fontWeight: 600 }}>Performance Analyzer</h3>
            {active && (
              <span style={{ color: COLORS.textMuted, fontSize: 12 }}>
                {active.issues.length} issue{active.issues.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || !files?.length}
          style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${COLORS.accent}`, background: `${COLORS.accent}22`, color: COLORS.accent, fontSize: 12, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: !files?.length ? 0.5 : 1 }}
        >
          {loading ? 'Analyzing…' : active ? 'Re-analyze' : 'Analyze Performance'}
        </button>
      </div>

      {!active ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: COLORS.textMuted, fontSize: 13 }}>
          Click &quot;Analyze Performance&quot; to inspect your project
        </div>
      ) : (
        <>
          {/* Metrics */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <MetricCard label="Bundle Size" value={formatBytes(active.metrics.estimatedBundleSize)} sub="estimated" />
            <MetricCard label="Images" value={active.metrics.imageCount} />
            <MetricCard label="Dependencies" value={active.metrics.externalDependencies} />
            <MetricCard label="Dynamic Imports" value={active.metrics.dynamicImports} sub={`${active.metrics.synchronousImports} sync`} />
          </div>

          {/* Issues */}
          {active.issues.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h4 style={{ margin: 0, color: COLORS.textSecondary, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Issues</h4>
              {active.issues.map((issue: PerfIssue, i) => (
                <div key={i} style={{ padding: '10px 12px', borderRadius: 8, background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ padding: '1px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: `${SEVERITY_COLORS[issue.severity]}22`, color: SEVERITY_COLORS[issue.severity] }}>
                      {issue.severity.toUpperCase()}
                    </span>
                    <span style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: 600 }}>{issue.rule}</span>
                    {issue.file && <span style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: 'monospace', marginLeft: 'auto' }}>{issue.file}</span>}
                  </div>
                  <p style={{ margin: 0, color: COLORS.textSecondary, fontSize: 12 }}>{issue.description}</p>
                  <p style={{ margin: 0, color: COLORS.success, fontSize: 11 }}>💡 {issue.fix}</p>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {active.recommendations.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <h4 style={{ margin: 0, color: COLORS.textSecondary, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Recommendations</h4>
              {active.recommendations.map((rec, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12 }}>
                  <span style={{ color: COLORS.accent }}>→</span>
                  <span style={{ color: COLORS.textSecondary }}>{rec}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
