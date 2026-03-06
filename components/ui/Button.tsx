// components/ui/Button.tsx — Reusable Button primitive using design tokens
'use client';

import * as React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    color: '#ffffff',
    border: '1px solid transparent',
  },
  secondary: {
    background: 'rgba(99,102,241,0.12)',
    color: '#818cf8',
    border: '1px solid rgba(99,102,241,0.3)',
  },
  outline: {
    background: 'transparent',
    color: '#f1f5f9',
    border: '1px solid rgba(255,255,255,0.16)',
  },
  ghost: {
    background: 'transparent',
    color: '#94a3b8',
    border: '1px solid transparent',
  },
  danger: {
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    color: '#ffffff',
    border: '1px solid transparent',
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '0.375rem 0.75rem', fontSize: '0.8125rem', borderRadius: '6px', height: '32px' },
  md: { padding: '0.5rem 1rem', fontSize: '0.9375rem', borderRadius: '8px', height: '40px' },
  lg: { padding: '0.75rem 1.5rem', fontSize: '1rem', borderRadius: '10px', height: '48px' },
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      disabled,
      style,
      ...props
    },
    ref
  ) => {
    const baseStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      fontWeight: 600,
      lineHeight: 1,
      cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
      opacity: disabled || isLoading ? 0.6 : 1,
      transition: 'all 0.2s',
      outline: 'none',
      whiteSpace: 'nowrap',
      width: fullWidth ? '100%' : undefined,
      ...variantStyles[variant],
      ...sizeStyles[size],
      ...style,
    };

    return (
      <button ref={ref} disabled={disabled || isLoading} style={baseStyle} {...props}>
        {isLoading && (
          <span
            style={{
              display: 'inline-block',
              width: '14px',
              height: '14px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTop: '2px solid currentColor',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
            }}
          />
        )}
        {!isLoading && leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
