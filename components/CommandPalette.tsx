'use client';

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const COLORS_UI = {
  bg: "rgba(0,0,0,0.85)",
  panel: "#0f1120",
  border: "rgba(255,255,255,0.1)",
  accent: "#6366f1",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#475569",
  hover: "rgba(99,102,241,0.12)",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
};

interface Command {
  id: string;
  label: string;
  keywords: string[];
  icon: React.ReactNode;
  action: () => void;
  category: string;
}

interface Props {
  onClose: () => void;
  onSetPrompt?: (prompt: string) => void;
  onOpenFiles?: () => void;
  onOpenDesignSystem?: () => void;
}

export default function CommandPalette({ onClose, onSetPrompt, onOpenFiles, onOpenDesignSystem }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const COMMANDS: Command[] = [
    {
      id: "new-build",
      label: "New Build",
      keywords: ["new", "build", "clear", "reset", "start"],
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
      action: () => { onSetPrompt?.(""); onClose(); },
      category: "Actions",
    },
    {
      id: "gen-landing",
      label: "Generate Landing Page",
      keywords: ["landing", "page", "saas", "marketing", "hero"],
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>,
      action: () => { onSetPrompt?.("Build a modern SaaS landing page with hero, features, pricing, and CTA sections"); onClose(); },
      category: "Templates",
    },
    {
      id: "gen-dashboard",
      label: "Generate Dashboard",
      keywords: ["dashboard", "analytics", "charts", "admin", "stats"],
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>,
      action: () => { onSetPrompt?.("Build an analytics dashboard with charts, stats cards, and data tables"); onClose(); },
      category: "Templates",
    },
    {
      id: "gen-saas",
      label: "Generate SaaS App",
      keywords: ["saas", "app", "full stack", "subscription", "stripe"],
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>,
      action: () => { onSetPrompt?.("Build a complete SaaS application with auth, dashboard, billing, and user management"); onClose(); },
      category: "Templates",
    },
    {
      id: "gen-auth",
      label: "Generate Auth Flow",
      keywords: ["auth", "login", "signup", "authentication", "password"],
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
      action: () => { onSetPrompt?.("Build a complete authentication flow with login, signup, and password reset pages"); onClose(); },
      category: "Templates",
    },
    {
      id: "gen-ecommerce",
      label: "Generate E-commerce",
      keywords: ["ecommerce", "shop", "store", "products", "cart", "checkout"],
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>,
      action: () => { onSetPrompt?.("Build an e-commerce product listing page with cart and checkout flow"); onClose(); },
      category: "Templates",
    },
    {
      id: "open-files",
      label: "Open Files Explorer",
      keywords: ["files", "explorer", "tree", "structure"],
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
      action: () => { onOpenFiles?.(); onClose(); },
      category: "Panels",
    },
    {
      id: "open-design",
      label: "Open Design System",
      keywords: ["design", "system", "colors", "tokens", "theme"],
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12.5" r="2.5"/></svg>,
      action: () => { onOpenDesignSystem?.(); onClose(); },
      category: "Panels",
    },
    {
      id: "view-history",
      label: "View Build History",
      keywords: ["history", "past", "previous", "builds", "log"],
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>,
      action: () => { router.push("/history"); onClose(); },
      category: "Navigate",
    },
    {
      id: "view-templates",
      label: "View Templates",
      keywords: ["templates", "starters", "examples", "library"],
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>,
      action: () => { router.push("/templates"); onClose(); },
      category: "Navigate",
    },
    {
      id: "view-workflows",
      label: "View Workflows",
      keywords: ["workflow", "automation", "flow", "pipeline"],
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3"/><line x1="12" x2="12" y1="22" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/></svg>,
      action: () => { router.push("/workflow"); onClose(); },
      category: "Navigate",
    },
  ];

  // Fuzzy filter
  const lowerQuery = query.toLowerCase().trim();
  const filtered = lowerQuery
    ? COMMANDS.filter((cmd) =>
        cmd.label.toLowerCase().includes(lowerQuery) ||
        cmd.keywords.some((kw) => kw.includes(lowerQuery)) ||
        cmd.category.toLowerCase().includes(lowerQuery)
      )
    : COMMANDS;

  // Group by category
  const categories = [...new Set(filtered.map((c) => c.category))];

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keyboard nav
  const allFiltered = filtered;
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, allFiltered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      allFiltered[activeIndex]?.action();
    }
  }

  // Scroll active item into view
  useEffect(() => {
    const item = listRef.current?.querySelector(`[data-active="true"]`);
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  let globalIndex = 0;

  return (
    <>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 9999, background: COLORS_UI.bg, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "15vh" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          style={{ width: "100%", maxWidth: "560px", background: COLORS_UI.panel, border: `1px solid ${COLORS_UI.border}`, borderRadius: "14px", overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.8)", animation: "fadeIn 0.15s ease" }}
          onKeyDown={handleKeyDown}
        >
          {/* Search input */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.875rem 1rem", borderBottom: `1px solid ${COLORS_UI.border}` }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS_UI.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command or search…"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: COLORS_UI.textPrimary, fontSize: "0.9375rem" }}
            />
            <kbd style={{ padding: "1px 5px", background: "rgba(255,255,255,0.06)", border: `1px solid ${COLORS_UI.border}`, borderRadius: "4px", fontSize: "0.7rem", color: COLORS_UI.textMuted }}>ESC</kbd>
          </div>

          {/* Results */}
          <div ref={listRef} style={{ maxHeight: "380px", overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: COLORS_UI.textMuted, fontSize: "0.875rem" }}>
                No commands found for &ldquo;{query}&rdquo;
              </div>
            ) : (
              categories.map((category) => {
                const cmds = filtered.filter((c) => c.category === category);
                return (
                  <div key={category}>
                    <div style={{ padding: "0.35rem 1rem 0.2rem", fontSize: "0.7rem", color: COLORS_UI.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                      {category}
                    </div>
                    {cmds.map((cmd) => {
                      const idx = globalIndex++;
                      const isActive = idx === activeIndex;
                      return (
                        <div
                          key={cmd.id}
                          data-active={isActive ? "true" : undefined}
                          onClick={cmd.action}
                          onMouseEnter={() => setActiveIndex(idx)}
                          style={{
                            display: "flex", alignItems: "center", gap: "0.75rem",
                            padding: "0.55rem 1rem",
                            background: isActive ? COLORS_UI.hover : "transparent",
                            cursor: "pointer",
                            transition: "background 0.1s",
                          }}
                        >
                          <span style={{ color: isActive ? COLORS_UI.accent : COLORS_UI.textMuted, display: "flex", alignItems: "center", flexShrink: 0 }}>
                            {cmd.icon}
                          </span>
                          <span style={{ flex: 1, fontSize: "0.875rem", color: isActive ? COLORS_UI.textPrimary : COLORS_UI.textSecondary, fontWeight: isActive ? 500 : 400 }}>
                            {cmd.label}
                          </span>
                          {isActive && (
                            <kbd style={{ padding: "1px 5px", background: "rgba(255,255,255,0.06)", border: `1px solid ${COLORS_UI.border}`, borderRadius: "4px", fontSize: "0.7rem", color: COLORS_UI.textMuted }}>↵</kbd>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.5rem 1rem", borderTop: `1px solid ${COLORS_UI.border}`, fontSize: "0.7rem", color: COLORS_UI.textMuted }}>
            <span><kbd style={{ padding: "1px 4px", background: "rgba(255,255,255,0.06)", border: `1px solid ${COLORS_UI.border}`, borderRadius: "3px" }}>↑↓</kbd> navigate</span>
            <span><kbd style={{ padding: "1px 4px", background: "rgba(255,255,255,0.06)", border: `1px solid ${COLORS_UI.border}`, borderRadius: "3px" }}>↵</kbd> select</span>
            <span><kbd style={{ padding: "1px 4px", background: "rgba(255,255,255,0.06)", border: `1px solid ${COLORS_UI.border}`, borderRadius: "3px" }}>ESC</kbd> close</span>
          </div>
        </div>
      </div>
    </>
  );
}
