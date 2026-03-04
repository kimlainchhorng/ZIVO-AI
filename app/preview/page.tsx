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

type Device = 'Mobile' | 'Tablet' | 'Desktop';
type ViewMode = 'url' | 'html';

const DEVICE_CONFIG: Record<Device, { width: number; height: number; icon: string; label: string }> = {
  Mobile:  { width: 375,  height: 812,  icon: '📱', label: 'Mobile (375px)' },
  Tablet:  { width: 768,  height: 1024, icon: '🖥', label: 'Tablet (768px)' },
  Desktop: { width: 1280, height: 780,  icon: '💻', label: 'Desktop (1280px)' },
};

const MOCK_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ZIVO Preview</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0f0f1a; color: #f1f5f9; padding: 24px; }
    .hero { text-align: center; padding: 60px 20px; }
    .hero h1 { font-size: 2.5rem; font-weight: 800; background: linear-gradient(135deg, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 16px; }
    .hero p { color: #94a3b8; font-size: 1.1rem; margin-bottom: 32px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; padding: 12px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; }
    .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 40px; }
    .card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; }
    .card h3 { font-size: 1rem; margin-bottom: 8px; }
    .card p { font-size: 0.875rem; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="hero">
    <h1>ZIVO Platform</h1>
    <p>Build, deploy and scale AI-powered apps</p>
    <a class="btn" href="#">Get Started</a>
  </div>
  <div class="features">
    <div class="card"><h3>🤖 AI Studio</h3><p>Build agents and pipelines</p></div>
    <div class="card"><h3>⚡ Edge Deploy</h3><p>Deploy globally in seconds</p></div>
    <div class="card"><h3>📊 Analytics</h3><p>Real-time insights & metrics</p></div>
  </div>
</body>
</html>`;

export default function PreviewPage() {
  const [device, setDevice] = useState<Device>('Desktop');
  const [viewMode, setViewMode] = useState<ViewMode>('html');
  const [urlInput, setUrlInput] = useState('https://example.com');
  const [iframeSrc, setIframeSrc] = useState('');
  const [htmlContent, setHtmlContent] = useState(MOCK_HTML);
  const [zoom, setZoom] = useState(75);

  const cfg = DEVICE_CONFIG[device];
  const scale = zoom / 100;
  const scaledW = cfg.width * scale;
  const scaledH = cfg.height * scale;

  function loadUrl() {
    try {
      const url = new URL(urlInput);
      setIframeSrc(url.toString());
    } catch {
      window.alert('Please enter a valid URL (including https://)');
    }
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.textPrimary }}>
      <style>{fadeInCSS}</style>
      <NavBar />
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Preview</h1>
        <p style={{ color: COLORS.textSecondary, marginBottom: 24 }}>Multi-platform preview for your pages and designs</p>

        {/* Controls bar */}
        <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
          {/* Device selector */}
          <div style={{ display: 'flex', gap: 6 }}>
            {(Object.keys(DEVICE_CONFIG) as Device[]).map(d => (
              <button
                key={d}
                onClick={() => setDevice(d)}
                title={DEVICE_CONFIG[d].label}
                style={{
                  padding: '7px 13px', borderRadius: 8, border: `1px solid ${device === d ? COLORS.accent : COLORS.border}`,
                  background: device === d ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: device === d ? COLORS.accent : COLORS.textSecondary, cursor: 'pointer', fontSize: 16,
                }}
              >
                {DEVICE_CONFIG[d].icon}
              </button>
            ))}
          </div>

          {/* View mode toggle */}
          <div style={{ display: 'flex', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
            {(['url', 'html'] as ViewMode[]).map(m => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                style={{ padding: '7px 14px', border: 'none', background: viewMode === m ? 'rgba(99,102,241,0.2)' : 'transparent', color: viewMode === m ? COLORS.accent : COLORS.textSecondary, cursor: 'pointer', fontSize: 13, fontWeight: viewMode === m ? 600 : 400 }}
              >
                {m === 'url' ? '🔗 URL' : '📄 HTML'}
              </button>
            ))}
          </div>

          {/* URL input */}
          {viewMode === 'url' && (
            <div style={{ display: 'flex', gap: 8, flex: 1 }}>
              <input
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadUrl()}
                placeholder="https://example.com"
                style={{ flex: 1, background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textPrimary, padding: '7px 12px', fontSize: 13 }}
              />
              <button onClick={loadUrl} style={{ background: COLORS.accentGradient, border: 'none', borderRadius: 8, color: '#fff', padding: '7px 18px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Load</button>
            </div>
          )}

          {/* Zoom */}
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
            {[50, 75, 100].map(z => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${zoom === z ? COLORS.accent : COLORS.border}`, background: zoom === z ? 'rgba(99,102,241,0.15)' : 'transparent', color: zoom === z ? COLORS.accent : COLORS.textSecondary, cursor: 'pointer', fontSize: 12, fontWeight: zoom === z ? 600 : 400 }}
              >
                {z}%
              </button>
            ))}
          </div>
        </div>

        {/* HTML textarea */}
        {viewMode === 'html' && (
          <div style={{ marginBottom: 20 }}>
            <textarea
              value={htmlContent}
              onChange={e => setHtmlContent(e.target.value)}
              rows={6}
              style={{ width: '100%', background: '#0d0e1a', border: `1px solid ${COLORS.border}`, borderRadius: 10, color: COLORS.textPrimary, padding: '12px 14px', fontSize: 12, fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>
        )}

        {/* Device frame */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: 500 }}>
          {device === 'Mobile' && (
            <div style={{ width: scaledW + 28, background: '#1a1a2e', borderRadius: 40 * scale, border: `3px solid rgba(255,255,255,0.15)`, padding: `${16 * scale}px ${10 * scale}px`, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
              {/* Notch */}
              <div style={{ width: 80 * scale, height: 22 * scale, background: '#111', borderRadius: 999, margin: `0 auto ${10 * scale}px` }} />
              <div style={{ width: scaledW, height: scaledH - 60 * scale, overflow: 'hidden', borderRadius: 12 * scale, background: '#fff' }}>
                {viewMode === 'html'
                  ? <div dangerouslySetInnerHTML={{ __html: htmlContent }} style={{ width: '100%', height: '100%', overflow: 'auto' }} />
                  : <iframe src={iframeSrc || 'about:blank'} style={{ width: '100%', height: '100%', border: 'none' }} title="preview" />
                }
              </div>
            </div>
          )}

          {device === 'Tablet' && (
            <div style={{ width: scaledW + 40, background: '#1a1a2e', borderRadius: 20 * scale, border: `3px solid rgba(255,255,255,0.12)`, padding: `${20 * scale}px ${16 * scale}px`, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
              <div style={{ width: scaledW, height: scaledH - 40 * scale, overflow: 'hidden', borderRadius: 8 * scale, background: '#fff' }}>
                {viewMode === 'html'
                  ? <div dangerouslySetInnerHTML={{ __html: htmlContent }} style={{ width: '100%', height: '100%', overflow: 'auto' }} />
                  : <iframe src={iframeSrc || 'about:blank'} style={{ width: '100%', height: '100%', border: 'none' }} title="preview" />
                }
              </div>
            </div>
          )}

          {device === 'Desktop' && (
            <div style={{ width: scaledW + 20, background: '#1a1a2e', borderRadius: 10 * scale, border: `2px solid rgba(255,255,255,0.12)`, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
              {/* Browser chrome */}
              <div style={{ background: '#111827', padding: `${8 * scale}px ${12 * scale}px`, display: 'flex', alignItems: 'center', gap: 6 * scale }}>
                <div style={{ width: 10 * scale, height: 10 * scale, borderRadius: '50%', background: '#ef4444' }} />
                <div style={{ width: 10 * scale, height: 10 * scale, borderRadius: '50%', background: '#f59e0b' }} />
                <div style={{ width: 10 * scale, height: 10 * scale, borderRadius: '50%', background: '#22c55e' }} />
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: `${4 * scale}px ${8 * scale}px`, fontSize: 10 * scale, color: COLORS.textMuted, marginLeft: 8 * scale }}>
                  {viewMode === 'url' ? (iframeSrc || 'about:blank') : 'data:text/html,...'}
                </div>
              </div>
              <div style={{ width: scaledW, height: scaledH * scale, overflow: 'hidden', background: '#fff' }}>
                {viewMode === 'html'
                  ? <div dangerouslySetInnerHTML={{ __html: htmlContent }} style={{ width: '100%', height: '100%', overflow: 'auto' }} />
                  : <iframe src={iframeSrc || 'about:blank'} style={{ width: '100%', height: '100%', border: 'none' }} title="preview" />
                }
              </div>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: 12, marginTop: 16 }}>
          {cfg.icon} {cfg.label} · Zoom: {zoom}%
        </p>
      </div>
    </div>
  );
}
