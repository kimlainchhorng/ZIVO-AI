'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface VersionSnapshot {
  id: string;
  version_number: number;
  label?: string;
  prompt?: string;
  style_preset?: string;
  created_at: string;
  sections?: SectionDiff[];
}

interface SectionDiff {
  id: string;
  type: string;
  title: string;
  content: string;
}

interface VersionCompareProps {
  projectId: string;
  versionAId: string;
  versionBId: string;
  onClose: () => void;
}

const COLORS = {
  bgPanel: '#0f1120',
  bgCard: 'rgba(255,255,255,0.04)',
  bgAdded: 'rgba(16,185,129,0.08)',
  bgRemoved: 'rgba(239,68,68,0.08)',
  bgChanged: 'rgba(245,158,11,0.08)',
  borderAdded: 'rgba(16,185,129,0.3)',
  borderRemoved: 'rgba(239,68,68,0.3)',
  borderChanged: 'rgba(245,158,11,0.3)',
  border: 'rgba(255,255,255,0.08)',
  accent: '#6366f1',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
};

function getSectionStatus(
  id: string,
  aIds: Set<string>,
  bIds: Set<string>,
  aSections: SectionDiff[],
  bSections: SectionDiff[]
): 'added' | 'removed' | 'changed' | 'same' {
  const inA = aIds.has(id);
  const inB = bIds.has(id);
  if (inA && !inB) return 'removed';
  if (!inA && inB) return 'added';
  const a = aSections.find((s) => s.id === id);
  const b = bSections.find((s) => s.id === id);
  if (a && b && a.content !== b.content) return 'changed';
  return 'same';
}

function SectionCard({
  section,
  status,
  side,
}: {
  section: SectionDiff;
  status: 'added' | 'removed' | 'changed' | 'same';
  side: 'a' | 'b';
}) {
  const bgMap = { added: COLORS.bgAdded, removed: COLORS.bgRemoved, changed: COLORS.bgChanged, same: COLORS.bgCard };
  const borderMap = { added: COLORS.borderAdded, removed: COLORS.borderRemoved, changed: COLORS.borderChanged, same: COLORS.border };
  const colorMap = { added: '#10b981', removed: '#ef4444', changed: '#f59e0b', same: COLORS.textMuted };

  // Determine the display label from each side's perspective
  let sideLabel = '';
  if (status !== 'same') {
    if (status === 'changed') {
      sideLabel = side === 'a' ? '~ Old version' : '~ New version';
    } else if (status === 'removed') {
      // present only in A, missing in B
      sideLabel = side === 'a' ? '− Only in A' : '';
    } else if (status === 'added') {
      // present only in B, missing in A
      sideLabel = side === 'b' ? '+ Only in B' : '';
    }
  }

  return (
    <div
      style={{
        padding: '0.625rem',
        background: bgMap[status],
        border: `1px solid ${borderMap[status]}`,
        borderRadius: '8px',
        marginBottom: '0.375rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: COLORS.textPrimary }}>
          {section.title}
        </span>
        {sideLabel && (
          <span style={{ fontSize: '0.5625rem', color: colorMap[status], fontWeight: 700 }}>
            {sideLabel}
          </span>
        )}
      </div>
      <div style={{ fontSize: '0.625rem', color: COLORS.textMuted }}>
        {section.type.replace(/_/g, ' ')}
      </div>
    </div>
  );
}

export default function VersionCompare({
  projectId,
  versionAId,
  versionBId,
  onClose,
}: VersionCompareProps) {
  const [versionA, setVersionA] = useState<VersionSnapshot | null>(null);
  const [versionB, setVersionB] = useState<VersionSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    Promise.all([
      fetch(`/api/projects/${projectId}/versions/${versionAId}`, { headers }).then((r) => r.json()),
      fetch(`/api/projects/${projectId}/versions/${versionBId}`, { headers }).then((r) => r.json()),
    ])
      .then(([a, b]: [VersionSnapshot, VersionSnapshot]) => {
        setVersionA(a);
        setVersionB(b);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectId, versionAId, versionBId]);

  if (loading) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: COLORS.textMuted,
          fontSize: '0.875rem',
        }}
      >
        Loading comparison…
      </div>
    );
  }

  if (!versionA || !versionB) return null;

  const aSections = versionA.sections ?? [];
  const bSections = versionB.sections ?? [];
  const aIds = new Set(aSections.map((s) => s.id));
  const bIds = new Set(bSections.map((s) => s.id));
  const allIds = Array.from(new Set([...aIds, ...bIds]));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '2rem',
        overflowY: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '900px',
          background: COLORS.bgPanel,
          border: `1px solid ${COLORS.border}`,
          borderRadius: '14px',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: COLORS.textPrimary }}>
            Version Comparison
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: '1.25rem' }}
          >
            ✕
          </button>
        </div>

        {/* Two-column */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: `1px solid ${COLORS.border}` }}>
          {/* Version A header */}
          <div style={{ padding: '0.875rem 1.25rem', borderRight: `1px solid ${COLORS.border}`, background: 'rgba(239,68,68,0.04)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444', marginBottom: '0.25rem' }}>VERSION A (older)</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: COLORS.textPrimary }}>v{versionA.version_number}</div>
            <div style={{ fontSize: '0.6875rem', color: COLORS.textMuted }}>
              {new Date(versionA.created_at).toLocaleString()}
            </div>
          </div>
          {/* Version B header */}
          <div style={{ padding: '0.875rem 1.25rem', background: 'rgba(16,185,129,0.04)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', marginBottom: '0.25rem' }}>VERSION B (newer)</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: COLORS.textPrimary }}>v{versionB.version_number}</div>
            <div style={{ fontSize: '0.6875rem', color: COLORS.textMuted }}>
              {new Date(versionB.created_at).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Sections comparison */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          {/* A sections */}
          <div style={{ padding: '1rem', borderRight: `1px solid ${COLORS.border}` }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: COLORS.textMuted, marginBottom: '0.625rem', textTransform: 'uppercase' }}>
              {aSections.length} Sections
            </div>
            {allIds.map((id) => {
              const section = aSections.find((s) => s.id === id);
              if (!section) return null;
              const status = getSectionStatus(id, aIds, bIds, aSections, bSections);
              return <SectionCard key={id} section={section} status={status} side="a" />;
            })}
            {aSections.length === 0 && (
              <p style={{ color: COLORS.textMuted, fontSize: '0.75rem' }}>No sections</p>
            )}
          </div>

          {/* B sections */}
          <div style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: COLORS.textMuted, marginBottom: '0.625rem', textTransform: 'uppercase' }}>
              {bSections.length} Sections
            </div>
            {allIds.map((id) => {
              const section = bSections.find((s) => s.id === id);
              if (!section) return null;
              const status = getSectionStatus(id, aIds, bIds, aSections, bSections);
              return <SectionCard key={id} section={section} status={status} side="b" />;
            })}
            {bSections.length === 0 && (
              <p style={{ color: COLORS.textMuted, fontSize: '0.75rem' }}>No sections</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderTop: `1px solid ${COLORS.border}`,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.625rem',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1.25rem',
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              color: COLORS.textSecondary,
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </motion.div>
  );
}
