'use client';

import { useState } from 'react';
import type { AccessibilityReport, A11yViolation, A11ySeverity } from '@/lib/ai/accessibility-scanner';

interface AccessibilityScannerProps {
  report?: AccessibilityReport;
  files?: Array<{ path: string; content: string }>;
  onFixCritical?: () => void;
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

const SEVERITY_COLORS: Record<A11ySeverity, string> = {
  critical: COLORS.error,
  serious: '#fb923c',
  moderate: COLORS.warning,
  minor: COLORS.textMuted,
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
        <div style={{ fontSize: 10, color: COLORS.textMuted }}>WCAG</div>
      </div>
      <div style={{ marginTop: 36 }} />
    </div>
  );
}

const SEVERITY_ORDER: A11ySeverity[] = ['critical', 'serious', 'moderate', 'minor'];

export default function AccessibilityScanner({ report, files, onFixCritical }: AccessibilityScannerProps) {
  const [loading, setLoading] = useState(false);
  const [localReport, setLocalReport] = useState<AccessibilityReport | undefined>(report);

  const active = localReport ?? report;

  async function handleScan() {
    if (!files?.length) return;
    setLoading(true);
    try {
      const res = await fetch('/api/accessibility-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files }),
      });
      if (res.ok) {
        const data = await res.json() as AccessibilityReport;
        setLocalReport(data);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    if (!active) return;
    const blob = new Blob([JSON.stringify(active, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'accessibility-report.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  const groupedViolations = SEVERITY_ORDER.reduce<Record<A11ySeverity, A11yViolation[]>>(
    (acc, sev) => {
      acc[sev] = active?.violations.filter((v) => v.severity === sev) ?? [];
      return acc;
    },
    { critical: [], serious: [], moderate: [], minor: [] },
  );

  return (
    <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {active && <ScoreGauge score={active.score} />}
          <div>
            <h3 style={{ margin: 0, color: COLORS.textPrimary, fontSize: 15, fontWeight: 600 }}>Accessibility Scanner</h3>
            {active && (
              <span style={{ color: COLORS.textMuted, fontSize: 12 }}>
                {active.violations.length} violation{active.violations.length !== 1 ? 's' : ''} · {active.passedChecks.length} passed
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={handleScan}
            disabled={loading || !files?.length}
            style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${COLORS.accent}`, background: `${COLORS.accent}22`, color: COLORS.accent, fontSize: 12, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: !files?.length ? 0.5 : 1 }}
          >
            {loading ? 'Scanning…' : active ? 'Re-scan' : 'Scan Accessibility'}
          </button>
          {active && (
            <>
              {onFixCritical && groupedViolations.critical.length > 0 && (
                <button
                  onClick={onFixCritical}
                  style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${COLORS.error}`, background: `${COLORS.error}22`, color: COLORS.error, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Fix Critical ({groupedViolations.critical.length})
                </button>
              )}
              <button
                onClick={handleExport}
                style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${COLORS.border}`, background: 'transparent', color: COLORS.textSecondary, fontSize: 12, cursor: 'pointer' }}
              >
                Export JSON
              </button>
            </>
          )}
        </div>
      </div>

      {!active ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: COLORS.textMuted, fontSize: 13 }}>
          Click &quot;Scan Accessibility&quot; to check WCAG compliance
        </div>
      ) : (
        <>
          {/* Violations grouped by severity */}
          {SEVERITY_ORDER.map((sev) => {
            const viols = groupedViolations[sev];
            if (!viols.length) return null;
            return (
              <div key={sev} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <h4 style={{ margin: 0, color: SEVERITY_COLORS[sev], fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                  {sev} ({viols.length})
                </h4>
                {viols.map((v: A11yViolation) => (
                  <div key={v.id} style={{ padding: '10px 12px', borderRadius: 8, background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ padding: '1px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: `${SEVERITY_COLORS[sev]}22`, color: SEVERITY_COLORS[sev] }}>
                        {v.wcagCriteria}
                      </span>
                      {v.file && <span style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: 'monospace' }}>{v.file}</span>}
                      {v.element && <span style={{ color: COLORS.textMuted, fontSize: 11, fontFamily: 'monospace', background: COLORS.bgCard, padding: '0 4px', borderRadius: 3 }}>{v.element}</span>}
                    </div>
                    <p style={{ margin: 0, color: COLORS.textSecondary, fontSize: 12 }}>{v.description}</p>
                    <p style={{ margin: 0, color: COLORS.success, fontSize: 11 }}>💡 {v.fix}</p>
                  </div>
                ))}
              </div>
            );
          })}

          {/* Passed checks */}
          {active.passedChecks.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <h4 style={{ margin: 0, color: COLORS.textSecondary, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Passed ({active.passedChecks.length})</h4>
              {active.passedChecks.map((check, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ color: COLORS.success }}>✓</span>
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
