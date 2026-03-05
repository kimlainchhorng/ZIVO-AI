'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const VisualEditorPanel = dynamic(() => import('@/components/VisualEditor/VisualEditorPanel'), { ssr: false });

const COLORS = {
  bg: "#0a0b14",
  bgPanel: "#0f1120",
  border: "rgba(255,255,255,0.08)",
  accent: "#6366f1",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#475569",
};

export default function VisualBuilderPage() {
  const [generatedCode, setGeneratedCode] = useState('');
  const [generatedFilename, setGeneratedFilename] = useState('Component.tsx');
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCodeGenerated = (code: string, filename: string) => {
    setGeneratedCode(code);
    setGeneratedFilename(filename);
    setShowModal(true);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 1rem; }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: COLORS.bg, color: COLORS.textPrimary, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 1.25rem', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, flexShrink: 0 }}>
          <a href="/ai" style={{ fontSize: '0.8125rem', color: COLORS.textMuted, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            ← Back to AI Builder
          </a>
          <div style={{ width: '1px', height: '16px', background: COLORS.border }} />
          <h1 style={{ fontSize: '1rem', fontWeight: 700, color: COLORS.textPrimary, margin: 0, letterSpacing: '-0.01em' }}>
            🎨 Visual Builder
          </h1>
          <p style={{ fontSize: '0.8125rem', color: COLORS.textMuted, margin: 0, marginLeft: '0.25rem' }}>
            — Drag &amp; drop to build UI
          </p>
        </div>

        {/* Main editor */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <VisualEditorPanel onCodeGenerated={handleCodeGenerated} />
        </div>
      </div>

      {/* Generated Code Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: COLORS.bgPanel,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '12px',
              width: '100%',
              maxWidth: '800px',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem', borderBottom: `1px solid ${COLORS.border}` }}>
              <div>
                <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: COLORS.textPrimary, margin: 0 }}>Generated Code</h2>
                <p style={{ fontSize: '0.75rem', color: COLORS.textMuted, margin: 0, fontFamily: 'monospace' }}>{generatedFilename}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  onClick={handleCopy}
                  style={{ padding: '0.375rem 0.875rem', background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : COLORS.border}`, borderRadius: '6px', color: copied ? '#10b981' : COLORS.textSecondary, cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500 }}
                >
                  {copied ? '✓ Copied' : '⎘ Copy'}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ padding: '0.375rem 0.625rem', background: 'transparent', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: '1.125rem', lineHeight: '1' }}
                >
                  ✕
                </button>
              </div>
            </div>
            <pre style={{ margin: 0, padding: '1.25rem', fontSize: '0.8125rem', color: COLORS.textPrimary, fontFamily: "'JetBrains Mono','Fira Code',monospace", overflowY: 'auto', flex: 1, lineHeight: 1.6, background: 'rgba(0,0,0,0.2)' }}>
              {generatedCode}
            </pre>
          </div>
        </div>
      )}
    </>
  );
}
