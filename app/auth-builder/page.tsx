'use client';

import { useState } from 'react';
import type { AuthConfig } from '@/lib/ai/auth-generator';
import type { AuthProvider, AuthFeature } from '@/lib/ai/auth-generator';

const COLORS = {
  bg: "#0a0b14",
  bgPanel: "#0f1120",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#475569",
  success: "#10b981",
};

const PROVIDERS: { id: AuthProvider; name: string; icon: string; description: string }[] = [
  { id: 'supabase', name: 'Supabase Auth', icon: '⚡', description: 'Open-source with Postgres + RLS' },
  { id: 'clerk', name: 'Clerk', icon: '🔐', description: 'Complete user management' },
  { id: 'auth0', name: 'Auth0', icon: '🌐', description: 'Enterprise identity platform' },
  { id: 'firebase', name: 'Firebase Auth', icon: '🔥', description: "Google's auth platform" },
];

const FEATURES: { id: AuthFeature; label: string; description: string }[] = [
  { id: 'login', label: 'Login', description: 'Email + password login' },
  { id: 'signup', label: 'Signup', description: 'User registration' },
  { id: 'oauth', label: 'OAuth', description: 'Google, GitHub, Discord' },
  { id: 'password-reset', label: 'Password Reset', description: 'Forgot password flow' },
  { id: 'magic-link', label: 'Magic Link', description: 'Passwordless email login' },
  { id: 'mfa', label: 'MFA', description: 'Multi-factor authentication' },
];

