// components/ui/Card.tsx — Card container using design tokens
'use client';

import * as React from 'react';

export interface CardProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: boolean;
  bordered?: boolean;
  hoverable?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

const paddingMap: Record<'none' | 'sm' | 'md' | 'lg', string> = {
  none: '0',
  sm: '0.75rem',
  md: '1.25rem',
  lg: '1.75rem',
};

export function Card({
  children,
  header,
  footer,
  padding = 'md',
  shadow = true,
  bordered = true,
  hoverable = false,
  style,
  className,
}: CardProps): React.ReactElement {
  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '12px',
    border: bordered ? '1px solid rgba(255,255,255,0.08)' : 'none',
    boxShadow: shadow ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' : 'none',
    overflow: 'hidden',
    transition: hoverable ? 'border-color 0.2s, box-shadow 0.2s, transform 0.2s' : undefined,
    ...style,
  };

  return (
    <div
      className={className}
      style={cardStyle}
      onMouseEnter={
        hoverable
          ? (e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.16)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 10px 15px -3px rgb(0 0 0 / 0.2)';
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
            }
          : undefined
      }
      onMouseLeave={
        hoverable
          ? (e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = shadow ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' : 'none';
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
            }
          : undefined
      }
    >
      {header && (
        <div
          style={{
            padding: paddingMap[padding],
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            fontWeight: 600,
            color: '#f1f5f9',
          }}
        >
          {header}
        </div>
      )}
      <div style={{ padding: paddingMap[padding] }}>{children}</div>
      {footer && (
        <div
          style={{
            padding: paddingMap[padding],
            borderTop: '1px solid rgba(255,255,255,0.08)',
            color: '#94a3b8',
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
