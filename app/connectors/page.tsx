"use client";

import { useState } from 'react';

interface ConnectorState {
  githubConnected: boolean;
  modalToken: string;
  modalRepo: string;
  supabaseConnected: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  stripeConnected: boolean;
  stripeSecretKey: string;
  resendConnected: boolean;
  resendApiKey: string;
  storageConnected: boolean;
  storageProvider: 's3' | 'supabase';
  storageAccessKey: string;
  storageSecretKey: string;
  storageBucket: string;
  mapsConnected: boolean;
  mapsApiKey: string;
}

const DEFAULT_STATE: ConnectorState = {
  githubConnected: false,
  modalToken: '',
  modalRepo: '',
  supabaseConnected: false,
  supabaseUrl: '',
  supabaseAnonKey: '',
  stripeConnected: false,
  stripeSecretKey: '',
  resendConnected: false,
  resendApiKey: '',
  storageConnected: false,
  storageProvider: 's3',
  storageAccessKey: '',
  storageSecretKey: '',
  storageBucket: '',
  mapsConnected: false,
  mapsApiKey: '',
};

function loadConnectorState(): ConnectorState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const stored = localStorage.getItem('connectorState');
    if (stored) return { ...DEFAULT_STATE, ...JSON.parse(stored) };
  } catch (err) {
    console.error('[connectors] Failed to load state from localStorage:', err);
  }
  return DEFAULT_STATE;
}

function saveConnectorState(state: ConnectorState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('connectorState', JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
  return DEFAULT_STATE;
}

function saveConnectorState(state: ConnectorState): void {
  if (typeof window === 'undefined') return;
  try {
    // Do not persist secrets in connectorState; only store non-sensitive fields.
    const { modalToken, supabaseAnonKey, ...nonSensitiveState } = state;
    void supabaseAnonKey;
    localStorage.setItem('connectorState', JSON.stringify(nonSensitiveState));
    // Write/clear the dedicated keys that other parts of the app (e.g. app/ai/page.tsx) read.
    if (state.githubConnected && modalToken) {
      localStorage.setItem('zivo_github_token', modalToken);
      localStorage.setItem('zivo_github_repo', state.modalRepo);
    } else if (!state.githubConnected) {
      localStorage.removeItem('zivo_github_token');
      localStorage.removeItem('zivo_github_repo');
    }
  } catch (err) {
    console.error('[connectors] Failed to save state to localStorage:', err);
  }
}

interface TestApiResult {
  success: boolean;
  message: string;
  data?: unknown;
}

interface RecentCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

interface GitHubCommitItem {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  html_url: string;
}

const SHORT_SHA_LENGTH = 7;
const MAX_COMMIT_MESSAGE_LENGTH = 80;

async function callTestApi(
  type: 'github' | 'supabase' | 'stripe' | 'resend',
  credentials: Record<string, string>
): Promise<TestApiResult> {
  const res = await fetch('/api/connectors/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, credentials }),
  });
  return res.json() as Promise<TestApiResult>;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  border: '1px solid #374151',
  borderRadius: 7,
  fontSize: '0.9rem',
  boxSizing: 'border-box',
  background: '#111827',
  color: '#f9fafb',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 500,
  marginBottom: 4,
  color: '#d1d5db',
};

const sectionStyle: React.CSSProperties = {
  marginBottom: '2rem',
  border: '1px solid #374151',
  borderRadius: 10,
  padding: '1.25rem',
  background: '#1f2937',
};

const connectBtnStyle: React.CSSProperties = {
  padding: '0.5rem 1.25rem',
  background: '#3b82f6',
  color: '#fff',
  border: 'none',
  borderRadius: 7,
  cursor: 'pointer',
  fontWeight: 500,
};

const disconnectBtnStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  background: '#7f1d1d',
  color: '#fca5a5',
  border: 'none',
  borderRadius: 7,
  cursor: 'pointer',
  fontWeight: 500,
};

const connectedBadge: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#4ade80',
  background: '#14532d',
  borderRadius: 6,
  padding: '2px 8px',
};

