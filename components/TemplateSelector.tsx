"use client";

import React from "react";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  features: string[];
  estimatedFiles: number;
  prompt: string;
}

const TEMPLATES: Template[] = [
  {
    id: "saas-full",
    name: "SaaS App (Full)",
    description: "Landing + Dashboard + Auth + Stripe + DB",
    icon: "🚀",
    features: ["auth", "database", "stripe", "dashboard"],
    estimatedFiles: 50,
    prompt:
      "Build a complete SaaS application with: landing page, user authentication (Supabase), dashboard with analytics, Stripe billing with Pro/Business plans, PostgreSQL database with Prisma, API routes with Zod validation, dark mode, and beautiful UI.",
  },
  {
    id: "ecommerce-full",
    name: "E-commerce (Full)",
    description: "Store + Cart + Checkout + Admin + DB",
    icon: "🛍️",
    features: ["auth", "database", "stripe", "ecommerce"],
    estimatedFiles: 60,
    prompt:
      "Build a complete e-commerce application with: product catalog, shopping cart, Stripe checkout, order management, admin panel, user authentication, PostgreSQL database, product search and filtering, and beautiful responsive UI.",
  },
  {
    id: "booking-full",
    name: "Booking System (Full)",
    description: "Calendar + Reservations + Auth + Payments",
    icon: "📅",
    features: ["auth", "database", "booking", "stripe"],
    estimatedFiles: 40,
    prompt:
      "Build a complete booking and reservation system with: service listing, calendar availability, appointment booking, payment processing with Stripe, email confirmations, admin dashboard, user authentication, and PostgreSQL database.",
  },
  {
    id: "dashboard-full",
    name: "Analytics Dashboard",
    description: "Charts + Data Tables + Auth + API",
    icon: "📊",
    features: ["auth", "database", "dashboard"],
    estimatedFiles: 35,
    prompt:
      "Build a complete analytics dashboard with: sidebar navigation, KPI cards, line/bar/pie charts with Recharts, sortable data tables, user authentication, API endpoints for data, PostgreSQL database, and dark mode design.",
  },
];

const FEATURE_COLORS: Record<string, { bg: string; color: string }> = {
  auth: { bg: "rgba(99,102,241,0.15)", color: "#a5b4fc" },
  database: { bg: "rgba(14,165,233,0.15)", color: "#7dd3fc" },
  stripe: { bg: "rgba(168,85,247,0.15)", color: "#d8b4fe" },
  dashboard: { bg: "rgba(20,184,166,0.15)", color: "#5eead4" },
  ecommerce: { bg: "rgba(245,158,11,0.15)", color: "#fcd34d" },
  booking: { bg: "rgba(236,72,153,0.15)", color: "#f9a8d4" },
};

interface TemplateSelectorProps {
  onSelect: (prompt: string) => void;
  onSubmit: (prompt: string) => void;
}

export default function TemplateSelector({ onSelect, onSubmit }: TemplateSelectorProps): React.JSX.Element {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        animation: "fadeIn 0.25s ease",
      }}
    >
      <div
        style={{
          fontSize: "0.7rem",
          color: "#475569",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontWeight: 600,
          marginBottom: "0.25rem",
        }}
      >
        Full-Stack Templates
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "0.75rem",
        }}
      >
        {TEMPLATES.map((tpl) => (
          <div
            key={tpl.id}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              padding: "0.875rem",
              cursor: "pointer",
              transition: "border-color 0.15s, background 0.15s",
            }}
            className="zivo-file"
            role="button"
            tabIndex={0}
            onClick={() => onSelect(tpl.prompt)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(tpl.prompt);
              }
            }}
            aria-label={`Select template: ${tpl.name}`}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.4rem" }}>
              <span style={{ fontSize: "1.375rem", lineHeight: 1, flexShrink: 0 }}>{tpl.icon}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#f1f5f9", lineHeight: 1.2 }}>
                  {tpl.name}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: 2, lineHeight: 1.4 }}>
                  {tpl.description}
                </div>
              </div>
            </div>

            {/* Feature badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginBottom: "0.6rem" }}>
              {tpl.features.map((feat) => {
                const fc = FEATURE_COLORS[feat] ?? { bg: "rgba(255,255,255,0.08)", color: "#94a3b8" };
                return (
                  <span
                    key={feat}
                    style={{
                      fontSize: "0.6rem",
                      fontWeight: 600,
                      textTransform: "capitalize",
                      padding: "1px 6px",
                      borderRadius: 99,
                      background: fc.bg,
                      color: fc.color,
                    }}
                  >
                    {feat}
                  </span>
                );
              })}
              <span
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 600,
                  padding: "1px 6px",
                  borderRadius: 99,
                  background: "rgba(16,185,129,0.12)",
                  color: "#10b981",
                  marginLeft: "auto",
                }}
              >
                ~{tpl.estimatedFiles} files
              </span>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(tpl.prompt);
                }}
                style={{
                  flex: 1,
                  padding: "0.3rem 0",
                  background: "rgba(99,102,241,0.1)",
                  border: "1px solid rgba(99,102,241,0.25)",
                  borderRadius: 6,
                  color: "#a5b4fc",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Use Template
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSubmit(tpl.prompt);
                }}
                style={{
                  flex: 1,
                  padding: "0.3rem 0",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  border: "none",
                  borderRadius: 6,
                  color: "#fff",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Build Now ▶
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
