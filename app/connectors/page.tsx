"use client";

import { useState } from 'react';

interface ConnectorState {
  githubConnected: boolean;
  modalToken: string;
  modalRepo: string;
  supabaseConnected: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

const DEFAULT_STATE: ConnectorState = {
  githubConnected: false,
  modalToken: '',
  modalRepo: '',
  supabaseConnected: false,
  supabaseUrl: '',
  supabaseAnonKey: '',
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

const ConnectorComponent = () => {
  // Lazy initializer loads persisted state from localStorage on first render
  const [connState, setConnState] = useState<ConnectorState>(loadConnectorState);
  const [githubError, setGithubError] = useState<string>('');
  const [supabaseError, setSupabaseError] = useState<string>('');

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

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', padding: '0 1rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Connectors</h1>

      {/* GitHub Section */}
      <section style={{ marginBottom: '2rem', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>GitHub</h2>
          {connState.githubConnected && (
            <span style={{ fontSize: '0.8rem', color: '#16a34a', background: '#dcfce7', borderRadius: 6, padding: '2px 8px' }}>
              Connected
            </span>
          )}
        </div>
        {connState.githubConnected ? (
          <div>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: '#374151' }}>
              Repository: <strong>{connState.modalRepo}</strong>
            </p>
            <button
              onClick={handleGithubDisconnect}
              style={{ padding: '0.5rem 1rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 500 }}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <form onSubmit={handleGithubConnect}>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 4 }}>
                Personal Access Token
              </label>
              <input
                type="password"
                value={connState.modalToken}
                onChange={(e) => updateState({ modalToken: e.target.value })}
                placeholder="ghp_xxxxxxxxxxxx"
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 7, fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 4 }}>
                Repository (owner/repo)
              </label>
              <input
                type="text"
                value={connState.modalRepo}
                onChange={(e) => updateState({ modalRepo: e.target.value })}
                placeholder="owner/my-project"
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 7, fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>
            {githubError && (
              <p style={{ color: '#dc2626', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>{githubError}</p>
            )}
            <button
              type="submit"
              style={{ padding: '0.5rem 1.25rem', background: '#1f2937', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 500 }}
            >
              Connect GitHub
            </button>
          </form>
        )}
      </section>

      {/* Supabase Section */}
      <section style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Supabase</h2>
          {connState.supabaseConnected && (
            <span style={{ fontSize: '0.8rem', color: '#16a34a', background: '#dcfce7', borderRadius: 6, padding: '2px 8px' }}>
              Connected
            </span>
          )}
        </div>
        {connState.supabaseConnected ? (
          <div>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: '#374151' }}>
              Project URL: <strong>{connState.supabaseUrl}</strong>
            </p>
            <button
              onClick={handleSupabaseDisconnect}
              style={{ padding: '0.5rem 1rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 500 }}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <form onSubmit={handleSupabaseConnect}>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 4 }}>
                Project URL
              </label>
              <input
                type="url"
                value={connState.supabaseUrl}
                onChange={(e) => updateState({ supabaseUrl: e.target.value })}
                placeholder="https://xyzcompany.supabase.co"
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 7, fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 4 }}>
                Anon / Public Key
              </label>
              <input
                type="password"
                value={connState.supabaseAnonKey}
                onChange={(e) => updateState({ supabaseAnonKey: e.target.value })}
                placeholder="eyJhbGci..."
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 7, fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>
            {supabaseError && (
              <p style={{ color: '#dc2626', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>{supabaseError}</p>
            )}
            <button
              type="submit"
              style={{ padding: '0.5rem 1.25rem', background: '#1f2937', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 500 }}
            >
              Connect Supabase
            </button>
          </form>
        )}
      </section>
    </div>
  );
};

export default ConnectorComponent;