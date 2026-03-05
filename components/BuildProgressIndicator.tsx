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

/** Map icon name strings → compact SVG icons */
function StageIcon({ status, icon }: { status: BuildStageStatus; icon: string }) {
  const size = 13;
  const s: React.CSSProperties = { display: 'inline-block', flexShrink: 0 };

  if (status === 'done') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={COLORS.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    );
  }
  if (status === 'error') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={COLORS.error} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={s}>
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    );
  }

  const iconColor = 'currentColor';
  switch (icon) {
    case 'edit':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>;
    case 'search':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
    case 'fileText':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>;
    case 'zap':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
    case 'check':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
    case 'settings':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'eye':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'rocket':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>;
    default:
      return <span style={{ fontSize: 11, color: 'currentColor' }}>{icon.charAt(0).toUpperCase()}</span>;
  }
}

export default function BuildProgressIndicator({ stages, currentStage }: BuildProgressIndicatorProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        overflowX: 'auto',
        padding: '6px 0',
      }}
    >
      {stages.map((stage, index) => {
        const isActive = stage.status === 'active' || (stage.status === 'pending' && index === currentStage);
        const isDone = stage.status === 'done';
        const isError = stage.status === 'error';

        // Pill accent colours
        const pillBg = isDone
          ? 'rgba(16,185,129,0.12)'
          : isError
          ? 'rgba(239,68,68,0.12)'
          : isActive
          ? 'rgba(99,102,241,0.18)'
          : 'rgba(255,255,255,0.03)';

        const pillBorder = isDone
          ? 'rgba(16,185,129,0.35)'
          : isError
          ? 'rgba(239,68,68,0.35)'
          : isActive
          ? 'rgba(99,102,241,0.5)'
          : 'rgba(255,255,255,0.07)';

        const pillColor = isDone
          ? COLORS.success
          : isError
          ? COLORS.error
          : isActive
          ? COLORS.textPrimary
          : COLORS.textMuted;

        return (
          <div key={stage.id} style={{ display: 'flex', alignItems: 'center', flex: index < stages.length - 1 ? 1 : 'none' }}>
            {/* Stage pill */}
            <motion.div
              animate={
                isActive
                  ? { boxShadow: ['0 0 0px rgba(99,102,241,0)', '0 0 8px rgba(99,102,241,0.5)', '0 0 0px rgba(99,102,241,0)'] }
                  : { boxShadow: '0 0 0px transparent' }
              }
              transition={isActive ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : {}}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 20,
                background: pillBg,
                border: `1px solid ${pillBorder}`,
                color: pillColor,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'background 0.3s, border-color 0.3s, color 0.3s',
              }}
            >
              <StageIcon status={stage.status} icon={stage.icon} />
              <span style={{ fontSize: 11, fontWeight: isActive || isDone ? 600 : 400, letterSpacing: '-0.01em' }}>
                {stage.label}
              </span>
              {stage.duration !== undefined && isDone && (
                <span style={{ fontSize: 9, color: COLORS.textMuted, marginLeft: 2 }}>
                  {stage.duration < 1000 ? `${stage.duration}ms` : `${(stage.duration / 1000).toFixed(1)}s`}
                </span>
              )}
              {isActive && (
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: COLORS.accent, flexShrink: 0 }}
                />
              )}
            </motion.div>

            {/* Connector line */}
            {index < stages.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: COLORS.border,
                  minWidth: 8,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: isDone ? 1 : 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: COLORS.success,
                    transformOrigin: 'left',
                  }}
                />
                {isActive && !isDone && (
                  <motion.div
                    animate={{ x: ['-100%', '110%'] }}
                    transition={{ duration: 1.0, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: `linear-gradient(90deg, transparent, ${COLORS.accent}99, transparent)`,
                    }}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
