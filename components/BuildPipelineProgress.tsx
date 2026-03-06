'use client';

import React from 'react';

export type PipelineStepStatus = 'pending' | 'active' | 'done' | 'error';

export interface PipelineStep {
  id: string;
  label: string;
  status: PipelineStepStatus;
  duration?: number;
}

interface BuildPipelineProgressProps {
  steps: PipelineStep[];
}

const COLORS = {
  accent: '#6366f1',
  success: '#10b981',
  error: '#ef4444',
  textMuted: '#475569',
  border: 'rgba(255,255,255,0.08)',
};

const DEFAULT_STEPS: PipelineStep[] = [
  { id: 'prompt', label: 'Prompt', status: 'pending' },
  { id: 'parse', label: 'Parse', status: 'pending' },
  { id: 'blueprint', label: 'Blueprint', status: 'pending' },
  { id: 'generate', label: 'Generate', status: 'pending' },
  { id: 'validate', label: 'Validate', status: 'pending' },
  { id: 'fix', label: 'Fix', status: 'pending' },
  { id: 'preview', label: 'Preview', status: 'pending' },
  { id: 'deploy', label: 'Deploy', status: 'pending' },
];

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={COLORS.success} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={COLORS.error} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function BuildPipelineProgress({ steps = DEFAULT_STEPS }: BuildPipelineProgressProps) {
  return (
    <>
      <style>{`
        @keyframes bppPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.5); }
          50% { box-shadow: 0 0 0 5px rgba(99,102,241,0); }
        }
        @keyframes bppSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          overflowX: 'auto',
          padding: '6px 0 2px',
          scrollbarWidth: 'none',
        }}
      >
        {steps.map((step, index) => {
          const isDone = step.status === 'done';
          const isActive = step.status === 'active';
          const isError = step.status === 'error';
          const isPending = step.status === 'pending';

          const dotBg = isDone
            ? 'rgba(16,185,129,0.2)'
            : isError
            ? 'rgba(239,68,68,0.2)'
            : isActive
            ? 'rgba(99,102,241,0.25)'
            : 'rgba(255,255,255,0.04)';

          const dotBorder = isDone
            ? COLORS.success
            : isError
            ? COLORS.error
            : isActive
            ? COLORS.accent
            : 'rgba(255,255,255,0.12)';

          const labelColor = isDone
            ? COLORS.success
            : isActive
            ? COLORS.accent
            : isError
            ? COLORS.error
            : COLORS.textMuted;

          return (
            <div
              key={step.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                flex: index < steps.length - 1 ? 1 : 'none',
                minWidth: 0,
              }}
            >
              {/* Step dot + label */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                {/* Dot */}
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: dotBg,
                    border: `2px solid ${dotBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.3s, border-color 0.3s',
                    animation: isActive ? 'bppPulse 1.8s ease-in-out infinite' : 'none',
                    flexShrink: 0,
                    position: 'relative',
                  }}
                >
                  {isDone && <CheckIcon />}
                  {isError && <XIcon />}
                  {isActive && (
                    <span
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: COLORS.accent,
                        animation: 'bppPulse 1.2s ease-in-out infinite',
                      }}
                    />
                  )}
                  {isPending && (
                    <span
                      style={{
                        display: 'inline-block',
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.2)',
                      }}
                    />
                  )}
                </div>
                {/* Label */}
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
                  {step.label}
                  {isDone && step.duration !== undefined && (
                    <span style={{ marginLeft: 2, color: COLORS.textMuted, fontWeight: 400 }}>
                      {step.duration < 1000 ? `${step.duration}ms` : `${(step.duration / 1000).toFixed(1)}s`}
                    </span>
                  )}
                </span>
              </div>

              {/* Connector */}
              {index < steps.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    background: isDone ? COLORS.success : 'rgba(255,255,255,0.08)',
                    minWidth: 12,
                    marginBottom: 14,
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
                        animation: 'bppSlide 1.2s ease-in-out infinite',
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
