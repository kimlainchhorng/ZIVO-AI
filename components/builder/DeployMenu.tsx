'use client';

import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface DeployMenuProps {
  projectId: string;
  githubRepo?: string;
  vercelUrl?: string;
  deployStatus?: string;
}

const COLORS = {
  bgPanel: '#0f1120',
  bgItemHover: 'rgba(255,255,255,0.08)',
  border: 'rgba(255,255,255,0.08)',
  accent: '#6366f1',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    success: { color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
    building: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    pending: { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
    error: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  };
  const s = map[status] ?? map.pending;
  return (
    <span
      style={{
        fontSize: '0.5625rem',
        fontWeight: 700,
        color: s.color,
        background: s.bg,
        padding: '0.1rem 0.4rem',
        borderRadius: '4px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}
    >
      {status}
    </span>
  );
}

type DeployTarget = 'github' | 'vercel';

export default function DeployMenu({
  projectId,
  githubRepo,
  vercelUrl,
  deployStatus,
}: DeployMenuProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<DeployTarget | null>(null);
  const [showGithubForm, setShowGithubForm] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [repoName, setRepoName] = useState('');

  const handleVercelDeploy = async () => {
    setLoading('vercel');
    setOpen(false);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json() as { deployUrl?: string; error?: string };
      if (data.deployUrl) {
        window.open(data.deployUrl, '_blank');
      }
    } catch (err) {
      console.error('[deploy-vercel]', err);
    } finally {
      setLoading(null);
    }
  };

  const handleGithubPublish = async () => {
    if (!githubToken || !repoName) return;
    setLoading('github');
    setShowGithubForm(false);
    setOpen(false);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetch('/api/publish-github', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ projectId, repoName, githubToken }),
      });
      const data = await res.json() as { repoUrl?: string; error?: string };
      if (data.repoUrl) {
        window.open(data.repoUrl, '_blank');
      }
    } catch (err) {
      console.error('[publish-github]', err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <DropdownMenu.Root open={open} onOpenChange={setOpen}>
        <DropdownMenu.Trigger asChild>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.4375rem 0.875rem',
              background: loading ? 'rgba(99,102,241,0.15)' : COLORS.accent,
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
              outline: 'none',
            }}
          >
            {loading ? '⏳' : '🚀'} Deploy
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            sideOffset={6}
            align="end"
            style={{
              background: COLORS.bgPanel,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '10px',
              padding: '0.375rem',
              minWidth: '220px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
              zIndex: 100,
            }}
          >
            <div
              style={{
                padding: '0.375rem 0.625rem 0.5rem',
                fontSize: '0.625rem',
                fontWeight: 700,
                color: COLORS.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Deploy To
            </div>

            {/* GitHub */}
            <DropdownMenu.Item
              onSelect={(e) => {
                e.preventDefault();
                setShowGithubForm(true);
                setOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.5rem 0.625rem',
                borderRadius: '7px',
                cursor: 'pointer',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = COLORS.bgItemHover;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'transparent';
              }}
            >
              <span style={{ fontSize: '1rem', width: '20px', textAlign: 'center' }}>🐙</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: COLORS.textPrimary }}>
                  Publish to GitHub
                </div>
                {githubRepo ? (
                  <div style={{ fontSize: '0.6875rem', color: COLORS.textMuted }}>{githubRepo}</div>
                ) : (
                  <div style={{ fontSize: '0.6875rem', color: COLORS.textMuted }}>
                    Create new repository
                  </div>
                )}
              </div>
              {githubRepo && <StatusBadge status="success" />}
            </DropdownMenu.Item>

            {/* Vercel */}
            <DropdownMenu.Item
              onSelect={(e) => {
                e.preventDefault();
                handleVercelDeploy();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.5rem 0.625rem',
                borderRadius: '7px',
                cursor: 'pointer',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = COLORS.bgItemHover;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'transparent';
              }}
            >
              <span style={{ fontSize: '1rem', width: '20px', textAlign: 'center' }}>▲</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: COLORS.textPrimary }}>
                  Deploy to Vercel
                </div>
                {vercelUrl ? (
                  <a
                    href={vercelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ fontSize: '0.6875rem', color: COLORS.accent }}
                  >
                    {vercelUrl.replace('https://', '')}
                  </a>
                ) : (
                  <div style={{ fontSize: '0.6875rem', color: COLORS.textMuted }}>
                    One-click deploy
                  </div>
                )}
              </div>
              {deployStatus && <StatusBadge status={deployStatus} />}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* GitHub publish form overlay */}
      {showGithubForm && (
        <div
          onClick={() => setShowGithubForm(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: COLORS.bgPanel,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '12px',
              padding: '1.5rem',
              width: '360px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: COLORS.textPrimary }}>
              🐙 Publish to GitHub
            </h3>

            <div>
              <label style={{ fontSize: '0.75rem', color: COLORS.textMuted, display: 'block', marginBottom: '0.375rem' }}>
                Repository Name
              </label>
              <input
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder="my-awesome-project"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  color: COLORS.textPrimary,
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: COLORS.textMuted, display: 'block', marginBottom: '0.375rem' }}>
                GitHub Personal Access Token
              </label>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  color: COLORS.textPrimary,
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <p style={{ fontSize: '0.6875rem', color: COLORS.textMuted, margin: '0.375rem 0 0' }}>
                Needs <code>repo</code> scope. Never stored on our servers.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setShowGithubForm(false)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  color: COLORS.textSecondary,
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleGithubPublish}
                disabled={!githubToken || !repoName}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  background: !githubToken || !repoName ? 'rgba(99,102,241,0.3)' : COLORS.accent,
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: !githubToken || !repoName ? 'not-allowed' : 'pointer',
                }}
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
