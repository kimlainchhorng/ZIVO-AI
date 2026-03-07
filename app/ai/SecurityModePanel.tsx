'use client';

import { COLORS } from "./colors";

interface SecurityIssue {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  line?: number;
  cwe?: string;
  recommendation: string;
}

interface SecurityScanResult {
  issues: SecurityIssue[];
  score: number;
  summary: string;
  language: string;
}

interface SecurityModePanelProps {
  securityCode: string;
  setSecurityCode: (v: string) => void;
  securityLanguage: string;
  setSecurityLanguage: (v: string) => void;
  securityScanning: boolean;
  securityFixing: boolean;
  securityError: string | null;
  securityScanResult: SecurityScanResult | null;
  onScan: () => void;
  onFix: () => void;
}

export default function SecurityModePanel({
  securityCode,
  setSecurityCode,
  securityLanguage,
  setSecurityLanguage,
  securityScanning,
  securityFixing,
  securityError,
  securityScanResult,
  onScan,
  onFix,
}: SecurityModePanelProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", animation: "fadeIn 0.3s ease" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>Security Scanner</h2>
        </div>
        <p style={{ fontSize: "0.8125rem", color: COLORS.textSecondary, margin: 0 }}>Paste code → scan → auto-fix vulnerabilities</p>
      </div>
      <div>
        <label style={{ fontSize: "0.75rem", color: COLORS.textSecondary, display: "block", marginBottom: "0.35rem" }}>Language</label>
        <select
          className="zivo-select"
          value={securityLanguage}
          onChange={(e) => setSecurityLanguage(e.target.value)}
          style={{ width: "100%", padding: "0.45rem 0.65rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textPrimary, fontSize: "0.8125rem", cursor: "pointer" }}
        >
          {["typescript", "javascript", "python", "go", "rust", "java", "php", "other"].map((lang) => (
            <option key={lang} value={lang} style={{ background: COLORS.bgPanel }}>{lang.charAt(0).toUpperCase() + lang.slice(1)}</option>
          ))}
        </select>
      </div>
      <div>
        <label style={{ fontSize: "0.75rem", color: COLORS.textSecondary, display: "block", marginBottom: "0.35rem" }}>Code</label>
        <textarea
          className="zivo-textarea"
          value={securityCode}
          onChange={(e) => setSecurityCode(e.target.value)}
          placeholder="Paste your code here to scan for vulnerabilities..."
          style={{ width: "100%", minHeight: "160px", resize: "vertical", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textPrimary, padding: "0.6rem 0.75rem", fontSize: "0.8125rem", fontFamily: "'JetBrains Mono','Fira Code',monospace" }}
        />
      </div>
      {securityError && (
        <div style={{ padding: "0.6rem 0.75rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: COLORS.error, fontSize: "0.8125rem" }}>{securityError}</div>
      )}
      <button
        className="zivo-btn"
        onClick={onScan}
        disabled={securityScanning || !securityCode.trim()}
        style={{ width: "100%", padding: "0.65rem", background: securityScanning || !securityCode.trim() ? "rgba(249,115,22,0.3)" : "linear-gradient(135deg,#f97316,#ef4444)", color: "#fff", borderRadius: "8px", border: "none", cursor: securityScanning || !securityCode.trim() ? "not-allowed" : "pointer", fontSize: "0.875rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
      >
        {securityScanning ? (
          <><span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> Scanning…</>
        ) : (
          <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg> Scan for Vulnerabilities</>
        )}
      </button>
      {securityScanResult && (
        <>
          <div style={{ padding: "0.75rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: COLORS.textPrimary }}>Security Score</span>
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: securityScanResult.score >= 90 ? COLORS.success : securityScanResult.score >= 70 ? "#3b82f6" : securityScanResult.score >= 40 ? COLORS.warning : COLORS.error }}>{securityScanResult.score}/100</span>
            </div>
            <div style={{ height: "6px", background: COLORS.border, borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${securityScanResult.score}%`, borderRadius: "3px", background: securityScanResult.score >= 90 ? COLORS.success : securityScanResult.score >= 70 ? "#3b82f6" : securityScanResult.score >= 40 ? COLORS.warning : COLORS.error, transition: "width 0.6s ease" }} />
            </div>
            <div style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
              {(["critical","high","medium","low","info"] as const).map((sev) => {
                const count = securityScanResult.issues.filter((i) => i.severity === sev).length;
                if (!count) return null;
                const sevColors: Record<string,string> = { critical:"#ef4444", high:"#f97316", medium:"#f59e0b", low:"#3b82f6", info:"#94a3b8" };
                return <span key={sev} style={{ fontSize: "0.75rem", padding: "1px 6px", borderRadius: "4px", background: `${sevColors[sev]}22`, color: sevColors[sev], fontWeight: 600 }}>{count} {sev}</span>;
              })}
            </div>
          </div>
          <button
            className="zivo-btn"
            onClick={onFix}
            disabled={securityFixing}
            style={{ width: "100%", padding: "0.65rem", background: securityFixing ? "rgba(16,185,129,0.3)" : "linear-gradient(135deg,#10b981,#059669)", color: "#fff", borderRadius: "8px", border: "none", cursor: securityFixing ? "not-allowed" : "pointer", fontSize: "0.875rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
          >
            {securityFixing ? (
              <><span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> Fixing…</>
            ) : (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> Auto-Fix All Issues</>
            )}
          </button>
        </>
      )}
    </div>
  );
}
