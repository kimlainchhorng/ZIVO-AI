"use client";

import { useState } from "react";
import JSZip from "jszip";
import {
  MOBILE_PLATFORMS,
  MOBILE_PLATFORM_LABELS,
  type MobilePlatform,
} from "@/prompts/mobile-builder";

interface MobileFile {
  path: string;
  content: string;
}

interface GenerateMobileResponse {
  platform: MobilePlatform;
  files: MobileFile[];
  summary: string;
  setup_instructions: string;
}

export default function MobileBuilder() {
  const [platform, setPlatform] = useState<MobilePlatform>("flutter");
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<GenerateMobileResponse | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!description.trim()) {
      setError("Please describe your mobile app.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/generate-mobile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, description: description.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
      }

      const data = (await res.json()) as GenerateMobileResponse;
      setResult(data);
    } catch (err: unknown) {
      setError((err as Error).message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadZip() {
    if (!result) return;
    const zip = new JSZip();
    for (const file of result.files) {
      zip.file(file.path, file.content);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.platform}-app.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ maxWidth: 680, margin: "2rem auto", padding: "0 1rem", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>Mobile Builder</h1>

      <form onSubmit={handleGenerate}>
        {/* Platform selector */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: 6 }}>
            Platform
          </label>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {MOBILE_PLATFORMS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlatform(p)}
                style={{
                  padding: "0.4rem 0.9rem",
                  borderRadius: 8,
                  border: `2px solid ${platform === p ? "#1f2937" : "#d1d5db"}`,
                  background: platform === p ? "#1f2937" : "#f9fafb",
                  color: platform === p ? "#fff" : "#374151",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                {MOBILE_PLATFORM_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Description input */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: 6 }}>
            App Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Describe your mobile app (e.g. A task management app with user authentication and real-time sync)"
            style={{
              width: "100%",
              padding: "0.6rem 0.75rem",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              fontSize: "0.9rem",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Error state */}
        {error && (
          <div
            role="alert"
            style={{
              marginBottom: "1rem",
              padding: "0.75rem 1rem",
              background: "#fee2e2",
              border: "1px solid #fca5a5",
              borderRadius: 8,
              color: "#dc2626",
              fontSize: "0.875rem",
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.6rem 1.5rem",
            background: loading ? "#9ca3af" : "#1f2937",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "0.9rem",
          }}
        >
          {loading ? "Generating…" : "Generate App"}
        </button>
      </form>

      {/* Result */}
      {result && (
        <div style={{ marginTop: "2rem", border: "1px solid #e5e7eb", borderRadius: 10, padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>Generated Files ({result.files.length})</h2>
            <button
              onClick={handleDownloadZip}
              style={{
                padding: "0.4rem 1rem",
                background: "#1f2937",
                color: "#fff",
                border: "none",
                borderRadius: 7,
                fontWeight: 500,
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              Download ZIP
            </button>
          </div>

          <p style={{ fontSize: "0.875rem", color: "#4b5563", margin: "0 0 1rem" }}>{result.summary}</p>

          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {result.files.map((f) => (
              <li
                key={f.path}
                style={{
                  padding: "0.35rem 0.5rem",
                  borderRadius: 6,
                  fontSize: "0.85rem",
                  fontFamily: "monospace",
                  color: "#374151",
                  background: "#f3f4f6",
                  marginBottom: 4,
                }}
              >
                {f.path}
              </li>
            ))}
          </ul>

          {result.setup_instructions && (
            <details style={{ marginTop: "1rem" }}>
              <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}>
                Setup Instructions
              </summary>
              <pre
                style={{
                  marginTop: "0.5rem",
                  fontSize: "0.8rem",
                  background: "#f3f4f6",
                  padding: "0.75rem",
                  borderRadius: 7,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {result.setup_instructions}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
