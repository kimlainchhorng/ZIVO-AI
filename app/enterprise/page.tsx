"use client";

import React, { useState, useEffect } from "react";

interface EnterprisePlatform {
  id: string;
  number: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  features: string[];
}

interface EnterpriseFeatures {
  aiMl: string[];
  enterpriseManagement: string[];
  advancedSecurity: string[];
  analyticsAndBi: string[];
}

interface EnterpriseIntegrations {
  [category: string]: string[];
}

export default function EnterprisePage() {
  const [platforms, setPlatforms] = useState<EnterprisePlatform[]>([]);
  const [features, setFeatures] = useState<EnterpriseFeatures | null>(null);
  const [integrations, setIntegrations] = useState<EnterpriseIntegrations | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<EnterprisePlatform | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"platforms" | "features" | "integrations">("platforms");
  const [previewVisible, setPreviewVisible] = useState(false);

  useEffect(() => {
    fetch("/api/enterprise-platform")
      .then((r) => r.json())
      .then((data) => {
        setPlatforms(data.platforms ?? []);
        setFeatures(data.features ?? null);
        setIntegrations(data.integrations ?? null);
      })
      .catch(() => {});
  }, []);

  function toggleFeature(feature: string) {
    setSelectedFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
    );
  }

  async function handleGenerate() {
    if (!selectedPlatform) {
      setError("Please select a platform first.");
      return;
    }
    setGenerating(true);
    setError("");
    setResult("");
    setPreviewVisible(false);

    try {
      const res = await fetch("/api/enterprise-platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platformId: selectedPlatform.id,
          features: selectedFeatures,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data.result ?? "");
        setPreviewVisible(true);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  const INTEGRATION_LABELS: Record<string, string> = {
    healthcare: "Healthcare (15+)",
    education: "Education (15+)",
    hospitality: "Hospitality (15+)",
    retail: "Retail (15+)",
    foodAndBeverage: "Food & Beverage (15+)",
    entertainment: "Entertainment (15+)",
    transportation: "Transportation (15+)",
    enterprise: "Enterprise (10+)",
  };

  const FEATURE_LABELS: Record<string, string> = {
    aiMl: "AI / ML Enterprise",
    enterpriseManagement: "Enterprise Management",
    advancedSecurity: "Advanced Security",
    analyticsAndBi: "Advanced Analytics & BI",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f0f", color: "#f0f0f0", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{ background: "#1a1a1a", borderBottom: "1px solid #333", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>🏢</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: "-0.5px" }}>
              ZIVO Enterprise Suite
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: "#888" }}>
              Complete Enterprise Platform — 9 Verticals · 150+ Features · 100+ Integrations
            </p>
          </div>
        </div>
        <a
          href="/ai"
          style={{ padding: "8px 18px", borderRadius: 8, background: "#333", color: "#f0f0f0", textDecoration: "none", fontSize: 14, fontWeight: 600 }}
        >
          ← AI Builder
        </a>
      </header>

      <div style={{ display: "flex", height: "calc(100vh - 73px)" }}>
        {/* Sidebar */}
        <aside style={{ width: 260, background: "#141414", borderRight: "1px solid #333", padding: "20px 0", overflowY: "auto", flexShrink: 0 }}>
          <div style={{ padding: "0 16px 16px", fontSize: 11, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: 1 }}>
            Navigation
          </div>
          {[
            { id: "platforms", label: "🏭 Platforms (9)", count: 9 },
            { id: "features", label: "⚡ Features (150+)", count: 150 },
            { id: "integrations", label: "🔗 Integrations (100+)", count: 100 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "platforms" | "features" | "integrations")}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "12px 20px",
                background: activeTab === tab.id ? "#252525" : "transparent",
                border: "none",
                borderLeft: activeTab === tab.id ? "3px solid #6366f1" : "3px solid transparent",
                color: activeTab === tab.id ? "#f0f0f0" : "#999",
                fontSize: 14,
                fontWeight: activeTab === tab.id ? 700 : 400,
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}

          {selectedPlatform && (
            <div style={{ margin: "24px 16px 0", padding: 14, background: "#1f1f1f", borderRadius: 10, border: "1px solid #333" }}>
              <div style={{ fontSize: 11, color: "#888", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Selected</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>{selectedPlatform.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{selectedPlatform.name}</span>
              </div>
              {selectedFeatures.length > 0 && (
                <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>
                  {selectedFeatures.length} feature{selectedFeatures.length !== 1 ? "s" : ""} selected
                </div>
              )}
              <button
                onClick={handleGenerate}
                disabled={generating}
                style={{
                  width: "100%",
                  padding: "10px 0",
                  borderRadius: 8,
                  border: "none",
                  background: generating ? "#444" : selectedPlatform.color,
                  color: "white",
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: generating ? "not-allowed" : "pointer",
                }}
              >
                {generating ? "Generating…" : "✨ Generate"}
              </button>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, overflowY: "auto", padding: 28 }}>
          {error && (
            <div style={{ marginBottom: 20, padding: "12px 16px", background: "#3b0a0a", border: "1px solid #b91c1c", borderRadius: 8, color: "#fca5a5", fontSize: 14 }}>
              {error}
            </div>
          )}

          {/* Platforms Tab */}
          {activeTab === "platforms" && (
            <div>
              <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800 }}>Enterprise Vertical Platforms</h2>
              <p style={{ margin: "0 0 24px", color: "#888", fontSize: 14 }}>
                Select a platform to configure and generate a full-featured enterprise dashboard.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                {platforms.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedPlatform(p);
                      setSelectedFeatures([]);
                    }}
                    style={{
                      padding: 20,
                      borderRadius: 12,
                      background: selectedPlatform?.id === p.id ? "#1f1f1f" : "#181818",
                      border: `2px solid ${selectedPlatform?.id === p.id ? p.color : "#2a2a2a"}`,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                      <span style={{ fontSize: 32 }}>{p.icon}</span>
                      <div>
                        <div style={{ fontSize: 11, color: p.color, fontWeight: 700, marginBottom: 2 }}>
                          Platform #{p.number}
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 800 }}>{p.name}</div>
                      </div>
                    </div>
                    <p style={{ margin: "0 0 12px", fontSize: 13, color: "#aaa", lineHeight: 1.5 }}>{p.description}</p>
                    <div style={{ fontSize: 12, color: "#666" }}>{p.features.length} features included</div>
                  </div>
                ))}
              </div>

              {selectedPlatform && (
                <div style={{ marginTop: 32 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14, color: selectedPlatform.color }}>
                    {selectedPlatform.icon} {selectedPlatform.name} — Feature Selection
                  </h3>
                  <p style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>
                    Optionally select specific features to include in your generated platform (leave empty to use defaults).
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {selectedPlatform.features.map((feature) => (
                      <button
                        key={feature}
                        onClick={() => toggleFeature(feature)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 20,
                          border: `1px solid ${selectedFeatures.includes(feature) ? selectedPlatform.color : "#333"}`,
                          background: selectedFeatures.includes(feature) ? `${selectedPlatform.color}22` : "#1a1a1a",
                          color: selectedFeatures.includes(feature) ? selectedPlatform.color : "#aaa",
                          fontSize: 12,
                          cursor: "pointer",
                          fontWeight: selectedFeatures.includes(feature) ? 700 : 400,
                        }}
                      >
                        {feature}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    style={{
                      marginTop: 20,
                      padding: "12px 28px",
                      borderRadius: 10,
                      border: "none",
                      background: generating ? "#444" : selectedPlatform.color,
                      color: "white",
                      fontWeight: 800,
                      fontSize: 15,
                      cursor: generating ? "not-allowed" : "pointer",
                    }}
                  >
                    {generating ? "⏳ Generating Enterprise Platform…" : `✨ Generate ${selectedPlatform.name}`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Features Tab */}
          {activeTab === "features" && features && (
            <div>
              <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800 }}>Advanced Enterprise Features</h2>
              <p style={{ margin: "0 0 24px", color: "#888", fontSize: 14 }}>
                150+ enterprise-grade capabilities included across all vertical platforms.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
                {(Object.keys(features) as (keyof EnterpriseFeatures)[]).map((category) => (
                  <div key={category} style={{ background: "#181818", border: "1px solid #2a2a2a", borderRadius: 12, padding: 20 }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 800, color: "#a78bfa" }}>
                      {FEATURE_LABELS[category] ?? category}
                    </h3>
                    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                      {features[category].map((f) => (
                        <li key={f} style={{ padding: "5px 0", fontSize: 13, color: "#ccc", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #222" }}>
                          <span style={{ color: "#6366f1", fontSize: 10 }}>●</span> {f}
                        </li>
                      ))}
                    </ul>
                    <div style={{ marginTop: 10, fontSize: 11, color: "#555", textAlign: "right" }}>
                      {features[category].length} features
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === "integrations" && integrations && (
            <div>
              <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800 }}>100+ Enterprise Integrations</h2>
              <p style={{ margin: "0 0 24px", color: "#888", fontSize: 14 }}>
                Pre-built connectors for the most popular platforms across all industries.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                {(Object.keys(integrations) as string[]).map((category) => (
                  <div key={category} style={{ background: "#181818", border: "1px solid #2a2a2a", borderRadius: 12, padding: 20 }}>
                    <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 800, color: "#34d399" }}>
                      {INTEGRATION_LABELS[category] ?? category}
                    </h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {integrations[category].map((integration: string) => (
                        <span
                          key={integration}
                          style={{ padding: "4px 10px", borderRadius: 6, background: "#252525", border: "1px solid #333", fontSize: 12, color: "#ccc" }}
                        >
                          {integration}
                        </span>
                      ))}
                    </div>
                    <div style={{ marginTop: 12, fontSize: 11, color: "#555", textAlign: "right" }}>
                      {integrations[category].length} integrations
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {previewVisible && result && (
            <div style={{ marginTop: 32 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
                  ✅ Generated: {selectedPlatform?.name}
                </h3>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => {
                      const blob = new Blob([result], { type: "text/html" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${selectedPlatform?.id ?? "enterprise"}-platform.html`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#1d4ed8", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                  >
                    ⬇️ Download HTML
                  </button>
                  <button
                    onClick={() => setPreviewVisible(false)}
                    style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #333", background: "transparent", color: "#aaa", fontSize: 13, cursor: "pointer" }}
                  >
                    ✕ Close
                  </button>
                </div>
              </div>
              <iframe
                srcDoc={result}
                style={{ width: "100%", height: 600, borderRadius: 12, border: "1px solid #333", background: "white" }}
                title="Generated Enterprise Platform"
                sandbox="allow-scripts"
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