export default function AuthBuilderPage() {
  const [provider, setProvider] = useState<AuthProvider>('supabase');
  const [features, setFeatures] = useState<AuthFeature[]>(['login', 'signup']);
  const [appName, setAppName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuthConfig | null>(null);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  const toggleFeature = (feat: AuthFeature) => {
    setFeatures((prev) =>
      prev.includes(feat) ? prev.filter((f) => f !== feat) : [...prev, feat]
    );
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    setSelectedFile(null);
    try {
      const res = await fetch('/api/auth-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, features, appName }),
      });
      const data = await res.json() as AuthConfig & { error?: string };
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
        if (data.files?.length) setSelectedFile(data.files[0] ?? null);
      }
    } catch {
      setError('Failed to generate auth system. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!selectedFile) return;
    await navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyEnv = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.env_vars_needed.join('\n'));
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .provider-card:hover { border-color: rgba(99,102,241,0.4) !important; }
        .file-item:hover { background: rgba(99,102,241,0.1) !important; }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: COLORS.bg, color: COLORS.textPrimary, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
        <div style={{ flex: 1, padding: '2rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>

          {/* Header */}
          <div style={{ marginBottom: '2rem', animation: 'fadeIn 0.4s ease' }}>
            <a href="/ai" style={{ fontSize: '0.8125rem', color: COLORS.textMuted, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1rem' }}>
              ← Back to Builder
            </a>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
              🔐 Auth Builder
            </h1>
            <p style={{ fontSize: '0.9375rem', color: COLORS.textSecondary, margin: 0 }}>
              Generate a complete authentication system with your chosen provider and features.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {/* Left: Config */}
            <div style={{ flex: '1 1 380px' }}>
              {/* Provider Selection */}
              <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem', animation: 'fadeIn 0.4s ease 0.1s both' }}>
                <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: COLORS.textPrimary, marginBottom: '1rem', margin: '0 0 0.75rem' }}>Provider</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {PROVIDERS.map((p) => (
                    <div
                      key={p.id}
                      className="provider-card"
                      onClick={() => setProvider(p.id)}
                      style={{ padding: '0.75rem', background: provider === p.id ? 'rgba(99,102,241,0.12)' : COLORS.bgCard, border: `1px solid ${provider === p.id ? 'rgba(99,102,241,0.4)' : COLORS.border}`, borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s' }}
                    >
                      <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{p.icon}</div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: provider === p.id ? COLORS.accent : COLORS.textPrimary }}>{p.name}</div>
                      <div style={{ fontSize: '0.6875rem', color: COLORS.textMuted, marginTop: '0.125rem' }}>{p.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature Selection */}
              <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem', animation: 'fadeIn 0.4s ease 0.15s both' }}>
                <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: COLORS.textPrimary, margin: '0 0 0.75rem' }}>Features</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {FEATURES.map((feat) => (
                    <label key={feat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.375rem 0' }}>
                      <input
                        type="checkbox"
                        checked={features.includes(feat.id)}
                        onChange={() => toggleFeature(feat.id)}
                        style={{ width: '16px', height: '16px', accentColor: COLORS.accent, cursor: 'pointer' }}
                      />
                      <div>
                        <span style={{ fontSize: '0.875rem', color: COLORS.textPrimary, fontWeight: 500 }}>{feat.label}</span>
                        <span style={{ fontSize: '0.75rem', color: COLORS.textMuted, marginLeft: '0.5rem' }}>{feat.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* App Name + Generate */}
              <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: '12px', padding: '1.25rem', animation: 'fadeIn 0.4s ease 0.2s both' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                  App Name (optional)
                </label>
                <input
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="e.g. My SaaS App"
                  style={{ width: '100%', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: '8px', padding: '0.625rem 0.75rem', color: COLORS.textPrimary, fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit', marginBottom: '1rem' }}
                />
                <button
                  onClick={handleGenerate}
                  disabled={loading || features.length === 0}
                  style={{ width: '100%', padding: '0.75rem', background: loading ? 'rgba(99,102,241,0.5)' : COLORS.accentGradient, border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.9375rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                  {loading ? '⏳ Generating Auth…' : '🔐 Generate Auth System'}
                </button>
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '0.875rem', marginTop: '1rem', color: '#ef4444', fontSize: '0.875rem' }}>
                  {error}
                </div>
              )}
            </div>

            {/* Right: Preview */}
            {result && (
              <div style={{ flex: '1 1 500px', animation: 'fadeIn 0.4s ease' }}>
                {/* Env Vars */}
                <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: COLORS.textPrimary, margin: 0 }}>Required Env Vars</h3>
                    <button
                      onClick={handleCopyEnv}
                      style={{ padding: '0.25rem 0.75rem', background: copiedEnv ? 'rgba(16,185,129,0.15)' : COLORS.bgCard, border: `1px solid ${copiedEnv ? 'rgba(16,185,129,0.3)' : COLORS.border}`, borderRadius: '4px', color: copiedEnv ? COLORS.success : COLORS.textSecondary, cursor: 'pointer', fontSize: '0.6875rem', fontWeight: 500 }}
                    >
                      {copiedEnv ? '✓ Copied' : '⎘ Copy Env Vars'}
                    </button>
                  </div>
                  {result.env_vars_needed.map((envVar) => (
                    <div key={envVar} style={{ fontSize: '0.75rem', color: '#f59e0b', fontFamily: 'monospace', marginBottom: '0.25rem' }}>{envVar}</div>
                  ))}
                </div>

                {/* Files */}
                <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex' }}>
                    <div style={{ width: '200px', borderRight: `1px solid ${COLORS.border}`, padding: '0.75rem', flexShrink: 0 }}>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Generated Files</div>
                      {result.files.map((file) => (
                        <div
                          key={file.path}
                          className="file-item"
                          onClick={() => setSelectedFile(file)}
                          style={{ padding: '0.375rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'monospace', color: selectedFile?.path === file.path ? COLORS.accent : COLORS.textSecondary, background: selectedFile?.path === file.path ? 'rgba(99,102,241,0.1)' : 'transparent', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'background 0.15s' }}
                        >
                          {file.path.split('/').pop()}
                        </div>
                      ))}
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderBottom: `1px solid ${COLORS.border}` }}>
                        <span style={{ fontSize: '0.6875rem', color: COLORS.textMuted, fontFamily: 'monospace' }}>{selectedFile?.path ?? ''}</span>
                        <button
                          onClick={handleCopy}
                          style={{ padding: '0.2rem 0.5rem', background: copied ? 'rgba(16,185,129,0.15)' : COLORS.bgCard, border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : COLORS.border}`, borderRadius: '4px', color: copied ? COLORS.success : COLORS.textSecondary, cursor: 'pointer', fontSize: '0.625rem' }}
                        >
                          {copied ? '✓' : '⎘ Copy'}
                        </button>
                      </div>
                      <pre style={{ margin: 0, padding: '0.75rem', fontSize: '0.6875rem', color: COLORS.textPrimary, fontFamily: "'JetBrains Mono','Fira Code',monospace", overflowX: 'auto', maxHeight: '320px', overflowY: 'auto', lineHeight: 1.6 }}>
                        {selectedFile?.content ?? 'Select a file'}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Setup Instructions */}
                {result.setup_instructions && (
                  <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: '12px', padding: '1.25rem', marginTop: '1rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: COLORS.textPrimary, margin: '0 0 0.5rem' }}>Setup Instructions</h3>
                    <p style={{ fontSize: '0.8125rem', color: COLORS.textSecondary, margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{result.setup_instructions}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
