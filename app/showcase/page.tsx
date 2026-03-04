'use client';

import { useState } from "react";

const COLORS = {
  bg: "#0a0b14",
  bgPanel: "#0f1120",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#475569",
};

type ProjectType = "website" | "mobile" | "api" | "dashboard" | "all";

interface ShowcaseProject {
  id: string;
  title: string;
  description: string;
  type: ProjectType;
  author: string;
  upvotes: number;
  tags: string[];
  prompt: string;
  createdAt: string;
  gradient: string;
}

const MOCK_PROJECTS: ShowcaseProject[] = [
  { id: "1", title: "SaaS Landing Page", description: "Clean, conversion-optimized landing page with hero, pricing, testimonials, and CTA sections.", type: "website", author: "zivo_user", upvotes: 42, tags: ["Next.js", "Tailwind", "Framer Motion"], prompt: "Build a SaaS landing page for a project management tool", createdAt: "2026-02-28", gradient: "linear-gradient(135deg,#6366f1,#8b5cf6)" },
  { id: "2", title: "Flutter E-commerce App", description: "Full-featured mobile shopping app with cart, payments, and order tracking.", type: "mobile", author: "dev_kai", upvotes: 38, tags: ["Flutter", "Dart", "Stripe"], prompt: "Create a Flutter e-commerce app with Stripe payments", createdAt: "2026-02-27", gradient: "linear-gradient(135deg,#06b6d4,#3b82f6)" },
  { id: "3", title: "REST API with Auth", description: "Express + Prisma API with JWT authentication, rate limiting, and Swagger docs.", type: "api", author: "backend_pro", upvotes: 31, tags: ["Node.js", "Prisma", "JWT"], prompt: "Generate a REST API with user auth and rate limiting", createdAt: "2026-02-26", gradient: "linear-gradient(135deg,#10b981,#059669)" },
  { id: "4", title: "Analytics Dashboard", description: "Real-time analytics dashboard with charts, KPI cards, and filterable data tables.", type: "dashboard", author: "data_viz", upvotes: 56, tags: ["Recharts", "Supabase", "Realtime"], prompt: "Build an analytics dashboard with real-time charts", createdAt: "2026-02-25", gradient: "linear-gradient(135deg,#f59e0b,#ef4444)" },
  { id: "5", title: "Auth Flow App", description: "Complete authentication system with email/password, OAuth, MFA, and session management.", type: "website", author: "security_first", upvotes: 29, tags: ["NextAuth", "Supabase", "TypeScript"], prompt: "Generate a complete auth system with OAuth and MFA", createdAt: "2026-02-24", gradient: "linear-gradient(135deg,#8b5cf6,#ec4899)" },
  { id: "6", title: "React Native Todo App", description: "Offline-first todo app with sync, notifications, and dark mode.", type: "mobile", author: "mobile_dev", upvotes: 22, tags: ["React Native", "Expo", "SQLite"], prompt: "Create a React Native todo app with offline sync", createdAt: "2026-02-23", gradient: "linear-gradient(135deg,#3b82f6,#06b6d4)" },
];

const TYPE_LABELS: Record<ProjectType | "all", string> = {
  all: "All",
  website: "Website",
  mobile: "Mobile",
  api: "API",
  dashboard: "Dashboard",
};

