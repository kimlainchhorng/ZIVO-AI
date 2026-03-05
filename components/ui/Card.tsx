"use client";

import * as React from "react";
import { clsx } from "clsx";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "bordered";
  padding?: "none" | "sm" | "md" | "lg";
}

const variantClasses = {
  default: "bg-white/[0.04] border border-white/[0.08]",
  elevated: "bg-[#151728] border border-white/[0.10] shadow-lg",
  bordered: "bg-transparent border border-white/[0.16]",
};

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export function Card({ variant = "default", padding = "md", className, children, ...props }: CardProps) {
  return (
    <div
      className={clsx("rounded-xl transition-colors", variantClasses[variant], paddingClasses[padding], className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("flex flex-col gap-1 mb-3", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={clsx("text-base font-semibold text-slate-100 tracking-tight leading-snug", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={clsx("text-sm text-slate-400 leading-normal", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("text-sm text-slate-300", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("flex items-center gap-2 mt-4 pt-3 border-t border-white/[0.06]", className)} {...props}>
      {children}
    </div>
  );
}
