'use client';

import { useState } from 'react';
import type { SEOReport, SEOIssue, SEOSeverity } from '@/lib/ai/seo-analyzer';

interface SEOAnalyzerProps {
  report?: SEOReport;
  files?: Array<{ path: string; content: string }>;
  onAutoFix?: (files: Array<{ path: string; content: string; action: string }>) => void;
  compact?: boolean;
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

const SEVERITY_COLORS: Record<SEOSeverity, string> = {
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={90} height={90} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={45} cy={45} r={radius} fill="none" stroke={COLORS.bgCard} strokeWidth={8} />
        <circle
          cx={45} cy={45} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
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

function IssueBadge({ severity }: { severity: SEOSeverity }) {
  return (
    <span
      style={{
        padding: '1px 7px',
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
        background: `${SEVERITY_COLORS[severity]}22`,
        color: SEVERITY_COLORS[severity],
        flexShrink: 0,
      }}
    >
      {severity.toUpperCase()}
    </span>
  );
}

export default function SEOAnalyzer({ report, files, onAutoFix, compact = false }: SEOAnalyzerProps) {
  const [loading, setLoading] = useState(false);
  const [localReport, setLocalReport] = useState<SEOReport | undefined>(report);

  const active = localReport ?? report;

  async function handleAnalyze() {
    if (!files?.length) return;
    setLoading(true);
    try {
      const res = await fetch('/api/seo-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files }),
      });
      if (res.ok) {
        const data = await res.json() as SEOReport;
        setLocalReport(data);
      }
    } finally {
      setLoading(false);
    }
  }

  if (compact) {
    return (
      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        {active ? (
          <>
            <ScoreGauge score={active.score} />
            <span style={{ fontSize: 11, color: COLORS.textSecondary }}>SEO Score</span>
          </>
        ) : (
          <button
            onClick={handleAnalyze}
            disabled={loading}
            style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${COLORS.accent}`, background: `${COLORS.accent}22`, color: COLORS.accent, fontSize: 12, cursor: 'pointer' }}
          >
            {loading ? 'Analyzing…' : 'Analyze SEO'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {active && <ScoreGauge score={active.score} />}
          <div>
            <h3 style={{ margin: 0, color: COLORS.textPrimary, fontSize: 15, fontWeight: 600 }}>SEO Analyzer</h3>
            {active && (
              <span style={{ color: COLORS.textMuted, fontSize: 12 }}>
                {active.issues.length} issue{active.issues.length !== 1 ? 's' : ''} · {active.passedChecks.length} passed
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleAnalyze}
            disabled={loading || !files?.length}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: `1px solid ${COLORS.accent}`,
              background: `${COLORS.accent}22`,
              color: COLORS.accent,
              fontSize: 12,
              fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
              opacity: !files?.length ? 0.5 : 1,
            }}
          >
            {loading ? 'Analyzing…' : active ? 'Re-analyze' : 'Analyze SEO'}
          </button>
          {active && onAutoFix && (
            <button
              onClick={() => onAutoFix([])}
              style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${COLORS.success}`, background: `${COLORS.success}22`, color: COLORS.success, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              Auto Fix
            </button>
          )}
        </div>
      </div>

      {!active ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: COLORS.textMuted, fontSize: 13 }}>
          Click &quot;Analyze SEO&quot; to scan your files
        </div>
      ) : (
        <>
          {/* Issues */}
          {active.issues.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h4 style={{ margin: 0, color: COLORS.textSecondary, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Issues</h4>
              {active.issues.map((issue: SEOIssue, i) => (
                <div key={i} style={{ padding: '10px 12px', borderRadius: 8, background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IssueBadge severity={issue.severity} />
                    <span style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: 600 }}>{issue.rule}</span>
                    {issue.file && <span style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: 'monospace', marginLeft: 'auto' }}>{issue.file}</span>}
                  </div>
                  <p style={{ margin: 0, color: COLORS.textSecondary, fontSize: 12 }}>{issue.description}</p>
                  {issue.fix && <p style={{ margin: 0, color: COLORS.success, fontSize: 11 }}>💡 {issue.fix}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Passed checks */}
          {active.passedChecks.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <h4 style={{ margin: 0, color: COLORS.textSecondary, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Passed</h4>
              {active.passedChecks.map((check, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: COLORS.success }}>
                  <span>✓</span>
                  <span style={{ color: COLORS.textSecondary }}>{check}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
