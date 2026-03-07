'use client';

import { useRef } from "react";
import { COLORS } from "./colors";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  chatMessages: ChatMessage[];
  chatInput: string;
  chatLoading: boolean;
  onClose: () => void;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onUseInPrompt: (content: string) => void;
}

export default function ChatPanel({
  chatMessages,
  chatInput,
  chatLoading,
  onClose,
  onInputChange,
  onSend,
  onUseInPrompt,
}: ChatPanelProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  return (
    <div style={{ position: "fixed", top: "52px", right: 0, bottom: "28px", width: "340px", background: COLORS.bgPanel, borderLeft: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", zIndex: 40, animation: "fadeIn 0.2s ease" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
        <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>AI Chat</span>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: "1.25rem" }}>×</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {chatMessages.length === 0 && (
          <div style={{ textAlign: "center", color: COLORS.textMuted, fontSize: "0.8125rem", padding: "2rem 0" }}>Ask the AI anything about your project…</div>
        )}
        {chatMessages.map((msg, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", gap: "0.25rem" }}>
            <div style={{ maxWidth: "85%", padding: "0.5rem 0.75rem", borderRadius: msg.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px", background: msg.role === "user" ? COLORS.accentGradient : COLORS.bgCard, border: `1px solid ${COLORS.border}`, fontSize: "0.8125rem", color: COLORS.textPrimary, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{msg.content || (msg.role === "assistant" && chatLoading ? "…" : "")}</div>
            {msg.role === "assistant" && msg.content && (
              <button
                onClick={() => onUseInPrompt(msg.content)}
                style={{ fontSize: "0.7rem", color: COLORS.accent, background: "transparent", border: "none", cursor: "pointer", padding: "0 0.25rem" }}
              >
                Use in prompt ↑
              </button>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div style={{ padding: "0.75rem", borderTop: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            value={chatInput}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
            placeholder="Ask something…"
            style={{ flex: 1, background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.45rem 0.65rem", color: COLORS.textPrimary, fontSize: "0.8125rem", outline: "none" }}
          />
          <button
            onClick={onSend}
            disabled={chatLoading || !chatInput.trim()}
            style={{ padding: "0.45rem 0.75rem", background: chatLoading || !chatInput.trim() ? "rgba(99,102,241,0.3)" : COLORS.accentGradient, border: "none", borderRadius: "8px", color: "#fff", cursor: chatLoading || !chatInput.trim() ? "not-allowed" : "pointer", fontSize: "0.8125rem", fontWeight: 600 }}
          >
            {chatLoading ? "…" : "→"}
          </button>
        </div>
      </div>
    </div>
  );
}
