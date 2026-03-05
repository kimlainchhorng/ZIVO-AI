"use client";

import * as React from "react";
import { clsx } from "clsx";

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: "default" | "pills" | "underline";
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, variant = "default", className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={clsx(
        "flex items-center",
        variant === "default" && "bg-white/[0.04] border border-white/[0.08] rounded-xl p-1 gap-1",
        variant === "pills" && "gap-1",
        variant === "underline" && "border-b border-white/[0.08] gap-0",
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          disabled={tab.disabled}
          onClick={() => onChange(tab.id)}
          className={clsx(
            "inline-flex items-center gap-1.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed",
            variant === "default" && [
              "px-3 py-1.5 rounded-lg",
              activeTab === tab.id
                ? "bg-indigo-500 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]",
            ],
            variant === "pills" && [
              "px-3 py-1.5 rounded-full border",
              activeTab === tab.id
                ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                : "text-slate-400 border-transparent hover:text-slate-200 hover:border-white/[0.10]",
            ],
            variant === "underline" && [
              "px-4 py-2.5 border-b-2 -mb-px",
              activeTab === tab.id
                ? "border-indigo-500 text-slate-100"
                : "border-transparent text-slate-400 hover:text-slate-200",
            ]
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
  activeTab: string;
}

export function TabPanel({ id, activeTab, children, className, ...props }: TabPanelProps) {
  if (id !== activeTab) return null;
  return (
    <div role="tabpanel" className={clsx("text-sm text-slate-300", className)} {...props}>
      {children}
    </div>
  );
}
