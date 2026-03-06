// components/ui/Badge.tsx — Badge pill component using design tokens
'use client';

import * as React from 'react';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'outline';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: React.CSSProperties;
  className?: string;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: {
    background: 'rgba(255,255,255,0.06)',
    color: '#94a3b8',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  primary: {
    background: 'rgba(99,102,241,0.15)',
    color: '#818cf8',
    border: '1px solid rgba(99,102,241,0.3)',
  },
  success: {
    background: 'rgba(34,197,94,0.12)',
    color: '#4ade80',
    border: '1px solid rgba(34,197,94,0.3)',
  },
  warning: {
    background: 'rgba(245,158,11,0.12)',
    color: '#fbbf24',
    border: '1px solid rgba(245,158,11,0.3)',
  },
  error: {
    background: 'rgba(239,68,68,0.12)',
    color: '#f87171',
    border: '1px solid rgba(239,68,68,0.3)',
  },
  outline: {
    background: 'transparent',
    color: '#f1f5f9',
    border: '1px solid rgba(255,255,255,0.2)',
  },
};

const sizeStyles: Record<BadgeSize, React.CSSProperties> = {
  sm: { padding: '0.125rem 0.5rem', fontSize: '0.7rem', borderRadius: '20px' },
  md: { padding: '0.25rem 0.625rem', fontSize: '0.8125rem', borderRadius: '20px' },
};

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  style,
  className,
}: BadgeProps): React.ReactElement {
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontWeight: 600,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
    >
      {children}
    </span>
  );
}
