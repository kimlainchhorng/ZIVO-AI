'use client';

import { useEffect, useRef, useState } from "react";

export interface Diagram {
  type: string;
  title: string;
  mermaid: string;
  description: string;
}

export interface ArchVisualizerProps {
  diagrams: Diagram[];
  summary?: string;
}

export default function ArchVisualizer({ diagrams, summary }: ArchVisualizerProps): React.ReactElement {
  const [active, setActive] = useState<number>(0);
  const [rendered, setRendered] = useState<Record<number, string>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const currentDiagram = diagrams[active];

  useEffect(() => {
    if (!currentDiagram || rendered[active]) return;

    const renderDiagram = async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          themeVariables: {
            primaryColor: "#6366f1",
            primaryTextColor: "#f1f5f9",
            primaryBorderColor: "rgba(99,102,241,0.4)",
            lineColor: "#475569",
            background: "#0f1120",
            mainBkg: "#0f1120",
            nodeBorder: "rgba(255,255,255,0.1)",
            clusterBkg: "rgba(255,255,255,0.04)",
          },
        });

        const id = `mermaid-${active}`;
        const { svg } = await mermaid.render(id, currentDiagram.mermaid);
        setRendered((prev) => ({ ...prev, [active]: svg }));
      } catch {
        setRendered((prev) => ({
          ...prev,
          [active]: `<p style="color:#ef4444;padding:1rem">Failed to render diagram. Check Mermaid syntax.</p>`,
        }));
      }
    };

    renderDiagram();
  }, [active, currentDiagram, rendered]);

  const exportSvg = () => {
    const svg = rendered[active];
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentDiagram?.type ?? "diagram"}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        fontFamily: "'Inter',system-ui,sans-serif",
        color: "#f1f5f9",
      }}
    >
      {summary && (
        <p style={{ margin: 0, padding: "0.75rem 1rem", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8, fontSize: "0.875rem", color: "#cbd5e1" }}>
          {summary}
        </p>
      )}

      {/* Diagram tabs */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {diagrams.map((d, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            style={{
              padding: "0.4rem 0.9rem",
              background: active === i ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${active === i ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 8,
              color: active === i ? "#a5b4fc" : "#94a3b8",
              fontWeight: active === i ? 600 : 400,
              fontSize: "0.8125rem",
              cursor: "pointer",
            }}
          >
            {d.title}
          </button>
        ))}
      </div>

      {/* Diagram viewer */}
      {currentDiagram && (
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.75rem 1rem",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(0,0,0,0.2)",
            }}
          >
            <div>
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{currentDiagram.title}</span>
              <span style={{ marginLeft: "0.75rem", fontSize: "0.75rem", color: "#64748b" }}>
                {currentDiagram.type}
              </span>
            </div>
            <button
              onClick={exportSvg}
              disabled={!rendered[active]}
              style={{
                padding: "0.3rem 0.75rem",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 6,
                color: "#94a3b8",
                fontSize: "0.75rem",
                cursor: rendered[active] ? "pointer" : "not-allowed",
                opacity: rendered[active] ? 1 : 0.5,
              }}
            >
              Export SVG
            </button>
          </div>

          <p style={{ margin: "0.75rem 1rem 0", fontSize: "0.8rem", color: "#64748b" }}>
            {currentDiagram.description}
          </p>

          <div
            ref={containerRef}
            style={{ padding: "1.5rem", minHeight: 200, overflowX: "auto", overflowY: "hidden" }}
          >
            {rendered[active] ? (
              <div dangerouslySetInnerHTML={{ __html: rendered[active] }} />
            ) : (
              <div style={{ textAlign: "center", color: "#475569", padding: "2rem" }}>
                Rendering diagram…
              </div>
            )}
          </div>

          {/* Raw Mermaid */}
          <details style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <summary style={{ padding: "0.5rem 1rem", cursor: "pointer", fontSize: "0.75rem", color: "#64748b" }}>
              View Mermaid source
            </summary>
            <pre
              style={{
                margin: 0,
                padding: "0.75rem 1rem",
                background: "rgba(0,0,0,0.3)",
                fontSize: "0.75rem",
                color: "#94a3b8",
                overflowX: "auto",
              }}
            >
              {currentDiagram.mermaid}
            </pre>
          </details>
        </div>
      )}

      {diagrams.length === 0 && (
        <div style={{ padding: "2rem", textAlign: "center", color: "#475569" }}>
          No diagrams to display. Upload project files to generate an architecture visualization.
        </div>
      )}
    </div>
  );
}
