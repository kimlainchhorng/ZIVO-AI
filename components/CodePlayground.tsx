'use client';

import { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export interface CodePlaygroundProps {
  initialCode?: string;
  initialLanguage?: "javascript" | "typescript";
}

interface RunResult {
  output: string;
  error?: string;
  executionTime: number;
  success: boolean;
}

const EXAMPLES = [
  {
    label: "Fibonacci",
    language: "javascript" as const,
    code: `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

for (let i = 0; i <= 10; i++) {
  console.log(\`fib(\${i}) = \${fibonacci(i)}\`);
}`,
  },
  {
    label: "Array utils",
    language: "javascript" as const,
    code: `const numbers = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3];

const sorted = [...numbers].sort((a, b) => a - b);
const unique = [...new Set(numbers)];
const sum = numbers.reduce((a, b) => a + b, 0);
const avg = sum / numbers.length;

console.log("Sorted:", sorted.join(", "));
console.log("Unique:", unique.join(", "));
console.log("Sum:", sum, "| Avg:", avg.toFixed(2));`,
  },
  {
    label: "FizzBuzz",
    language: "javascript" as const,
    code: `for (let i = 1; i <= 20; i++) {
  if (i % 15 === 0) console.log("FizzBuzz");
  else if (i % 3 === 0) console.log("Fizz");
  else if (i % 5 === 0) console.log("Buzz");
  else console.log(i);
}`,
  },
];

export default function CodePlayground({
  initialCode = "// Write JavaScript or TypeScript and click Run\nconsole.log('Hello, ZIVO AI! 🚀');",
  initialLanguage = "javascript",
}: CodePlaygroundProps): React.ReactElement {
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState<"javascript" | "typescript">(initialLanguage);
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const runCode = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setResult(null);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/execute-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, timeout: 5000 }),
        signal: abortRef.current.signal,
      });

      const data = await res.json() as RunResult;
      setResult(data);
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError") {
        setResult({
          output: "",
          error: (err as Error)?.message ?? "Network error",
          executionTime: 0,
          success: false,
        });
      }
    } finally {
      setRunning(false);
    }
  }, [code, language, running]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        runCode();
      }
    },
    [runCode]
  );

  return (
    <div
      onKeyDown={handleKeyDown}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 0,
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        overflow: "hidden",
        fontFamily: "'Inter',system-ui,sans-serif",
        background: "#0d1117",
        minHeight: 400,
      }}
    >
      {/* Editor pane */}
      <div style={{ display: "flex", flexDirection: "column", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0 0.75rem",
            background: "#161b22",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            height: 40,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 500 }}>Code</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as "javascript" | "typescript")}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "#94a3b8", padding: "0.15rem 0.35rem", fontSize: "0.7rem" }}
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
          </select>
          <span style={{ fontSize: "0.65rem", color: "#475569", marginLeft: "auto" }}>Ctrl+Enter to run</span>
        </div>

        {/* Examples */}
        <div style={{ display: "flex", gap: "0.4rem", padding: "0.4rem 0.75rem", background: "#161b22", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <span style={{ fontSize: "0.7rem", color: "#475569", alignSelf: "center" }}>Examples:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              onClick={() => { setCode(ex.code); setLanguage(ex.language); setResult(null); }}
              style={{ padding: "0.15rem 0.5rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, color: "#64748b", fontSize: "0.7rem", cursor: "pointer" }}
            >
              {ex.label}
            </button>
          ))}
        </div>

        <MonacoEditor
          height="100%"
          language={language === "typescript" ? "typescript" : "javascript"}
          value={code}
          onChange={(v) => setCode(v ?? "")}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "'Fira Code','Cascadia Code',monospace",
            fontLigatures: true,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            automaticLayout: true,
            scrollbar: { verticalScrollbarSize: 4 },
          }}
        />

        {/* Run button */}
        <div style={{ padding: "0.5rem 0.75rem", background: "#161b22", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "0.5rem" }}>
          <button
            onClick={runCode}
            disabled={running}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.4rem 1rem",
              background: running ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg,#6366f1,#8b5cf6)",
              border: "none",
              borderRadius: 6,
              color: "#fff",
              fontWeight: 600,
              fontSize: "0.8rem",
              cursor: running ? "not-allowed" : "pointer",
            }}
          >
            {running ? "Running…" : "▶ Run"}
          </button>
          <button
            onClick={() => { setCode(""); setResult(null); }}
            style={{ padding: "0.4rem 0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#94a3b8", fontSize: "0.8rem", cursor: "pointer" }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Output pane */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 0.75rem",
            background: "#161b22",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            height: 40,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 500 }}>Output</span>
          {result && (
            <span
              style={{
                marginLeft: "auto",
                fontSize: "0.7rem",
                color: result.success ? "#10b981" : "#ef4444",
              }}
            >
              {result.success ? "✓" : "✗"} {result.executionTime}ms
            </span>
          )}
        </div>
        <div style={{ flex: 1, padding: "1rem", overflowY: "auto" }}>
          {running && (
            <div style={{ color: "#6366f1", fontSize: "0.8rem" }}>Running…</div>
          )}
          {!running && result && (
            <>
              {result.output && (
                <pre style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8", fontFamily: "'Fira Code',monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {result.output}
                </pre>
              )}
              {result.error && (
                <pre style={{ margin: result.output ? "0.75rem 0 0" : 0, fontSize: "0.8rem", color: "#ef4444", fontFamily: "'Fira Code',monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  Error: {result.error}
                </pre>
              )}
              {!result.output && !result.error && (
                <span style={{ color: "#475569", fontSize: "0.8rem" }}>No output</span>
              )}
            </>
          )}
          {!running && !result && (
            <span style={{ color: "#475569", fontSize: "0.8rem" }}>Run code to see output here</span>
          )}
        </div>
      </div>
    </div>
  );
}