const ConnectorComponent = () => {
  // Lazy initializer loads persisted state from localStorage on first render
  const [connState, setConnState] = useState<ConnectorState>(loadConnectorState);
  const [githubError, setGithubError] = useState<string>('');
  const [commits, setCommits] = useState<RecentCommit[]>([]);
  const [commitsLoading, setCommitsLoading] = useState(false);
  const [commitsError, setCommitsError] = useState('');
  const [supabaseError, setSupabaseError] = useState<string>('');
  const [stripeError, setStripeError] = useState<string>('');
  const [stripeLoading, setStripeLoading] = useState(false);
  const [resendError, setResendError] = useState<string>('');
  const [resendLoading, setResendLoading] = useState(false);
  const [storageError, setStorageError] = useState<string>('');
  const [mapsError, setMapsError] = useState<string>('');

  function updateState(patch: Partial<ConnectorState>): void {
    setConnState((prev) => {
      const next = { ...prev, ...patch };
      saveConnectorState(next);
      return next;
    });
  }

  function handleGithubConnect(e: React.FormEvent) {
    e.preventDefault();
    setGithubError('');
    if (!connState.modalToken.trim()) {
      setGithubError('GitHub token is required.');
      return;
    }
    if (!connState.modalRepo.trim()) {
      setGithubError('Repository name is required (e.g. owner/repo).');
      return;
    }
    updateState({ githubConnected: true });
  }

  function handleGithubDisconnect() {
    updateState({ githubConnected: false, modalToken: '', modalRepo: '' });
    setGithubError('');
    setCommits([]);
    setCommitsError('');
  }

  async function handleFetchCommits() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('zivo_github_token') : null;
    const repo = connState.modalRepo;
    if (!token || !repo) {
      setCommitsError('No GitHub token found. Please reconnect.');
      return;
    }
    setCommitsLoading(true);
    setCommitsError('');
    try {
      const res = await fetch(`/api/github/commits?repo=${encodeURIComponent(repo)}&per_page=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as { commits?: GitHubCommitItem[]; error?: string };
      if (!res.ok) {
        setCommitsError(data.error ?? 'Failed to fetch commits');
      } else {
        const mapped: RecentCommit[] = (data.commits ?? []).map((c) => ({
          sha: c.sha.slice(0, SHORT_SHA_LENGTH),
          message: c.commit.message.split('\n')[0].slice(0, MAX_COMMIT_MESSAGE_LENGTH),
          author: c.commit.author.name,
          date: c.commit.author.date,
          url: c.html_url,
        }));
        setCommits(mapped);
      }
    } catch {
      setCommitsError('Network error fetching commits.');
    }
    setCommitsLoading(false);
  }

  function handleSupabaseConnect(e: React.FormEvent) {
    e.preventDefault();
    setSupabaseError('');
    if (!connState.supabaseUrl.trim()) {
      setSupabaseError('Supabase project URL is required.');
      return;
    }
    if (!connState.supabaseAnonKey.trim()) {
      setSupabaseError('Supabase anon key is required.');
      return;
    }
    updateState({ supabaseConnected: true });
  }

  function handleSupabaseDisconnect() {
    updateState({ supabaseConnected: false, supabaseUrl: '', supabaseAnonKey: '' });
    setSupabaseError('');
  }

  async function handleStripeConnect(e: React.FormEvent) {
    e.preventDefault();
    setStripeError('');
    if (!connState.stripeSecretKey.trim()) {
      setStripeError('Stripe secret key is required.');
      return;
    }
    setStripeLoading(true);
    try {
      const result = await callTestApi('stripe', { secretKey: connState.stripeSecretKey });
      if (!result.success) {
        setStripeError(result.message);
      } else {
        updateState({ stripeConnected: true });
      }
    } catch {
      setStripeError('Network error. Please try again.');
    } finally {
      setStripeLoading(false);
    }
  }

  function handleStripeDisconnect() {
    updateState({ stripeConnected: false, stripeSecretKey: '' });
    setStripeError('');
  }

  async function handleResendConnect(e: React.FormEvent) {
    e.preventDefault();
    setResendError('');
    if (!connState.resendApiKey.trim()) {
      setResendError('Resend API key is required.');
      return;
    }
    setResendLoading(true);
    try {
      const result = await callTestApi('resend', { apiKey: connState.resendApiKey });
      if (!result.success) {
        setResendError(result.message);
      } else {
        updateState({ resendConnected: true });
      }
    } catch {
      setResendError('Network error. Please try again.');
    } finally {
      setResendLoading(false);
    }
  }

  function handleResendDisconnect() {
    updateState({ resendConnected: false, resendApiKey: '' });
    setResendError('');
  }

  function handleStorageConnect(e: React.FormEvent) {
    e.preventDefault();
    setStorageError('');
    if (connState.storageProvider === 's3') {
      if (!connState.storageAccessKey.trim()) {
        setStorageError('AWS Access Key ID is required.');
        return;
      }
      if (!connState.storageSecretKey.trim()) {
        setStorageError('AWS Secret Access Key is required.');
        return;
      }
    }
    if (!connState.storageBucket.trim()) {
      setStorageError('Bucket name is required.');
      return;
    }
    updateState({ storageConnected: true });
  }

  function handleStorageDisconnect() {
    updateState({ storageConnected: false, storageAccessKey: '', storageSecretKey: '', storageBucket: '' });
    setStorageError('');
  }

  function handleMapsConnect(e: React.FormEvent) {
    e.preventDefault();
    setMapsError('');
    if (!connState.mapsApiKey.trim()) {
      setMapsError('Google Maps API key is required.');
      return;
    }
    updateState({ mapsConnected: true });
  }

  function handleMapsDisconnect() {
    updateState({ mapsConnected: false, mapsApiKey: '' });
    setMapsError('');
  }

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', padding: '0 1rem', fontFamily: 'system-ui, sans-serif', color: '#f9fafb' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Connectors</h1>

      {/* GitHub Section */}
      <section style={{ ...sectionStyle, border: '1px solid #374151' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>GitHub</h2>
          {connState.githubConnected && <span style={connectedBadge}>Connected</span>}
        </div>
        {connState.githubConnected ? (
          <div>
            {/* Repo info + status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ color: '#4ade80', fontSize: '1.1rem' }}>✅</span>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#d1d5db' }}>
                Connected to: <strong style={{ color: '#f9fafb' }}>{connState.modalRepo}</strong>
              </p>
            </div>

            {/* Recent commits panel */}
            <div style={{ background: '#111827', borderRadius: 8, padding: '0.75rem', marginBottom: '0.75rem', border: '1px solid #374151' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', color: '#9ca3af', fontWeight: 600 }}>Recent Commits</span>
                <button
                  onClick={handleFetchCommits}
                  disabled={commitsLoading}
                  style={{ fontSize: '0.78rem', background: 'transparent', border: '1px solid #374151', color: '#60a5fa', borderRadius: 5, padding: '2px 8px', cursor: 'pointer' }}
                >
                  {commitsLoading ? '...' : '🔄 Refresh'}
                </button>
              </div>
              {commitsError && <p style={{ color: '#f87171', fontSize: '0.8rem', margin: 0 }}>{commitsError}</p>}
              {commits.length === 0 && !commitsLoading && !commitsError && (
                <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: 0 }}>Click Refresh to load recent commits</p>
              )}
              {commits.map((c: RecentCommit) => (
                <div key={c.sha} style={{ borderBottom: '1px solid #1f2937', padding: '0.35rem 0', fontSize: '0.8rem' }}>
                  <span style={{ color: '#e2e8f0' }}>• {c.message}</span>
                  <span style={{ color: '#6b7280', marginLeft: '0.5rem' }}>— {c.author} · {new Date(c.date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <a
                href={`https://github.com/${connState.modalRepo}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ padding: '0.4rem 0.9rem', background: '#1f2937', border: '1px solid #374151', color: '#d1d5db', borderRadius: 7, fontSize: '0.85rem', textDecoration: 'none' }}
              >
                🐙 View on GitHub
              </a>
              <button onClick={handleGithubDisconnect} style={disconnectBtnStyle}>Disconnect</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGithubConnect}>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={labelStyle}>Personal Access Token</label>
              <input type="password" value={connState.modalToken}
                onChange={(e) => updateState({ modalToken: e.target.value })}
                placeholder="ghp_xxxxxxxxxxxx" style={inputStyle} />
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={labelStyle}>Repository (owner/repo)</label>
              <input type="text" value={connState.modalRepo}
                onChange={(e) => updateState({ modalRepo: e.target.value })}
                placeholder="owner/my-project" style={inputStyle} />
            </div>
            {githubError && <p style={{ color: '#f87171', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>{githubError}</p>}
            <button type="submit" style={connectBtnStyle}>Connect GitHub</button>
          </form>
        )}
      </section>

      {/* Supabase Section */}
      <section style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Supabase</h2>
          {connState.supabaseConnected && <span style={connectedBadge}>Connected</span>}
        </div>
        {connState.supabaseConnected ? (
          <div>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: '#d1d5db' }}>
              Project URL: <strong>{connState.supabaseUrl}</strong>
            </p>
            <button onClick={handleSupabaseDisconnect} style={disconnectBtnStyle}>Disconnect</button>
          </div>
        ) : (
          <form onSubmit={handleSupabaseConnect}>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={labelStyle}>Project URL</label>
              <input type="url" value={connState.supabaseUrl}
                onChange={(e) => updateState({ supabaseUrl: e.target.value })}
                placeholder="https://xyzcompany.supabase.co" style={inputStyle} />
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={labelStyle}>Anon / Public Key</label>
              <input type="password" value={connState.supabaseAnonKey}
                onChange={(e) => updateState({ supabaseAnonKey: e.target.value })}
                placeholder="eyJhbGci..." style={inputStyle} />
            </div>
            {supabaseError && <p style={{ color: '#f87171', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>{supabaseError}</p>}
            <button type="submit" style={connectBtnStyle}>Connect Supabase</button>
          </form>
        )}
      </section>

      {/* Stripe Section */}
      <section style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ width: 28, height: 28, borderRadius: 6, background: '#6366f1', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>S</span>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Stripe</h2>
          </div>
          {connState.stripeConnected && <span style={connectedBadge}>Connected</span>}
        </div>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af', margin: '0 0 1rem' }}>
          List products, create payment links, view recent charges
        </p>
        {connState.stripeConnected ? (
          <div>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: '#d1d5db' }}>
              Stripe account connected.
            </p>
            <button onClick={handleStripeDisconnect} style={disconnectBtnStyle}>Disconnect</button>
          </div>
        ) : (
          <form onSubmit={handleStripeConnect}>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={labelStyle}>Secret Key</label>
              <input type="password" value={connState.stripeSecretKey}
                onChange={(e) => updateState({ stripeSecretKey: e.target.value })}
                placeholder="sk_live_..." style={inputStyle} />
            </div>
            {stripeError && <p style={{ color: '#f87171', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>{stripeError}</p>}
            <button type="submit" style={{ ...connectBtnStyle, opacity: stripeLoading ? 0.7 : 1 }} disabled={stripeLoading}>
              {stripeLoading ? 'Testing…' : 'Connect Stripe'}
            </button>
          </form>
        )}
      </section>

      {/* Resend Section */}
      <section style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ width: 28, height: 28, borderRadius: 6, background: '#0891b2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>R</span>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Resend</h2>
          </div>
          {connState.resendConnected && <span style={connectedBadge}>Connected</span>}
        </div>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af', margin: '0 0 1rem' }}>
          Send test emails, view email templates
        </p>
        {connState.resendConnected ? (
          <div>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: '#d1d5db' }}>
              Resend API key active.
            </p>
            <button onClick={handleResendDisconnect} style={disconnectBtnStyle}>Disconnect</button>
          </div>
        ) : (
          <form onSubmit={handleResendConnect}>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={labelStyle}>API Key</label>
              <input type="password" value={connState.resendApiKey}
                onChange={(e) => updateState({ resendApiKey: e.target.value })}
                placeholder="re_xxxxxxxxxxxx" style={inputStyle} />
            </div>
            {resendError && <p style={{ color: '#f87171', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>{resendError}</p>}
            <button type="submit" style={{ ...connectBtnStyle, opacity: resendLoading ? 0.7 : 1 }} disabled={resendLoading}>
              {resendLoading ? 'Testing…' : 'Connect Resend'}
            </button>
          </form>
        )}
      </section>

      {/* Storage Section */}
      <section style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ width: 28, height: 28, borderRadius: 6, background: '#f59e0b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', color: '#1f2937' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 5a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm0 8a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2zm2 6a2 2 0 100 4 2 2 0 000-4zm7 0a2 2 0 100 4 2 2 0 000-4zm7 0a2 2 0 100 4 2 2 0 000-4z"/></svg>
            </span>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Storage (S3 / Supabase)</h2>
          </div>
          {connState.storageConnected && <span style={connectedBadge}>Connected</span>}
        </div>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af', margin: '0 0 1rem' }}>
          List buckets, upload files, get public URLs
        </p>
        {connState.storageConnected ? (
          <div>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: '#d1d5db' }}>
              Provider: <strong>{connState.storageProvider === 's3' ? 'AWS S3' : 'Supabase Storage'}</strong> — Bucket: <strong>{connState.storageBucket}</strong>
            </p>
            <button onClick={handleStorageDisconnect} style={disconnectBtnStyle}>Disconnect</button>
          </div>
        ) : (
          <form onSubmit={handleStorageConnect}>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={labelStyle}>Provider</label>
              <select
                value={connState.storageProvider}
                onChange={(e) => updateState({ storageProvider: e.target.value as 's3' | 'supabase' })}
                style={{ ...inputStyle, appearance: 'none' }}
              >
                <option value="s3">AWS S3</option>
                <option value="supabase">Supabase Storage</option>
              </select>
            </div>
            {connState.storageProvider === 's3' && (
              <>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={labelStyle}>Access Key ID</label>
                  <input type="password" value={connState.storageAccessKey}
                    onChange={(e) => updateState({ storageAccessKey: e.target.value })}
                    placeholder="AKIA..." style={inputStyle} />
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={labelStyle}>Secret Access Key</label>
                  <input type="password" value={connState.storageSecretKey}
                    onChange={(e) => updateState({ storageSecretKey: e.target.value })}
                    placeholder="wJalrXUtnFEMI..." style={inputStyle} />
                </div>
              </>
            )}
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={labelStyle}>Bucket Name</label>
              <input type="text" value={connState.storageBucket}
                onChange={(e) => updateState({ storageBucket: e.target.value })}
                placeholder="my-bucket" style={inputStyle} />
            </div>
            {storageError && <p style={{ color: '#f87171', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>{storageError}</p>}
            <button type="submit" style={connectBtnStyle}>Connect Storage</button>
          </form>
        )}
      </section>

  function updateState(partial: Partial<ConnectorState>) {
    setConnState((prev) => {
      const next = { ...prev, ...partial };
      saveConnectorState(next);
      return next;
    });
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Connectors</h1>

      {/* GitHub Connector */}
      <div className="border rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">GitHub</h2>
          <span className={`px-2 py-1 rounded text-sm ${connState.githubConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {connState.githubConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        {!connState.githubConnected ? (
          <div className="space-y-2">
            <input
              type="password"
              placeholder="GitHub Personal Access Token"
              value={connState.modalToken}
              onChange={(e) => updateState({ modalToken: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Repository (owner/repo)"
              value={connState.modalRepo}
              onChange={(e) => updateState({ modalRepo: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            />
            <button
              onClick={() => {
                if (connState.modalToken) updateState({ githubConnected: true });
              }}
              className="bg-gray-900 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
            >
              Connect GitHub
            </button>
          </div>
        ) : (
          <div className="space-y-1 text-sm text-gray-600">
            <p>Repo: <span className="font-medium text-gray-900">{connState.modalRepo || '(none)'}</span></p>
            <button
              onClick={() => updateState({ githubConnected: false, modalToken: '', modalRepo: '' })}
              className="text-red-600 hover:underline text-xs"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* Supabase Connector */}
      <div className="border rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Supabase</h2>
          <span className={`px-2 py-1 rounded text-sm ${connState.supabaseConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {connState.supabaseConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        {!connState.supabaseConnected ? (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Supabase Project URL"
              value={connState.supabaseUrl}
              onChange={(e) => updateState({ supabaseUrl: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            />
            <input
              type="password"
              placeholder="Supabase Anon Key"
              value={connState.supabaseAnonKey}
              onChange={(e) => updateState({ supabaseAnonKey: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            />
            <button
              onClick={() => {
                if (connState.supabaseUrl && connState.supabaseAnonKey) {
                  updateState({ supabaseConnected: true });
                }
              }}
              className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-500"
            >
              Connect Supabase
            </button>
          </div>
        ) : (
          <div className="space-y-1 text-sm text-gray-600">
            <p>URL: <span className="font-medium text-gray-900">{connState.supabaseUrl}</span></p>
            <button
              onClick={() => updateState({ supabaseConnected: false, supabaseUrl: '', supabaseAnonKey: '' })}
              className="text-red-600 hover:underline text-xs"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
      {/* Maps Section */}
      <section style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ width: 28, height: 28, borderRadius: 6, background: '#22c55e', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', color: '#1f2937' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/></svg>
            </span>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Maps</h2>
          </div>
          {connState.mapsConnected && <span style={connectedBadge}>Connected</span>}
        </div>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af', margin: '0 0 1rem' }}>
          Google Maps API key config, geocoding test
        </p>
        {connState.mapsConnected ? (
          <div>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: '#d1d5db' }}>
              Google Maps API key configured.
            </p>
            <button onClick={handleMapsDisconnect} style={disconnectBtnStyle}>Disconnect</button>
          </div>
        ) : (
          <form onSubmit={handleMapsConnect}>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={labelStyle}>Google Maps API Key</label>
              <input type="password" value={connState.mapsApiKey}
                onChange={(e) => updateState({ mapsApiKey: e.target.value })}
                placeholder="AIzaSy..." style={inputStyle} />
            </div>
            {mapsError && <p style={{ color: '#f87171', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>{mapsError}</p>}
            <button type="submit" style={connectBtnStyle}>Connect Maps</button>
          </form>
        )}
      </section>
    </div>
  );
};

export default ConnectorComponent;