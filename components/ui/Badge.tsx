"use client";

import * as React from "react";
import { clsx } from "clsx";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "error" | "info" | "outline";
type BadgeSize = "sm" | "md";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-white/[0.08] text-slate-300 border-transparent",
  primary: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  error: "bg-red-500/15 text-red-300 border-red-500/30",
  info: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  outline: "bg-transparent text-slate-400 border-white/[0.16]",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-1.5 py-0.5 text-[10px] rounded",
  md: "px-2 py-0.5 text-xs rounded-md",
};

export function Badge({ variant = "default", size = "md", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 font-semibold border",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
