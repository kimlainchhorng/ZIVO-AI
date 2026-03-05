'use client';

import { motion } from 'framer-motion';

export type BuildStageStatus = 'pending' | 'active' | 'done' | 'error';

export interface BuildStage {
  id: string;
  label: string;
  icon: string;
  status: BuildStageStatus;
  duration?: number;
}

interface BuildProgressIndicatorProps {
  stages: BuildStage[];
  currentStage: number;
}

const COLORS = {
  bg: '#0a0b14',
  bgPanel: '#0f1120',
  bgCard: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  accent: '#6366f1',
  accentGradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
};

function StageIcon({ status, icon }: { status: BuildStageStatus; icon: string }) {
  if (status === 'done') {
    return <span style={{ color: COLORS.success, fontSize: 16 }}>✓</span>;
  }
  if (status === 'error') {
    return <span style={{ color: COLORS.error, fontSize: 16 }}>✗</span>;
  }
  return <span style={{ fontSize: 16 }}>{icon}</span>;
}

export default function BuildProgressIndicator({ stages, currentStage }: BuildProgressIndicatorProps) {
  return (
    <div
      style={{
        background: COLORS.bgPanel,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        overflowX: 'auto',
      }}
    >
      {stages.map((stage, index) => {
        const isActive = stage.status === 'active' || index === currentStage;
        const isDone = stage.status === 'done';
        const isError = stage.status === 'error';

        const dotColor = isDone
          ? COLORS.success
          : isError
          ? COLORS.error
          : isActive
          ? COLORS.accent
          : COLORS.textMuted;

        return (
          <div key={stage.id} style={{ display: 'flex', alignItems: 'center', flex: index < stages.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 80 }}>
              <motion.div
                animate={isActive ? { scale: [1, 1.15, 1], opacity: [1, 0.7, 1] } : { scale: 1 }}
                transition={isActive ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : {}}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: isDone
                    ? `${COLORS.success}22`
                    : isError
                    ? `${COLORS.error}22`
                    : isActive
                    ? `${COLORS.accent}22`
                    : COLORS.bgCard,
                  border: `2px solid ${dotColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'default',
                }}
              >
                <StageIcon status={stage.status} icon={stage.icon} />
              </motion.div>

              <span
                style={{
                  fontSize: 11,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? COLORS.textPrimary : isDone ? COLORS.success : isError ? COLORS.error : COLORS.textMuted,
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {stage.label}
              </span>

              {stage.duration !== undefined && (
                <span style={{ fontSize: 10, color: COLORS.textMuted }}>
                  {stage.duration < 1000 ? `${stage.duration}ms` : `${(stage.duration / 1000).toFixed(1)}s`}
                </span>
              )}
            </div>

            {index < stages.length - 1 && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: isDone ? 1 : 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{
                  flex: 1,
                  height: 2,
                  background: COLORS.success,
                  transformOrigin: 'left',
                  marginBottom: 20,
                  minWidth: 20,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: COLORS.border,
                    zIndex: -1,
                  }}
                />
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}
