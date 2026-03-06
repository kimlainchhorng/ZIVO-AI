'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, Rocket, CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = {
  bgPanel: '#0f1120',
  bgCard: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  accent: '#6366f1',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
};

type DeployTarget = 'github' | 'vercel';
type DeployStatus = 'idle' | 'deploying' | 'success' | 'error';

// ─── Props ────────────────────────────────────────────────────────────────────

interface DeployModalProps {
  projectId: string;
  onClose: () => void;
  initialTarget?: DeployTarget;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DeployModal({ projectId, onClose, initialTarget = 'github' }: DeployModalProps) {
  const [target, setTarget] = useState<DeployTarget>(initialTarget);
  const [status, setStatus] = useState<DeployStatus>('idle');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // GitHub fields
  const [repoName, setRepoName] = useState('');
  const [githubToken, setGithubToken] = useState('');

  // Vercel fields
  const [vercelToken, setVercelToken] = useState(
    typeof window !== 'undefined' ? localStorage.getItem('zivo_vercel_token') ?? '' : ''
  );
  const [teamId, setTeamId] = useState('');

  async function handleDeploy() {
    if (!projectId) { toast.error('No project selected'); return; }
    setStatus('deploying');
    setErrorMsg(null);
    setResultUrl(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('zivo_supabase_token') : null;

      if (target === 'github') {
        if (!repoName.trim()) { setStatus('idle'); toast.error('Enter a repository name'); return; }
        if (!githubToken.trim()) { setStatus('idle'); toast.error('Enter your GitHub token'); return; }

        const res = await fetch('/api/publish-github', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ projectId, repoName: repoName.trim(), token: githubToken.trim() }),
        });
        const data = await res.json() as { repoUrl?: string; error?: string };
        if (!res.ok) throw new Error(data.error ?? 'GitHub publish failed');
        setResultUrl(data.repoUrl ?? null);
        setStatus('success');
        toast.success('Published to GitHub!');
      } else {
        if (!vercelToken.trim()) { setStatus('idle'); toast.error('Enter your Vercel token'); return; }
        if (typeof window !== 'undefined') localStorage.setItem('zivo_vercel_token', vercelToken.trim());

        const res = await fetch('/api/deploy-vercel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ projectId, token: vercelToken.trim(), teamId: teamId.trim() || undefined }),
        });
        const data = await res.json() as { deployUrl?: string; error?: string };
        if (!res.ok) throw new Error(data.error ?? 'Vercel deploy failed');
        setResultUrl(data.deployUrl ?? null);
        setStatus('success');
        toast.success('Deployed to Vercel!');
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message ?? 'Deploy failed');
      setStatus('error');
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: '14px', width: '480px', maxWidth: '100%', padding: '1.75rem' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>Deploy Project</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1 }}>×</button>
        </div>

        {/* Target selector */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {([
            { id: 'github' as const, label: 'GitHub', icon: Github },
            { id: 'vercel' as const, label: 'Vercel', icon: Rocket },
          ]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setTarget(id); setStatus('idle'); setErrorMsg(null); setResultUrl(null); }}
              style={{
                flex: 1, padding: '0.625rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
                background: target === id ? 'rgba(99,102,241,0.15)' : COLORS.bgCard,
                border: `1px solid ${target === id ? COLORS.accent : COLORS.border}`,
                borderRadius: '8px', cursor: 'pointer',
                color: target === id ? COLORS.accent : COLORS.textSecondary,
                fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.15s',
              }}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* GitHub form */}
        {target === 'github' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Field label="Repository Name" value={repoName} onChange={setRepoName} placeholder="my-project" />
            <Field label="GitHub Personal Access Token" value={githubToken} onChange={setGithubToken} placeholder="ghp_…" type="password" hint="Needs repo scope" />
          </div>
        )}

        {/* Vercel form */}
        {target === 'vercel' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Field label="Vercel Token" value={vercelToken} onChange={setVercelToken} placeholder="…" type="password" hint="From vercel.com/account/tokens" />
            <Field label="Team ID (optional)" value={teamId} onChange={setTeamId} placeholder="team_…" />
          </div>
        )}

        {/* Status */}
        <AnimatePresence mode="wait">
          {status === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <CheckCircle2 size={16} color={COLORS.success} />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: COLORS.success }}>Deployed successfully!</div>
                {resultUrl && (
                  <a href={resultUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8125rem', color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                    {resultUrl} <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </motion.div>
          )}
          {status === 'error' && (
            <motion.div key="error" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <XCircle size={16} color={COLORS.error} />
              <div style={{ fontSize: '0.875rem', color: '#fca5a5' }}>{errorMsg}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Deploy button */}
        {status !== 'success' && (
          <button
            onClick={handleDeploy}
            disabled={status === 'deploying'}
            style={{ width: '100%', marginTop: '1.25rem', padding: '0.75rem', background: status === 'deploying' ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '8px', cursor: status === 'deploying' ? 'not-allowed' : 'pointer', color: '#fff', fontWeight: 700, fontSize: '0.9375rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            {status === 'deploying' ? (
              <><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Loader2 size={16} /></motion.span> Deploying…</>
            ) : (
              <>{target === 'github' ? <Github size={16} /> : <Rocket size={16} />} Deploy to {target === 'github' ? 'GitHub' : 'Vercel'}</>
            )}
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Field Helper ─────────────────────────────────────────────────────────────

function Field({
  label, value, onChange, placeholder, type = 'text', hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
}) {
  return (
    <div>
      <label style={{ fontSize: '0.75rem', color: COLORS.textMuted, display: 'block', marginBottom: '0.375rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', boxSizing: 'border-box', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '0.5rem 0.75rem', color: COLORS.textPrimary, fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none' }}
        onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.accent; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.border; }}
      />
      {hint && <div style={{ fontSize: '0.6875rem', color: COLORS.textMuted, marginTop: '0.25rem' }}>{hint}</div>}
    </div>
  );
}
