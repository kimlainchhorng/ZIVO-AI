"use client";

import * as React from "react";
import { clsx } from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "outline";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-indigo-500 hover:bg-indigo-400 text-white border-transparent shadow-sm",
  secondary:
    "bg-white/[0.06] hover:bg-white/[0.10] text-slate-200 border-white/[0.08]",
  ghost:
    "bg-transparent hover:bg-white/[0.06] text-slate-300 border-transparent",
  destructive:
    "bg-red-500 hover:bg-red-400 text-white border-transparent shadow-sm",
  outline:
    "bg-transparent hover:bg-white/[0.06] text-slate-200 border-white/[0.16]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-md gap-1.5",
  md: "px-4 py-2 text-sm rounded-lg gap-2",
  lg: "px-6 py-2.5 text-base rounded-xl gap-2.5",
};

const spinnerSizeMap: Record<ButtonSize, number> = { sm: 12, md: 14, lg: 16 };

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled ?? loading}
      className={clsx(
        "inline-flex items-center justify-center font-semibold border transition-all duration-150 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0b14] disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <span
          className="inline-block border-2 border-current border-t-transparent rounded-full animate-spin"
          style={{ width: spinnerSizeMap[size], height: spinnerSizeMap[size] }}
          aria-hidden="true"
        />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
