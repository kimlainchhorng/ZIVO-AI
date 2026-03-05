"use client";

import * as React from "react";
import { clsx } from "clsx";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, helperText, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-slate-400">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 flex items-center text-slate-500 pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              "w-full bg-white/[0.04] border rounded-lg text-sm text-slate-100 placeholder-slate-500 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 focus:border-transparent",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error ? "border-red-500/60 focus:ring-red-500" : "border-white/[0.08] hover:border-white/[0.16]",
              leftIcon ? "pl-9" : "pl-3",
              rightIcon ? "pr-9" : "pr-3",
              "py-2",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 flex items-center text-slate-500 pointer-events-none">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
