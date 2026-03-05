'use client';

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

const STAGE_ICON_SIZE = 14;

/** Map icon name strings → compact SVG icons */
function StageIcon({ status, icon }: { status: BuildStageStatus; icon: string }) {
  const size = STAGE_ICON_SIZE;
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

  const iconColor = status === 'active' ? COLORS.accent : COLORS.textMuted;
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
      return <span style={{ fontSize: 11, color: iconColor }}>{icon.charAt(0).toUpperCase()}</span>;
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
        padding: '8px 0 4px',
      }}
    >
      {stages.map((stage, index) => {
        const isActive = stage.status === 'active' || (stage.status === 'pending' && index === currentStage);
        const isDone = stage.status === 'done';
        const isError = stage.status === 'error';

        const circleBg = isDone
          ? 'rgba(16,185,129,0.15)'
          : isError
          ? 'rgba(239,68,68,0.15)'
          : isActive
          ? 'rgba(99,102,241,0.20)'
          : 'rgba(255,255,255,0.04)';

        const circleBorder = isDone
          ? '#10b981'
          : isError
          ? '#ef4444'
          : isActive
          ? '#6366f1'
          : 'rgba(255,255,255,0.10)';

        const labelColor = isDone
          ? COLORS.success
          : isActive
          ? COLORS.accent
          : COLORS.textMuted;

        return (
          <div
            key={stage.id}
            style={{ display: 'flex', alignItems: 'center', flex: index < stages.length - 1 ? 1 : 'none' }}
          >
            {/* Stage circle + label */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: circleBg,
                  border: `2px solid ${circleBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: isActive ? 'stagePulse 2s infinite' : 'none',
                  transition: 'background 0.3s, border-color 0.3s',
                  flexShrink: 0,
                }}
              >
                <StageIcon status={stage.status} icon={stage.icon} />
              </div>
              <span
                style={{
                  fontSize: '0.6rem',
                  color: labelColor,
                  fontWeight: isActive || isDone ? 600 : 400,
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.3s',
                }}
              >
                {stage.label}
                {isDone && stage.duration !== undefined && (
                  <span style={{ marginLeft: 3, color: COLORS.textMuted, fontWeight: 400 }}>
                    {stage.duration < 1000 ? `${stage.duration}ms` : `${(stage.duration / 1000).toFixed(1)}s`}
                  </span>
                )}
              </span>
            </div>

            {/* Connector line between stages */}
            {index < stages.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: '2px',
                  background: isDone ? COLORS.success : COLORS.border,
                  minWidth: 16,
                  marginBottom: 16,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'background 0.35s',
                }}
              >
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: `linear-gradient(90deg, transparent, ${COLORS.accent}99, transparent)`,
                      animation: 'slideRight 1.2s ease-in-out infinite',
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
