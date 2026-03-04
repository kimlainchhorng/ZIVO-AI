'use client';

import { useRef, useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";

// Dynamically import Monaco to avoid SSR issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export interface AICodeEditorProps {
  value?: string;
  language?: string;
  filePath?: string;
  onChange?: (value: string) => void;
  height?: string;
}

interface Tab {
  id: string;
  label: string;
  language: string;
  filePath: string;
  content: string;
}

const LANGUAGES = [
  "typescript", "javascript", "tsx", "jsx", "python", "go", "rust",
  "java", "css", "html", "json", "yaml", "markdown", "sql",
];

export default function AICodeEditor({
  value = "",
  language = "typescript",
  filePath = "file.ts",
  onChange,
  height = "500px",
}: AICodeEditorProps): React.ReactElement {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "1", label: filePath.split("/").pop() ?? "file.ts", language, filePath, content: value },
  ]);
  const [activeTab, setActiveTab] = useState<string>("1");
  const [completion, setCompletion] = useState<string>("");
  const [isCompleting, setIsCompleting] = useState(false);
  const [selectedLang, setSelectedLang] = useState(language);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeTabData = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  const handleEditorChange = useCallback((newValue: string | undefined) => {
    const val = newValue ?? "";
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTab ? { ...t, content: val } : t))
    );
    onChange?.(val);

    // Debounced AI completion
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!val.trim()) return;
      setIsCompleting(true);
      try {
        const lines = val.split("\n");
        const res = await fetch("/api/code-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileContent: val,
            cursorLine: lines.length,
            cursorColumn: (lines[lines.length - 1] ?? "").length,
            language: activeTabData.language,
            filePath: activeTabData.filePath,
          }),
        });
        if (res.ok) {
          const data = await res.json() as { insertText: string };
          setCompletion(data.insertText ?? "");
        }
      } catch {
        // Ignore completion errors silently
      } finally {
        setIsCompleting(false);
      }
    }, 1500);
  }, [activeTab, activeTabData, onChange]);

  const addTab = useCallback(() => {
    const id = String(Date.now());
    const newTab: Tab = {
      id,
      label: "untitled.ts",
      language: "typescript",
      filePath: "untitled.ts",
      content: "",
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTab(id);
  }, []);

  const closeTab = useCallback((id: string) => {
    setTabs((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      if (filtered.length === 0) return prev;
      if (activeTab === id) setActiveTab(filtered[filtered.length - 1].id);
      return filtered;
    });
  }, [activeTab]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#0d1117",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        overflow: "hidden",
        fontFamily: "'Inter',system-ui,sans-serif",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0 0.75rem",
          background: "#161b22",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          minHeight: 40,
          flexShrink: 0,
        }}
      >
        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.25rem", flex: 1, overflow: "hidden" }}>
          {tabs.map((tab) => (
            <div
              key={tab.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.35rem 0.75rem",
                background:
                  activeTab === tab.id
                    ? "rgba(99,102,241,0.15)"
                    : "transparent",
                border: `1px solid ${activeTab === tab.id ? "rgba(99,102,241,0.3)" : "transparent"}`,
                borderRadius: "6px 6px 0 0",
                cursor: "pointer",
                flexShrink: 0,
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  color: activeTab === tab.id ? "#a5b4fc" : "#94a3b8",
                  fontWeight: activeTab === tab.id ? 500 : 400,
                }}
              >
                {tab.label}
              </span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "#475569", padding: 0, lineHeight: 1, fontSize: "0.7rem" }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addTab}
            style={{ padding: "0 0.5rem", background: "transparent", border: "none", color: "#475569", cursor: "pointer", fontSize: "1rem" }}
            title="New tab"
          >
            +
          </button>
        </div>

        {/* Language selector */}
        <select
          value={selectedLang}
          onChange={(e) => {
            setSelectedLang(e.target.value);
            setTabs((prev) => prev.map((t) => t.id === activeTab ? { ...t, language: e.target.value } : t));
          }}
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "#94a3b8", padding: "0.2rem 0.4rem", fontSize: "0.75rem" }}
        >
          {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>

        {isCompleting && (
          <span style={{ fontSize: "0.7rem", color: "#6366f1" }}>AI ✦</span>
        )}
      </div>

      {/* Editor */}
      <MonacoEditor
        height={height}
        language={activeTabData.language}
        value={activeTabData.content}
        onChange={handleEditorChange}
        theme="vs-dark"
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          fontFamily: "'Fira Code','Cascadia Code','JetBrains Mono',monospace",
          fontLigatures: true,
          lineNumbers: "on",
          wordWrap: "on",
          tabSize: 2,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          suggest: { showInlineDetails: true },
          quickSuggestions: true,
          scrollbar: { verticalScrollbarSize: 6 },
        }}
      />

      {/* AI Completion bar */}
      {completion && (
        <div
          style={{
            padding: "0.5rem 1rem",
            background: "#161b22",
            borderTop: "1px solid rgba(99,102,241,0.2)",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <span style={{ fontSize: "0.7rem", color: "#6366f1", fontWeight: 600 }}>✦ AI Suggestion</span>
          <code style={{ flex: 1, fontSize: "0.75rem", color: "#94a3b8", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {completion.slice(0, 120)}
          </code>
          <button
            onClick={() => {
              const newContent = activeTabData.content + completion;
              setTabs((prev) => prev.map((t) => t.id === activeTab ? { ...t, content: newContent } : t));
              onChange?.(newContent);
              setCompletion("");
            }}
            style={{ padding: "0.2rem 0.6rem", background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", borderRadius: 4, color: "#a5b4fc", fontSize: "0.7rem", cursor: "pointer" }}
          >
            Accept
          </button>
          <button
            onClick={() => setCompletion("")}
            style={{ background: "transparent", border: "none", color: "#475569", fontSize: "0.7rem", cursor: "pointer" }}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
