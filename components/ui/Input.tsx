// components/ui/Input.tsx — Accessible labeled input using Tailwind
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? (label ? generatedId : undefined);
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-slate-300">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500',
            'focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500/60 focus:border-red-500 focus:ring-red-500',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-red-400" role="alert">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="text-xs text-slate-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

