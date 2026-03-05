"use client";

import * as React from "react";
import { clsx } from "clsx";
import { X } from "lucide-react";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export function Modal({ open, onClose, title, description, size = "md", children, footer }: ModalProps) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        className={clsx(
          "relative z-10 w-full bg-[#0f1120] border border-white/[0.10] rounded-2xl shadow-2xl flex flex-col gap-4",
          sizeClasses[size],
          "p-6"
        )}
      >
        {/* Header */}
        {(title ?? description) && (
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              {title && (
                <h2 id="modal-title" className="text-base font-semibold text-slate-100 tracking-tight">
                  {title}
                </h2>
              )}
              {description && <p className="text-sm text-slate-400">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {/* Body */}
        <div className="text-sm text-slate-300">{children}</div>
        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.06]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
