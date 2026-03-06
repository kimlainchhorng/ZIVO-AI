'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, RefreshCw, Github, Triangle } from 'lucide-react';
import SidebarLayout from '@/components/layout/SidebarLayout';

interface Deployment {
  id: string;
  projectId: string;
  provider: 'vercel' | 'github';
  deployUrl?: string;
  githubRepo?: string;
  githubBranch?: string;
  status: 'pending' | 'building' | 'success' | 'error';
  errorMessage?: string;
  deployedAt?: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  pending:  { bg: 'rgba(234,179,8,0.15)',   color: '#eab308', label: 'Pending'  },
  building: { bg: 'rgba(59,130,246,0.15)',  color: '#3b82f6', label: 'Building' },
  success:  { bg: 'rgba(16,185,129,0.15)',  color: '#10b981', label: 'Success'  },
  error:    { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444', label: 'Error'    },
};

function getStoredToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('zivo_supabase_token');
}

export default function DeployPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const token = getStoredToken();

  async function fetchDeployments(pid?: string) {
    if (!token) { setLoading(false); return; }
    const q = pid ? `?projectId=${pid}` : '';
    if (!q) { setLoading(false); return; }
    try {
      const res = await fetch(`/api/deploy/status${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setDeployments(data.deployments ?? []);
    } finally {
      setLoading(false);
    }
  }

  // Auto-refresh for pending/building deployments
  useEffect(() => {
    const hasPending = deployments.some((d) => d.status === 'pending' || d.status === 'building');
    if (hasPending) {
      intervalRef.current = setInterval(() => {
        fetchDeployments(projectId);
      }, 5000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [deployments, projectId]);

  function handleSearch() {
    setLoading(true);
    fetchDeployments(projectId);
  }

  return (
    <SidebarLayout>
      <div style={{ padding: '2rem', minHeight: '100vh', background: '#0a0a0f', color: '#f1f5f9' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f1f5f9' }}>Deployments</h1>
          <p style={{ color: '#64748b', marginTop: '0.25rem' }}>Track your GitHub and Vercel deployments</p>
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <input
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="Enter Project ID (UUID)..."
            style={{
              flex: 1, padding: '0.625rem 0.75rem', borderRadius: '8px',
              background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)',
              color: '#f1f5f9', fontSize: '0.9rem',
            }}
          />
          <button
            onClick={handleSearch}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.625rem 1.25rem', borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600,
            }}
          >
            <RefreshCw size={16} /> Load
          </button>
        </div>

        {/* Deployments List */}
        {loading ? (
          <div style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>Loading...</div>
        ) : deployments.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '4rem',
            border: '1px dashed rgba(99,102,241,0.2)', borderRadius: '12px', color: '#475569',
          }}>
            No deployments found. Enter a Project ID to load deployments.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {deployments.map((dep, idx) => {
              const statusStyle = STATUS_COLORS[dep.status] ?? STATUS_COLORS.pending;
              const ProviderIcon = dep.provider === 'github' ? Github : Triangle;

              return (
                <motion.div
                  key={dep.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1rem 1.25rem', borderRadius: '10px',
                    background: 'rgba(15,15,26,0.8)', border: '1px solid rgba(99,102,241,0.1)',
                  }}
                >
                  {/* Provider */}
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    background: dep.provider === 'github' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <ProviderIcon size={18} color={dep.provider === 'github' ? '#f1f5f9' : '#000'} fill={dep.provider === 'vercel' ? '#f1f5f9' : 'none'} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.9rem' }}>
                        {dep.provider === 'github' ? dep.githubRepo ?? 'GitHub' : 'Vercel'}
                      </span>
                      {dep.githubBranch && (
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>→ {dep.githubBranch}</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                      {dep.deployedAt
                        ? `Deployed ${new Date(dep.deployedAt).toLocaleString()}`
                        : `Created ${new Date(dep.createdAt).toLocaleString()}`}
                    </div>
                    {dep.errorMessage && (
                      <div style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '0.25rem' }}>
                        {dep.errorMessage}
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <span style={{
                    padding: '4px 12px', borderRadius: '20px',
                    fontSize: '0.8rem', fontWeight: 600,
                    background: statusStyle.bg, color: statusStyle.color, flexShrink: 0,
                  }}>
                    {statusStyle.label}
                  </span>

                  {/* Link */}
                  {dep.deployUrl && (
                    <a
                      href={dep.deployUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#818cf8', flexShrink: 0 }}
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                  {dep.githubRepo && !dep.deployUrl && (
                    <a
                      href={`https://github.com/${dep.githubRepo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#818cf8', flexShrink: 0 }}
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
