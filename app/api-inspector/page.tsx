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

const ROUTES = [
  { tag: 'AI', method: 'POST', path: '/api/embeddings' },
  { tag: 'AI', method: 'POST', path: '/api/agent-run' },
  { tag: 'AI', method: 'GET', path: '/api/prompt-library' },
  { tag: 'System', method: 'GET', path: '/api/health' },
  { tag: 'System', method: 'GET', path: '/api/logs' },
  { tag: 'System', method: 'GET', path: '/api/feature-flags' },
  { tag: 'Data', method: 'POST', path: '/api/knowledge-base' },
  { tag: 'Data', method: 'GET', path: '/api/migrate' },
  { tag: 'Data', method: 'POST', path: '/api/migrate' },
  { tag: 'Security', method: 'GET', path: '/api/secrets' },
  { tag: 'Security', method: 'GET', path: '/api/rbac' },
  { tag: 'Security', method: 'POST', path: '/api/rbac' },
  { tag: 'Dev', method: 'GET', path: '/api/sdk-generator' },
  { tag: 'Dev', method: 'POST', path: '/api/a11y-check' },
  { tag: 'Dev', method: 'GET', path: '/api/snapshots' },
  { tag: 'Dev', method: 'POST', path: '/api/mock-server' },
];

const METHOD_COLORS: Record<string, string> = {
  GET: '#22c55e', POST: '#6366f1', PUT: '#f59e0b', DELETE: '#ef4444',
};

const MOCK_RESPONSE = {
  id: 'req_abc123',
  status: 'success',
  data: { result: 'ok', tokens: 412, model: 'gpt-4o' },
  timestamp: new Date().toISOString(),
};

const TAGS = ['AI', 'System', 'Data', 'Security', 'Dev'];

type Header = { key: string; value: string };

export default function ApiInspector() {
  const [selectedRoute, setSelectedRoute] = useState(ROUTES[0]);
  const [method, setMethod] = useState('POST');
  const [url, setUrl] = useState('https://api.zivo.ai/api/embeddings');
  const [headers, setHeaders] = useState<Header[]>([
    { key: 'Content-Type', value: 'application/json' },
    { key: 'Authorization', value: 'Bearer ***' },
  ]);
  const [body, setBody] = useState('{\n  "text": "Hello, world!",\n  "model": "text-embedding-3-small"\n}');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<null | { status: number; time: number; body: string }>(null);
  const [customMock, setCustomMock] = useState(JSON.stringify(MOCK_RESPONSE, null, 2));

  function selectRoute(route: typeof ROUTES[0]) {
    setSelectedRoute(route);
    setMethod(route.method);
    setUrl(`https://api.zivo.ai${route.path}`);
    setResponse(null);
  }

  function addHeader() {
    setHeaders(h => [...h, { key: '', value: '' }]);
  }

  function removeHeader(i: number) {
    setHeaders(h => h.filter((_, idx) => idx !== i));
  }

  function updateHeader(i: number, field: 'key' | 'value', val: string) {
    setHeaders(h => h.map((hdr, idx) => idx === i ? { ...hdr, [field]: val } : hdr));
  }

  function sendRequest() {
    setLoading(true);
    setTimeout(() => {
      let parsedBody = MOCK_RESPONSE;
      try { parsedBody = JSON.parse(customMock); } catch {}
      setResponse({ status: 200, time: 123, body: JSON.stringify(parsedBody, null, 2) });
      setLoading(false);
    }, 500);
  }

  const showBody = method === 'POST' || method === 'PUT';

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.textPrimary }}>
      <style>{fadeInCSS}</style>
      <NavBar />
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>API Inspector</h1>
        <p style={{ color: COLORS.textSecondary, marginBottom: 24 }}>Explore and test your API endpoints</p>

        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {/* Sidebar */}
          <div style={{ width: 260, flexShrink: 0, background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: 'hidden' }}>
            {TAGS.map(tag => (
              <div key={tag}>
                <div style={{ padding: '8px 14px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: COLORS.textMuted, textTransform: 'uppercase', borderBottom: `1px solid ${COLORS.border}` }}>
                  {tag}
                </div>
                {ROUTES.filter(r => r.tag === tag).map(route => (
                  <button
                    key={route.method + route.path}
                    onClick={() => selectRoute(route)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px',
                      background: selectedRoute === route ? 'rgba(99,102,241,0.12)' : 'transparent',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      borderLeft: selectedRoute === route ? `3px solid ${COLORS.accent}` : '3px solid transparent',
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 700, color: METHOD_COLORS[route.method] ?? COLORS.accent, minWidth: 36 }}>{route.method}</span>
                    <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{route.path}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Main area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Request builder */}
            <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Request Builder</h2>

              {/* Method + URL */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <select
                  value={method}
                  onChange={e => setMethod(e.target.value)}
                  style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: METHOD_COLORS[method] ?? COLORS.textPrimary, padding: '8px 12px', fontWeight: 700, fontSize: 13 }}
                >
                  {['GET', 'POST', 'PUT', 'DELETE'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <input
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  style={{ flex: 1, background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textPrimary, padding: '8px 12px', fontSize: 13 }}
                />
              </div>

              {/* Headers */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary }}>Headers</span>
                  <button onClick={addHeader} style={{ fontSize: 12, background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.accent, padding: '4px 10px', cursor: 'pointer' }}>+ Add</button>
                </div>
                {headers.map((hdr, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <input value={hdr.key} onChange={e => updateHeader(i, 'key', e.target.value)} placeholder="Key" style={{ flex: 1, background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.textPrimary, padding: '6px 10px', fontSize: 12 }} />
                    <input value={hdr.value} onChange={e => updateHeader(i, 'value', e.target.value)} placeholder="Value" style={{ flex: 2, background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.textPrimary, padding: '6px 10px', fontSize: 12 }} />
                    <button onClick={() => removeHeader(i)} style={{ background: 'rgba(239,68,68,0.1)', border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 6, color: COLORS.error, padding: '6px 10px', cursor: 'pointer', fontSize: 12 }}>✕</button>
                  </div>
                ))}
              </div>

              {/* Body */}
              {showBody && (
                <div style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, display: 'block', marginBottom: 8 }}>Body</span>
                  <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    rows={5}
                    style={{ width: '100%', background: '#0d0e1a', border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textPrimary, padding: '10px 12px', fontSize: 12, fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              <button
                onClick={sendRequest}
                disabled={loading}
                style={{ background: COLORS.accentGradient, border: 'none', borderRadius: 8, color: '#fff', padding: '10px 24px', fontWeight: 600, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Sending…' : 'Send Request'}
              </button>
            </div>

            {/* Response */}
            {response && (
              <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20, animation: 'fadeIn 0.3s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <span style={{ background: 'rgba(34,197,94,0.15)', color: COLORS.success, borderRadius: 6, padding: '4px 10px', fontSize: 13, fontWeight: 700 }}>200 OK</span>
                  <span style={{ color: COLORS.textMuted, fontSize: 12 }}>{response.time}ms</span>
                </div>
                <pre style={{ background: '#0d0e1a', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 14, fontSize: 12, color: COLORS.textPrimary, overflow: 'auto', margin: 0 }}>{response.body}</pre>
              </div>
            )}

            {/* Mock response editor */}
            <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: COLORS.textSecondary }}>Mock Response Editor</h3>
              <textarea
                value={customMock}
                onChange={e => setCustomMock(e.target.value)}
                rows={6}
                style={{ width: '100%', background: '#0d0e1a', border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textPrimary, padding: '10px 12px', fontSize: 12, fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
