'use client';

import { useState } from "react";
import Tutorial from "@/components/Tutorial";

const COLORS = {
  bg: "#0a0b14",
  bgPanel: "#0f1120",
  border: "rgba(255,255,255,0.08)",
  accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#475569",
  success: "#10b981",
};

type OnboardingStep = "welcome" | "path" | "generate" | "github" | "supabase" | "done";

const PATHS = [
  { id: "website", label: "Website", icon: "🌐", desc: "Landing pages, SaaS, e-commerce" },
  { id: "mobile", label: "Mobile App", icon: "📱", desc: "Flutter, React Native, Expo" },
  { id: "api", label: "API / Backend", icon: "⚡", desc: "REST API, GraphQL, microservices" },
  { id: "custom", label: "Custom", icon: "✨", desc: "Tell ZIVO AI what you need" },
];

function StepIndicator({ current, total }: { current: number; total: number }): React.ReactElement {
  return (
    <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i < current ? 20 : 8,
            height: 8,
            borderRadius: 4,
            background: i < current ? COLORS.accent : "rgba(255,255,255,0.15)",
            transition: "all 0.3s",
          }}
        />
      ))}
    </div>
  );
}

export default function OnboardingPage(): React.ReactElement {
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");

  const STEP_INDICES: Record<OnboardingStep, number> = {
    welcome: 1,
    path: 2,
    generate: 3,
    github: 4,
    supabase: 5,
    done: 6,
  };

  const stepNum = STEP_INDICES[step];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        color: COLORS.textPrimary,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
      }}
    >
      <style>{`* { box-sizing: border-box; } @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }`}</style>

      {/* Logo */}
      <div style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{ width: 36, height: 36, background: COLORS.accentGradient, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700 }}>Z</div>
        <span style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.01em" }}>ZIVO AI</span>
      </div>

      <StepIndicator current={stepNum} total={6} />

      <div
        style={{
          marginTop: "2rem",
          width: "100%",
          maxWidth: 640,
          background: COLORS.bgPanel,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 16,
          padding: "2.5rem",
          animation: "fadeIn 0.4s ease",
        }}
      >
        {/* Welcome */}
        {step === "welcome" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👋</div>
            <h1 style={{ margin: "0 0 0.75rem", fontSize: "1.75rem", fontWeight: 700 }}>Welcome to ZIVO AI</h1>
            <p style={{ margin: "0 0 2rem", color: COLORS.textSecondary, fontSize: "1rem", lineHeight: 1.6 }}>
              The autonomous AI platform that builds complete full-stack applications from a single prompt. Let{"'"}s get you set up in under 2 minutes.
            </p>
            <button
              onClick={() => setStep("path")}
              style={{ padding: "0.875rem 2.5rem", background: COLORS.accentGradient, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: "1rem", cursor: "pointer" }}
            >
              Get Started →
            </button>
          </div>
        )}

        {/* Choose path */}
        {step === "path" && (
          <div>
            <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem", fontWeight: 700 }}>What do you want to build?</h2>
            <p style={{ margin: "0 0 1.5rem", color: COLORS.textSecondary }}>Choose your primary use case — you can always switch later.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
              {PATHS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPath(p.id)}
                  style={{
                    padding: "1rem",
                    background: selectedPath === p.id ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
                    border: `2px solid ${selectedPath === p.id ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: 10,
                    cursor: "pointer",
                    textAlign: "left",
                    color: COLORS.textPrimary,
                  }}
                >
                  <div style={{ fontSize: "1.5rem", marginBottom: "0.4rem" }}>{p.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.2rem" }}>{p.label}</div>
                  <div style={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>{p.desc}</div>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setStep("welcome")} style={{ padding: "0.6rem 1.25rem", background: "rgba(255,255,255,0.06)", border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textSecondary, cursor: "pointer" }}>← Back</button>
              <button
                onClick={() => selectedPath && setStep("generate")}
                disabled={!selectedPath}
                style={{ flex: 1, padding: "0.75rem", background: selectedPath ? COLORS.accentGradient : "rgba(255,255,255,0.05)", border: "none", borderRadius: 8, color: selectedPath ? "#fff" : COLORS.textMuted, fontWeight: 600, cursor: selectedPath ? "pointer" : "not-allowed" }}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* First generation */}
        {step === "generate" && (
          <div>
            <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem", fontWeight: 700 }}>Your first generation</h2>
            <p style={{ margin: "0 0 1rem", color: COLORS.textSecondary }}>Describe what you want to build. Be as specific as you like.</p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`e.g. A SaaS landing page with hero section, pricing table, and contact form using Tailwind CSS`}
              rows={4}
              style={{ width: "100%", padding: "0.875rem", background: "rgba(255,255,255,0.06)", border: `1px solid ${COLORS.border}`, borderRadius: 10, color: COLORS.textPrimary, fontSize: "0.9rem", resize: "vertical", fontFamily: "inherit" }}
            />
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
              <button onClick={() => setStep("path")} style={{ padding: "0.6rem 1.25rem", background: "rgba(255,255,255,0.06)", border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textSecondary, cursor: "pointer" }}>← Back</button>
              <a
                href={`/ai?prompt=${encodeURIComponent(prompt)}`}
                style={{ flex: 1, padding: "0.75rem", background: COLORS.accentGradient, border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer", textAlign: "center", textDecoration: "none", display: "block", lineHeight: "1.5" }}
                onClick={() => setStep("github")}
              >
                Generate with ZIVO AI →
              </a>
            </div>
          </div>
        )}

        {/* GitHub */}
        {step === "github" && (
          <div>
            <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem", fontWeight: 700 }}>Connect GitHub</h2>
            <p style={{ margin: "0 0 1.5rem", color: COLORS.textSecondary }}>Push your generated code directly to GitHub repositories.</p>
            <div style={{ padding: "1rem", background: "rgba(255,255,255,0.04)", border: `1px solid ${COLORS.border}`, borderRadius: 10, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "1.5rem" }}>🐙</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>GitHub Integration</div>
                <div style={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>Create repos, push files, open PRs — all from ZIVO AI</div>
              </div>
              <a href="/connectors" style={{ marginLeft: "auto", padding: "0.4rem 0.875rem", background: COLORS.accentGradient, borderRadius: 6, color: "#fff", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none" }}>Connect</a>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setStep("generate")} style={{ padding: "0.6rem 1.25rem", background: "rgba(255,255,255,0.06)", border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textSecondary, cursor: "pointer" }}>← Back</button>
              <button onClick={() => setStep("supabase")} style={{ flex: 1, padding: "0.75rem", background: "rgba(255,255,255,0.06)", border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textSecondary, cursor: "pointer" }}>Skip for now →</button>
              <button onClick={() => setStep("supabase")} style={{ flex: 1, padding: "0.75rem", background: COLORS.accentGradient, border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Continue →</button>
            </div>
          </div>
        )}

        {/* Supabase */}
        {step === "supabase" && (
          <div>
            <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem", fontWeight: 700 }}>Connect Supabase</h2>
            <p style={{ margin: "0 0 1.5rem", color: COLORS.textSecondary }}>Instantly provision databases, auth, and realtime for your generated apps.</p>
            <div style={{ padding: "1rem", background: "rgba(255,255,255,0.04)", border: `1px solid ${COLORS.border}`, borderRadius: 10, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "1.5rem" }}>🟩</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Supabase Integration</div>
                <div style={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>Auto-create tables, auth policies, and realtime subscriptions</div>
              </div>
              <a href="/connectors" style={{ marginLeft: "auto", padding: "0.4rem 0.875rem", background: COLORS.accentGradient, borderRadius: 6, color: "#fff", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none" }}>Connect</a>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setStep("github")} style={{ padding: "0.6rem 1.25rem", background: "rgba(255,255,255,0.06)", border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textSecondary, cursor: "pointer" }}>← Back</button>
              <button onClick={() => setStep("done")} style={{ flex: 1, padding: "0.75rem", background: COLORS.accentGradient, border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Finish Setup →</button>
            </div>
          </div>
        )}

        {/* Done */}
        {step === "done" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🚀</div>
            <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.75rem", fontWeight: 700 }}>You{"'"}re all set!</h2>
            <p style={{ margin: "0 0 0.5rem", color: COLORS.textSecondary }}>ZIVO AI is ready to build anything you can imagine.</p>
            <p style={{ margin: "0 0 2rem", fontSize: "0.875rem", color: COLORS.textMuted }}>Selected path: <strong style={{ color: COLORS.accent }}>{PATHS.find((p) => p.id === selectedPath)?.label ?? "Custom"}</strong></p>

            <div style={{ marginBottom: "2rem" }}>
              <Tutorial
                onComplete={() => {}}
                onDismiss={() => {}}
              />
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <a href="/dashboard" style={{ padding: "0.75rem 1.5rem", background: "rgba(255,255,255,0.06)", border: `1px solid ${COLORS.border}`, borderRadius: 10, color: COLORS.textSecondary, textDecoration: "none", fontWeight: 500 }}>View Dashboard</a>
              <a href="/ai" style={{ padding: "0.75rem 2rem", background: COLORS.accentGradient, borderRadius: 10, color: "#fff", fontWeight: 700, textDecoration: "none", fontSize: "1rem" }}>Start Building →</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