export default function ShowcasePage(): React.ReactElement {
  const [filter, setFilter] = useState<ProjectType | "all">("all");
  const [upvoted, setUpvoted] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const filtered = MOCK_PROJECTS.filter((p) => {
    if (filter !== "all" && p.type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const toggleUpvote = (id: string) => {
    setUpvoted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>
      <div
        style={{
          minHeight: "100vh",
          background: COLORS.bg,
          color: COLORS.textPrimary,
          fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
        }}
      >
        {/* Nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1.5rem", height: 52, borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bgPanel }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
              <div style={{ width: 28, height: 28, background: COLORS.accentGradient, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" }}>Z</div>
              <span style={{ fontWeight: 700, fontSize: "1rem", color: COLORS.textPrimary }}>ZIVO AI</span>
            </a>
            <span style={{ color: COLORS.textMuted, fontSize: "0.8rem" }}>/ Showcase</span>
          </div>
          <a href="/ai" style={{ padding: "0.4rem 1rem", background: COLORS.accentGradient, borderRadius: 8, color: "#fff", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none" }}>
            Build Something →
          </a>
        </div>

        {/* Hero */}
        <div style={{ padding: "3rem 1.5rem 2rem", textAlign: "center", animation: "fadeIn 0.4s ease" }}>
          <h1 style={{ margin: "0 0 0.75rem", fontSize: "2.25rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
            Built with ZIVO AI 🌟
          </h1>
          <p style={{ margin: "0 0 2rem", color: COLORS.textSecondary, fontSize: "1.0625rem", maxWidth: 560, marginInline: "auto" }}>
            Discover projects built by the ZIVO AI community. Get inspired, remix, and build something amazing.
          </p>

          {/* Search */}
          <div style={{ position: "relative", maxWidth: 480, margin: "0 auto 1.5rem" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.textMuted, pointerEvents: "none" }}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
              style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 2.5rem", background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 10, color: COLORS.textPrimary, fontSize: "0.9rem", outline: "none" }}
            />
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
            {(Object.keys(TYPE_LABELS) as Array<ProjectType | "all">).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                style={{
                  padding: "0.4rem 1rem",
                  background: filter === t ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${filter === t ? "rgba(99,102,241,0.5)" : COLORS.border}`,
                  borderRadius: 8,
                  color: filter === t ? "#a5b4fc" : COLORS.textSecondary,
                  fontWeight: filter === t ? 600 : 400,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1rem",
            padding: "0 1.5rem 3rem",
            maxWidth: 1200,
            margin: "0 auto",
          }}
        >
          {filtered.map((project, idx) => {
            const hasUpvoted = upvoted.has(project.id);
            return (
              <div
                key={project.id}
                style={{
                  background: COLORS.bgPanel,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 14,
                  overflow: "hidden",
                  animation: `fadeIn 0.4s ease ${idx * 0.06}s both`,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Preview gradient */}
                <div style={{ height: 120, background: project.gradient, position: "relative" }}>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem" }}>
                    {project.type === "website" ? "🌐" : project.type === "mobile" ? "📱" : project.type === "api" ? "⚡" : "📊"}
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
                    <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, lineHeight: 1.3 }}>{project.title}</h3>
                    <span style={{ padding: "2px 7px", background: "rgba(99,102,241,0.15)", borderRadius: 4, fontSize: "0.7rem", color: "#a5b4fc", fontWeight: 600, flexShrink: 0 }}>
                      {TYPE_LABELS[project.type]}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: COLORS.textSecondary, lineHeight: 1.5 }}>
                    {project.description}
                  </p>
                  <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                    {project.tags.map((tag) => (
                      <span key={tag} style={{ padding: "1px 6px", background: "rgba(255,255,255,0.06)", borderRadius: 4, fontSize: "0.7rem", color: COLORS.textMuted }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div style={{ marginTop: "auto", paddingTop: "0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.75rem", color: COLORS.textMuted }}>by {project.author} · {project.createdAt}</span>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button
                        onClick={() => toggleUpvote(project.id)}
                        style={{
                          display: "flex", alignItems: "center", gap: "0.3rem",
                          padding: "0.3rem 0.6rem",
                          background: hasUpvoted ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.05)",
                          border: `1px solid ${hasUpvoted ? "rgba(99,102,241,0.4)" : COLORS.border}`,
                          borderRadius: 6,
                          color: hasUpvoted ? "#a5b4fc" : COLORS.textMuted,
                          fontSize: "0.75rem",
                          cursor: "pointer",
                          fontWeight: hasUpvoted ? 600 : 400,
                        }}
                      >
                        ▲ {project.upvotes + (hasUpvoted ? 1 : 0)}
                      </button>
                      <a
                        href={`/ai?prompt=${encodeURIComponent(project.prompt)}`}
                        style={{
                          padding: "0.3rem 0.6rem",
                          background: "rgba(99,102,241,0.15)",
                          border: `1px solid rgba(99,102,241,0.3)`,
                          borderRadius: 6,
                          color: "#a5b4fc",
                          fontSize: "0.75rem",
                          textDecoration: "none",
                          fontWeight: 500,
                        }}
                      >
                        Remix
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "3rem", color: COLORS.textMuted }}>
              No projects match your search. <a href="/ai" style={{ color: COLORS.accent }}>Be the first to build one!</a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
