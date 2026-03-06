'use client';
import NavBar from '../components/NavBar';
import { useState } from 'react';

const COLORS = {
  bg: "#0a0b14", bgPanel: "#0f1120", bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)", accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  textPrimary: "#f1f5f9", textSecondary: "#94a3b8", textMuted: "#64748b",
  success: "#22c55e", warning: "#f59e0b", error: "#ef4444",
};

const fadeInCSS = '@keyframes fadeIn { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }';

const INITIAL_HTML = `<div>
  <img src="logo.png" />
  <button></button>
  <p style="color: #aaa; background: #bbb;">Low contrast text</p>
  <form>
    <input type="text" />
    <input type="email" />
  </form>
  <div>
    <span>Click me</span>
  </div>
</div>`;

type Severity = 'error' | 'warning' | 'info';
type FilterType = 'All' | 'Errors' | 'Warnings' | 'Info';

interface A11yIssue {
  severity: Severity;
  wcag: string;
  selector: string;
  description: string;
  fix: string;
}

const ISSUES: A11yIssue[] = [
  { severity: 'error', wcag: 'WCAG 1.1.1', selector: 'img', description: 'Image is missing an alt attribute', fix: 'Add alt="descriptive text" to all img elements' },
  { severity: 'error', wcag: 'WCAG 4.1.2', selector: 'button', description: 'Button has no accessible name', fix: 'Add text content or aria-label to button elements' },
  { severity: 'warning', wcag: 'WCAG 1.4.3', selector: 'p', description: 'Color contrast ratio is too low (2.1:1, needs 4.5:1)', fix: 'Increase contrast between text and background colors' },
  { severity: 'warning', wcag: 'WCAG 2.4.1', selector: 'body', description: 'Skip navigation link is missing', fix: 'Add a "Skip to main content" link at the top of the page' },
  { severity: 'warning', wcag: 'WCAG 1.3.1', selector: 'input[type="text"]', description: 'Form inputs are missing associated labels', fix: 'Associate <label> elements with form inputs using for/id attributes' },
  { severity: 'info', wcag: 'WCAG 1.3.6', selector: 'body', description: 'No landmark regions (main, nav, header) are defined', fix: 'Use semantic HTML5 elements or ARIA landmark roles' },
  { severity: 'info', wcag: 'WCAG 3.1.1', selector: 'html', description: 'lang attribute on <html> is recommended', fix: 'Add lang="en" (or appropriate language) to the <html> element' },
];

const SEVERITY_CONFIG: Record<Severity, { bg: string; color: string; label: string }> = {
  error:   { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444', label: 'Error' },
  warning: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'Warning' },
  info:    { bg: 'rgba(99,102,241,0.12)', color: '#6366f1', label: 'Info' },
};

const SCORE = 72;
const CIRCLE_R = 40;
const CIRCLE_C = 2 * Math.PI * CIRCLE_R;

export default function A11yPage() {
  const [htmlInput, setHtmlInput] = useState(INITIAL_HTML);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [filter, setFilter] = useState<FilterType>('All');

  function checkAccessibility() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setChecked(true);
    }, 1000);
  }

  const filtered = ISSUES.filter(issue => {
    if (filter === 'All') return true;
    if (filter === 'Errors') return issue.severity === 'error';
    if (filter === 'Warnings') return issue.severity === 'warning';
    if (filter === 'Info') return issue.severity === 'info';
    return true;
  });

  const dashOffset = CIRCLE_C - (SCORE / 100) * CIRCLE_C;

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.textPrimary }}>
      <style>{fadeInCSS}</style>
      <NavBar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Accessibility Checker</h1>
            <p style={{ color: COLORS.textSecondary }}>Audit your HTML/JSX for WCAG compliance issues</p>
          </div>
          {/* Score ring */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <svg width={100} height={100} viewBox="0 0 100 100">
              <circle cx={50} cy={50} r={CIRCLE_R} fill="none" stroke={COLORS.border} strokeWidth={8} />
              <circle
                cx={50} cy={50} r={CIRCLE_R} fill="none"
                stroke={SCORE >= 80 ? COLORS.success : SCORE >= 60 ? COLORS.warning : COLORS.error}
                strokeWidth={8} strokeLinecap="round"
                strokeDasharray={CIRCLE_C}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 50 50)"
              />
              <text x={50} y={46} textAnchor="middle" fill={COLORS.textPrimary} fontSize={18} fontWeight={700}>{SCORE}</text>
              <text x={50} y={62} textAnchor="middle" fill={COLORS.textMuted} fontSize={9}>/100</text>
            </svg>
            <span style={{ fontSize: 12, color: COLORS.textMuted }}>Score</span>
          </div>
        </div>

        {/* HTML Input */}
        <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>HTML / JSX Input</h3>
          <textarea
            value={htmlInput}
            onChange={e => setHtmlInput(e.target.value)}
            rows={8}
            style={{ width: '100%', background: '#0d0e1a', border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textPrimary, padding: '10px 12px', fontSize: 12.5, fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box', marginBottom: 14 }}
          />
          <button
            onClick={checkAccessibility}
            disabled={loading}
            style={{ background: COLORS.accentGradient, border: 'none', borderRadius: 8, color: '#fff', padding: '10px 24px', fontWeight: 600, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '⏳ Checking…' : '✓ Check Accessibility'}
          </button>
        </div>

        {/* Results */}
        {checked && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
              {(['All', 'Errors', 'Warnings', 'Info'] as FilterType[]).map(f => {
                const count = f === 'All' ? ISSUES.length : f === 'Errors' ? ISSUES.filter(i => i.severity === 'error').length : f === 'Warnings' ? ISSUES.filter(i => i.severity === 'warning').length : ISSUES.filter(i => i.severity === 'info').length;
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      padding: '7px 14px', borderRadius: 8, border: `1px solid ${filter === f ? COLORS.accent : COLORS.border}`,
                      background: filter === f ? 'rgba(99,102,241,0.15)' : 'transparent',
                      color: filter === f ? COLORS.accent : COLORS.textSecondary,
                      cursor: 'pointer', fontSize: 13, fontWeight: filter === f ? 600 : 400,
                    }}
                  >
                    {f} <span style={{ fontSize: 11, background: COLORS.bgCard, borderRadius: 999, padding: '1px 6px', marginLeft: 4 }}>{count}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map((issue, i) => {
                const cfg = SEVERITY_CONFIG[issue.severity];
                return (
                  <div key={i} style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16, borderLeft: `4px solid ${cfg.color}` }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{cfg.label}</span>
                      <span style={{ background: COLORS.bgCard, color: COLORS.textMuted, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontFamily: 'monospace' }}>{issue.wcag}</span>
                      <span style={{ background: COLORS.bgCard, color: COLORS.textSecondary, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontFamily: 'monospace' }}>{issue.selector}</span>
                    </div>
                    <p style={{ marginTop: 10, fontSize: 14, fontWeight: 500 }}>{issue.description}</p>
                    <p style={{ marginTop: 6, fontSize: 13, color: COLORS.textSecondary }}>
                      <span style={{ color: COLORS.success, fontWeight: 600 }}>Fix: </span>{issue.fix}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
