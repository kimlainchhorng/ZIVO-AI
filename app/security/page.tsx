'use client';
import { useState } from 'react';
import NavBar from '../../components/NavBar';

const COLORS = {
  bg: "#0a0b14", bgPanel: "#0f1120", bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)", accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  textPrimary: "#f1f5f9", textSecondary: "#94a3b8", textMuted: "#64748b",
  success: "#22c55e", warning: "#f59e0b", error: "#ef4444",
};

const fadeInCSS = '@keyframes fadeIn { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }';

const vulns = [
  { severity: 'critical', title: 'Outdated dependency', status: 'resolved' },
  { severity: 'high', title: 'SQL injection risk', status: 'open' },
  { severity: 'high', title: 'XSS in form input', status: 'open' },
  { severity: 'medium', title: 'Missing CSP header', status: 'open' },
  { severity: 'medium', title: 'Weak password policy', status: 'resolved' },
  { severity: 'low', title: 'Verbose error messages', status: 'resolved' },
];

const dataTypes = [
  { type: 'User PII', retention: '2 years', encrypted: true },
  { type: 'Analytics Events', retention: '90 days', encrypted: false },
  { type: 'Auth Tokens', retention: '30 days', encrypted: true },
];

const gdprItems = [
  { label: 'Data Processing Agreement', checked: true },
  { label: 'Privacy Policy published', checked: true },
  { label: 'Cookie consent banner', checked: true },
  { label: 'Data deletion workflow', checked: true },
  { label: 'Right to access endpoint', checked: true },
  { label: 'Data portability export', checked: true },
  { label: 'DPA with third parties', checked: false },
  { label: 'Data breach procedure', checked: false },
];

const soc2Items = [
  { label: 'Access controls documented', checked: true },
  { label: 'Encryption at rest', checked: true },
  { label: 'Audit logging enabled', checked: true },
  { label: 'Incident response plan', checked: true },
  { label: 'Vendor risk assessments', checked: false },
  { label: 'Penetration test (annual)', checked: false },
];

function SeverityBadge({ s }: { s: string }) {
  const colors: Record<string, string> = { critical: COLORS.error, high: '#f97316', medium: COLORS.warning, low: COLORS.textSecondary };
  return <span style={{ background: `${colors[s]}22`, color: colors[s], padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>{s}</span>;
}

export default function SecurityPage() {
  const [alerts, setAlerts] = useState([
    { id: 1, type: 'warn', msg: 'Unusual login attempt from 192.168.1.42' },
    { id: 2, type: 'warn', msg: 'Failed API key authentication (5 attempts)' },
    { id: 3, type: 'info', msg: 'Security scan completed — 3 issues found' },
  ]);

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.textPrimary }}>
      <style>{fadeInCSS}</style>
      <NavBar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Security Dashboard</h1>

        {/* Score Card */}
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, marginBottom: 32 }}>
          <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 32, textAlign: 'center', animation: 'fadeIn 0.4s ease both' }}>
            <div style={{ fontSize: 56, fontWeight: 800, background: COLORS.accentGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>87</div>
            <div style={{ fontSize: 20, color: COLORS.textSecondary, marginTop: 4 }}>/ 100</div>
            <div style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 8 }}>Security Score</div>
          </div>
          <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Recent Threats</h3>
            {alerts.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${COLORS.border}` }}>
                <span style={{ fontSize: 16 }}>{a.type === 'warn' ? '⚠️' : 'ℹ️'}</span>
                <span style={{ flex: 1, fontSize: 14, color: COLORS.textSecondary }}>{a.msg}</span>
                <button onClick={() => setAlerts(prev => prev.filter(x => x.id !== a.id))} style={{ background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: 16 }}>✕</button>
              </div>
            ))}
            {alerts.length === 0 && <div style={{ color: COLORS.textMuted, fontSize: 14 }}>No active alerts.</div>}
          </div>
        </div>

        {/* Vulnerability Table */}
        <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, marginBottom: 32, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${COLORS.border}` }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Vulnerability Scan</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['Severity', 'Title', 'Status'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: COLORS.textMuted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vulns.map((v, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                  <td style={{ padding: '12px 16px' }}><SeverityBadge s={v.severity} /></td>
                  <td style={{ padding: '12px 16px', color: COLORS.textSecondary }}>{v.title}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: v.status === 'resolved' ? COLORS.success : COLORS.error, fontSize: 13, fontWeight: 600 }}>
                      {v.status === 'resolved' ? '✓ Resolved' : '● Open'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Data Privacy */}
        <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24, marginBottom: 32 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Data Privacy</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {dataTypes.map(d => (
              <div key={d.type} style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>{d.type}</div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 6 }}>Retention: {d.retention}</div>
                <div style={{ fontSize: 13, color: d.encrypted ? COLORS.success : COLORS.textMuted }}>
                  {d.encrypted ? '🔒 Encrypted' : '🔓 Not encrypted'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {[{ title: 'GDPR', items: gdprItems, checked: 6 }, { title: 'SOC 2', items: soc2Items, checked: 4 }].map(c => (
            <div key={c.title} style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{c.title}</h2>
                <span style={{ color: COLORS.success, fontWeight: 600 }}>{c.checked}/{c.items.length}</span>
              </div>
              {c.items.map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: `1px solid ${COLORS.border}` }}>
                  <span style={{ color: item.checked ? COLORS.success : COLORS.textMuted, fontSize: 16 }}>{item.checked ? '✓' : '○'}</span>
                  <span style={{ fontSize: 14, color: item.checked ? COLORS.textPrimary : COLORS.textSecondary }}>{item.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
