'use client';

import { useState } from "react";

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  completed?: boolean;
}

export interface TutorialProps {
  steps?: TutorialStep[];
  onComplete?: () => void;
  onDismiss?: () => void;
}

const DEFAULT_STEPS: TutorialStep[] = [
  { id: "welcome", title: "Welcome to ZIVO AI 🎉", description: "The AI-powered platform to build complete full-stack apps in minutes. Let's take a quick tour." },
  { id: "builder", title: "Choose Your Builder", description: "Use Website Builder, Mobile Builder, or Code Builder to generate production-ready applications with a simple prompt." },
  { id: "generate", title: "Describe & Generate", description: "Type what you want to build in plain English. ZIVO AI will generate all the files you need." },
  { id: "preview", title: "Live Preview", description: "See a live preview of your app in the browser. Edit any part by prompting ZIVO AI again." },
  { id: "deploy", title: "Deploy in One Click", description: "Download your ZIP or deploy directly to Vercel, Netlify, Railway, and more with one click." },
  { id: "done", title: "You're All Set! 🚀", description: "Explore features like the Security Scanner, Theme Builder, and AI Code Editor. Happy building!" },
];

function CheckIcon({ done }: { done: boolean }): React.ReactElement {
  return (
    <div
      style={{
        width: 20,
        height: 20,
        borderRadius: "50%",
        border: `2px solid ${done ? "#6366f1" : "rgba(255,255,255,0.2)"}`,
        background: done ? "#6366f1" : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "all 0.2s",
      }}
    >
      {done && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

export default function Tutorial({ steps = DEFAULT_STEPS, onComplete, onDismiss }: TutorialProps): React.ReactElement {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const current = steps[currentIdx];
  const isLast = currentIdx === steps.length - 1;
  const progress = Math.round(((currentIdx + 1) / steps.length) * 100);

  const handleNext = () => {
    setCompleted((prev) => new Set([...prev, current.id]));
    if (isLast) {
      onComplete?.();
    } else {
      setCurrentIdx((i) => i + 1);
    }
  };

  const handleBack = () => {
    setCurrentIdx((i) => Math.max(0, i - 1));
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "1.5rem",
        fontFamily: "'Inter',system-ui,sans-serif",
        color: "#f1f5f9",
      }}
    >
      {/* Step list */}
      <div
        style={{
          width: 220,
          flexShrink: 0,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        <p style={{ margin: "0 0 0.75rem", fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Progress — {progress}%
        </p>
        <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, marginBottom: "0.75rem", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#6366f1,#8b5cf6)", borderRadius: 2, transition: "width 0.3s" }} />
        </div>
        {steps.map((step, idx) => (
          <button
            key={step.id}
            onClick={() => setCurrentIdx(idx)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "0.4rem 0.5rem",
              background: currentIdx === idx ? "rgba(99,102,241,0.12)" : "transparent",
              border: `1px solid ${currentIdx === idx ? "rgba(99,102,241,0.3)" : "transparent"}`,
              borderRadius: 8,
              cursor: "pointer",
              textAlign: "left",
              color: currentIdx === idx ? "#a5b4fc" : "#94a3b8",
            }}
          >
            <CheckIcon done={completed.has(step.id)} />
            <span style={{ fontSize: "0.8rem", fontWeight: currentIdx === idx ? 500 : 400 }}>{step.title}</span>
          </button>
        ))}
      </div>

      {/* Active step */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: "2rem",
            minHeight: 240,
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <p style={{ margin: "0 0 0.3rem", fontSize: "0.75rem", color: "#6366f1", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Step {currentIdx + 1} of {steps.length}
              </p>
              <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>{current.title}</h2>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                style={{ background: "transparent", border: "none", color: "#475569", cursor: "pointer", fontSize: "1.2rem", lineHeight: 1 }}
                aria-label="Dismiss tutorial"
              >
                ✕
              </button>
            )}
          </div>

          <p style={{ margin: 0, fontSize: "1rem", color: "#cbd5e1", lineHeight: 1.6 }}>
            {current.description}
          </p>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "auto" }}>
            {currentIdx > 0 && (
              <button
                onClick={handleBack}
                style={{
                  padding: "0.6rem 1.25rem",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "#94a3b8",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
              >
                ← Back
              </button>
            )}
            <button
              onClick={handleNext}
              style={{
                padding: "0.6rem 1.5rem",
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                border: "none",
                borderRadius: 8,
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              {isLast ? "Get started →" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
