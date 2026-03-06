'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Version {
  id: string;
  version_number: number;
  label?: string;
  prompt?: string;
  style_preset?: string;
  created_at: string;
}

interface VersionHistoryPanelProps {
  projectId: string;
  onRestore: (versionId: string) => void;
  onCompare: (v1: string, v2: string) => void;
}

const COLORS = {
  bgCard: 'rgba(255,255,255,0.04)',
  bgCardSelected: 'rgba(99,102,241,0.1)',
  border: 'rgba(255,255,255,0.08)',
  borderSelected: '#6366f1',
  accent: '#6366f1',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function VersionHistoryPanel({
  projectId,
  onRestore,
  onCompare,
}: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    fetch(`/api/projects/${projectId}/versions`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((data: { versions?: Version[] } | Version[]) => {
        const list = Array.isArray(data) ? data : (data.versions ?? []);
        setVersions(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectId]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((v) => v !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const handleRestore = async (versionId: string) => {
    setRestoring(versionId);
    try {
      onRestore(versionId);
    } finally {
      setRestoring(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center', color: COLORS.textMuted, fontSize: '0.8125rem' }}>
        Loading versions…
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🕰️</div>
        <p style={{ fontSize: '0.8125rem', color: COLORS.textMuted, margin: 0 }}>
          No saved versions yet. Save your project to create a version.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {selected.length === 2 && (
        <button
          onClick={() => onCompare(selected[0], selected[1])}
          style={{
            padding: '0.5rem',
            background: 'rgba(99,102,241,0.1)',
            border: `1px solid ${COLORS.accent}`,
            borderRadius: '8px',
            color: COLORS.accent,
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: '0.25rem',
          }}
        >
          Compare Selected Versions →
        </button>
      )}

      {selected.length === 1 && (
        <p style={{ fontSize: '0.6875rem', color: COLORS.textMuted, margin: 0 }}>
          Select another version to compare
        </p>
      )}

      <AnimatePresence>
        {versions.map((v) => {
          const isSelected = selected.includes(v.id);
          return (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                padding: '0.75rem',
                background: isSelected ? COLORS.bgCardSelected : COLORS.bgCard,
                border: `1px solid ${isSelected ? COLORS.borderSelected : COLORS.border}`,
                borderRadius: '8px',
                cursor: 'pointer',
              }}
              onClick={() => toggleSelect(v.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: COLORS.textPrimary }}>
                  v{v.version_number}
                  {v.label && (
                    <span style={{ marginLeft: '0.375rem', fontWeight: 400, color: COLORS.textMuted }}>
                      {v.label}
                    </span>
                  )}
                </span>
                <span style={{ fontSize: '0.6875rem', color: COLORS.textMuted }}>
                  {formatDate(v.created_at)}
                </span>
              </div>

              {v.prompt && (
                <p
                  style={{
                    fontSize: '0.6875rem',
                    color: COLORS.textSecondary,
                    margin: '0 0 0.375rem',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {v.prompt}
                </p>
              )}

              {v.style_preset && (
                <span
                  style={{
                    fontSize: '0.5625rem',
                    padding: '0.125rem 0.375rem',
                    background: 'rgba(99,102,241,0.1)',
                    borderRadius: '4px',
                    color: COLORS.accent,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  {v.style_preset.replace(/_/g, ' ')}
                </span>
              )}

              <div
                style={{ display: 'flex', gap: '0.375rem', marginTop: '0.5rem' }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => handleRestore(v.id)}
                  disabled={restoring === v.id}
                  style={{
                    flex: 1,
                    padding: '0.25rem 0.5rem',
                    background: restoring === v.id ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.1)',
                    border: `1px solid ${COLORS.accent}`,
                    borderRadius: '6px',
                    color: COLORS.accent,
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    cursor: restoring === v.id ? 'wait' : 'pointer',
                  }}
                >
                  {restoring === v.id ? 'Restoring…' : 'Restore'}
                </button>
                <button
                  onClick={() => toggleSelect(v.id)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    background: isSelected ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isSelected ? COLORS.accent : COLORS.border}`,
                    borderRadius: '6px',
                    color: isSelected ? COLORS.accent : COLORS.textMuted,
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isSelected ? '✓ Selected' : 'Compare'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
