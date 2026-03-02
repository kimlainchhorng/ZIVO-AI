'use client';
import { useState } from 'react';
import Nav from '../components/nav';

interface Finding { severity: string; type: string; description: string; line?: number; recommendation: string }
interface AuditResult { score: number; grade: string; summary: { total: number; critical: number; high: number; medium: number; low: number; info: number }; findings: Finding[] }

export default function SecurityPage() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function runAudit() {
    if (!code.trim()) { setError('Please enter code to audit'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/security-audit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
      const data = await res.json();
      if (data.ok) setResult(data);
      else setError(data.error || 'Audit failed');
    } catch { setError('Request failed'); }
    setLoading(false);
  }

  const severityColor: Record<string, string> = { critical: '#dc2626', high: '#ea580c', medium: '#ca8a04', low: '#16a34a', info: '#2563eb' };
  const severityBg: Record<string, string> = { critical: '#fee2e2', high: '#ffedd5', medium: '#fef9c3', low: '#dcfce7', info: '#dbeafe' };

  const scoreColor = result ? (result.score >= 80 ? '#16a34a' : result.score >= 60 ? '#ca8a04' : '#dc2626') : '#111';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <Nav />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Security Audit</h1>
        <p style={{ color: '#64748b', marginBottom: 24 }}>Scan your code for vulnerabilities and security issues</p>

        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 24 }}>
          <textarea value={code} onChange={e => setCode(e.target.value)} placeholder="Paste your code here for security analysis..." style={{ width: '100%', minHeight: 200, padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: 13, boxSizing: 'border-box', resize: 'vertical' }} />
          {error && <div style={{ color: '#dc2626', fontSize: 14, marginTop: 8 }}>{error}</div>}
          <button onClick={runAudit} disabled={loading} style={{ marginTop: 12, padding: '10px 24px', borderRadius: 8, border: 'none', background: '#111', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
            {loading ? 'Scanning...' : '🔍 Run Security Audit'}
          </button>
        </div>

        {result && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
              <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', textAlign: 'center' }}>
                <div style={{ fontSize: 48, fontWeight: 900, color: scoreColor }}>{result.score}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: scoreColor }}>{result.grade}</div>
                <div style={{ color: '#64748b', fontSize: 13 }}>Security Score</div>
              </div>
              {Object.entries(result.summary).filter(([k]) => k !== 'total').map(([key, val]) => (
                <div key={key} style={{ background: severityBg[key] || '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: severityColor[key] || '#111' }}>{val as number}</div>
                  <div style={{ color: '#64748b', fontSize: 12, textTransform: 'capitalize' }}>{key}</div>
                </div>
              ))}
            </div>

            <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Findings ({result.findings.length})</h2>
              {result.findings.length === 0 ? <p style={{ color: '#16a34a', fontWeight: 600 }}>✅ No security issues found!</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {result.findings.map((f, i) => (
                    <div key={i} style={{ borderLeft: `4px solid ${severityColor[f.severity] || '#111'}`, paddingLeft: 16, paddingTop: 4, paddingBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ background: severityBg[f.severity], color: severityColor[f.severity], padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{f.severity}</span>
                        <span style={{ fontWeight: 600 }}>{f.type}</span>
                        {f.line && <span style={{ color: '#94a3b8', fontSize: 12 }}>Line {f.line}</span>}
                      </div>
                      <div style={{ color: '#475569', fontSize: 14 }}>{f.description}</div>
                      <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>💡 {f.recommendation}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
