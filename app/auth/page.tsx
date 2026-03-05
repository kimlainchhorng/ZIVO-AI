'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const COLORS = {
  bg: '#0a0b14',
  bgPanel: '#0f1120',
  bgCard: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  accent: '#6366f1',
  accentGradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  success: '#10b981',
  error: '#ef4444',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
};

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export default function AuthPage() {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [redirectTo, setRedirectTo] = useState('/ai');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    // Only accept relative paths to prevent open redirect attacks
    if (next && next.startsWith('/') && !next.startsWith('//')) {
      setRedirectTo(next);
    }

    // If already logged in, redirect
    const existing = localStorage.getItem('zivo_supabase_token');
    if (existing) {
      window.location.href = redirectTo;
    }
  }, [redirectTo]);

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError('Supabase is not configured. Please check environment variables.');
      setLoading(false);
      return;
    }

    try {
      let result;
      if (tab === 'signup') {
        result = await supabase.auth.signUp({ email, password });
      } else {
        result = await supabase.auth.signInWithPassword({ email, password });
      }

      if (result.error) {
        setError(result.error.message);
      } else if (result.data.session?.access_token) {
        localStorage.setItem('zivo_supabase_token', result.data.session.access_token);
        setSuccess(tab === 'signup' ? 'Account created! Redirecting…' : 'Logged in! Redirecting…');
        setTimeout(() => { window.location.href = redirectTo; }, 1000);
      } else if (tab === 'signup') {
        setSuccess('Check your email to confirm your account, then log in.');
      }
    } catch (err: unknown) {
      setError((err as Error)?.message ?? 'Authentication failed.');
    }
    setLoading(false);
  }

  async function handleGitHubAuth() {
    setError(null);
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}` },
    });
    if (oauthError) setError(oauthError.message);
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: COLORS.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        padding: '1rem',
        animation: 'fadeIn 0.4s ease',
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px ${COLORS.bgPanel} inset !important; -webkit-text-fill-color: ${COLORS.textPrimary} !important; }
      `}</style>

      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: COLORS.bgPanel,
          border: `1px solid ${COLORS.border}`,
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <a href="/ai" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', marginBottom: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', background: COLORS.accentGradient, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.125rem', color: '#fff' }}>Z</div>
            <span style={{ fontWeight: 800, fontSize: '1.25rem', color: COLORS.textPrimary, letterSpacing: '-0.02em' }}>ZIVO AI</span>
          </a>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, margin: '0 0 0.25rem', color: COLORS.textPrimary, letterSpacing: '-0.02em' }}>
            {tab === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p style={{ fontSize: '0.875rem', color: COLORS.textSecondary, margin: 0 }}>
            {tab === 'login' ? 'Sign in to save and share your projects' : 'Start building with ZIVO AI for free'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '10px', padding: '3px', marginBottom: '1.5rem' }}>
          {(['login', 'signup'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null); setSuccess(null); }}
              style={{ flex: 1, padding: '0.4rem', borderRadius: '7px', border: 'none', background: tab === t ? COLORS.accentGradient : 'transparent', color: tab === t ? '#fff' : COLORS.textSecondary, cursor: 'pointer', fontSize: '0.875rem', fontWeight: tab === t ? 600 : 400, transition: 'all 0.2s' }}
            >
              {t === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* GitHub OAuth */}
        <button
          onClick={handleGitHubAuth}
          style={{ width: '100%', padding: '0.65rem', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '10px', color: COLORS.textPrimary, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem', transition: 'border-color 0.15s, background 0.15s' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = COLORS.border; (e.currentTarget as HTMLButtonElement).style.background = COLORS.bgCard; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
          Continue with GitHub
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ flex: 1, height: '1px', background: COLORS.border }} />
          <span style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>or</span>
          <div style={{ flex: 1, height: '1px', background: COLORS.border }} />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', color: COLORS.textSecondary, marginBottom: '0.35rem', fontWeight: 500 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{ width: '100%', padding: '0.6rem 0.75rem', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '8px', color: COLORS.textPrimary, fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.accent; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.border; }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', color: COLORS.textSecondary, marginBottom: '0.35rem', fontWeight: 500 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={tab === 'signup' ? 'Min. 8 characters' : '••••••••'}
              required
              style={{ width: '100%', padding: '0.6rem 0.75rem', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '8px', color: COLORS.textPrimary, fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.accent; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.border; }}
            />
          </div>

          {error && (
            <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: COLORS.error, fontSize: '0.8125rem', animation: 'fadeIn 0.2s ease' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ padding: '0.6rem 0.75rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: COLORS.success, fontSize: '0.8125rem', animation: 'fadeIn 0.2s ease' }}>
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '0.7rem', background: loading ? 'rgba(99,102,241,0.5)' : COLORS.accentGradient, border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.9375rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'opacity 0.15s' }}
          >
            {loading ? (
              <><span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> {tab === 'login' ? 'Signing in…' : 'Creating account…'}</>
            ) : (
              tab === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: COLORS.textMuted, marginTop: '1.25rem', marginBottom: 0 }}>
          {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setTab(tab === 'login' ? 'signup' : 'login'); setError(null); setSuccess(null); }}
            style={{ background: 'none', border: 'none', color: COLORS.accent, cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, padding: 0 }}
          >
            {tab === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}
