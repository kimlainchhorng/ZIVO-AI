'use client';

import { COLORS } from "./colors";

interface MobileResult {
  summary: string;
  files: Array<{ path: string; content: string; action: "create" | "update" | "delete" }>;
}

interface MobileBuilderPanelProps {
  mobilePrompt: string;
  setMobilePrompt: (v: string) => void;
  mobileFramework: string;
  setMobileFramework: (v: string) => void;
  mobileLoading: boolean;
  mobileError: string | null;
  mobilePassMessage: string | null;
  mobileResult: MobileResult | null;
  onGenerate: () => void;
}

export default function MobileBuilderPanel({
  mobilePrompt,
  setMobilePrompt,
  mobileFramework,
  setMobileFramework,
  mobileLoading,
  mobileError,
  mobilePassMessage,
  mobileResult,
  onGenerate,
}: MobileBuilderPanelProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", animation: "fadeIn 0.3s ease" }}>
      <div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.25rem", letterSpacing: "-0.02em" }}>Mobile App Builder v2</h2>
        <p style={{ fontSize: "0.8125rem", color: COLORS.textSecondary, margin: 0 }}>Describe your app — ZIVO generates a real Expo Router app with navigation, mock data, and multi-pass quality</p>
      </div>
      <div style={{ marginBottom: "0.75rem" }}>
        <label style={{ fontSize: "0.75rem", color: COLORS.textSecondary, display: "block", marginBottom: "0.35rem" }}>Prompt</label>
        <textarea
          className="zivo-textarea"
          value={mobilePrompt}
          onChange={(e) => setMobilePrompt(e.target.value)}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); onGenerate(); } }}
          placeholder="A fitness tracking app with a home screen, workout logger, and progress charts..."
          style={{ width: "100%", minHeight: "100px", resize: "vertical", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textPrimary, padding: "0.6rem 0.75rem", fontSize: "0.875rem", fontFamily: "inherit" }}
        />
      </div>
      <div style={{ marginBottom: "0.75rem" }}>
        <label style={{ fontSize: "0.75rem", color: COLORS.textSecondary, display: "block", marginBottom: "0.35rem" }}>Framework</label>
        <select
          value={mobileFramework}
          onChange={(e) => setMobileFramework(e.target.value)}
          style={{ width: "100%", padding: "0.5rem 0.75rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textPrimary, fontSize: "0.875rem" }}
        >
          <option value="react-native">React Native</option>
          <option value="expo">Expo (React Native)</option>
          <option value="flutter-web">Flutter (Web Preview)</option>
          <option value="ionic">Ionic / Capacitor</option>
        </select>
      </div>
      <button
        className="zivo-btn"
        onClick={onGenerate}
        disabled={mobileLoading || !mobilePrompt.trim()}
        style={{ width: "100%", padding: "0.65rem", background: COLORS.accentGradient, color: "#fff", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
      >
        {mobileLoading ? (
          <><span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> Generating...</>
        ) : (
          <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg> Build Mobile App</>
        )}
      </button>
      {mobileLoading && mobilePassMessage && (
        <div style={{ padding: "0.5rem 0.75rem", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "8px", fontSize: "0.8125rem", color: COLORS.accent }}>{mobilePassMessage}</div>
      )}
      {mobileError && (
        <div style={{ padding: "0.6rem 0.75rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: COLORS.error, fontSize: "0.8125rem" }}>{mobileError}</div>
      )}
      {mobileResult && (
        <div style={{ padding: "0.75rem", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "8px" }}>
          <div style={{ fontSize: "0.8125rem", color: COLORS.success, fontWeight: 600, marginBottom: "0.35rem" }}>Mobile app generated</div>
          <div style={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>{mobileResult.summary}</div>
          <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: COLORS.textMuted }}>{mobileResult.files.length} file(s) generated</div>
        </div>
      )}
    </div>
  );
}
