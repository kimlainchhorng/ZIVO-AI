// components/ui/Input.tsx — Accessible text input using design tokens
'use client';

import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorText?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  containerStyle?: React.CSSProperties;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      errorText,
      leftAddon,
      rightAddon,
      containerStyle,
      id,
      style,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const hasError = Boolean(errorText);

    const wrapperStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${hasError ? '#ef4444' : 'rgba(255,255,255,0.12)'}`,
      borderRadius: '8px',
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    };

    const inputStyle: React.CSSProperties = {
      flex: 1,
      background: 'transparent',
      border: 'none',
      outline: 'none',
      padding: '0.625rem 0.875rem',
      fontSize: '0.9375rem',
      color: '#f1f5f9',
      fontFamily: 'inherit',
      ...style,
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', ...containerStyle }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{ fontSize: '0.875rem', fontWeight: 500, color: '#f1f5f9' }}
          >
            {label}
          </label>
        )}
        <div style={wrapperStyle}>
          {leftAddon && (
            <span style={{ padding: '0 0.75rem', color: '#94a3b8', flexShrink: 0 }}>
              {leftAddon}
            </span>
          )}
          <input ref={ref} id={inputId} style={inputStyle} {...props} />
          {rightAddon && (
            <span style={{ padding: '0 0.75rem', color: '#94a3b8', flexShrink: 0 }}>
              {rightAddon}
            </span>
          )}
        </div>
        {errorText && (
          <span style={{ fontSize: '0.8125rem', color: '#ef4444' }}>{errorText}</span>
        )}
        {helperText && !errorText && (
          <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
