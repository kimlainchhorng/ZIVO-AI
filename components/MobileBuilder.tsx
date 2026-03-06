"use client";

import { useState } from "react";

type MobilePlatform = "flutter" | "react-native" | "kotlin" | "swift";

interface GeneratedFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

interface GenerateMobileResponse {
  files: GeneratedFile[];
  commands?: string[];
  summary: string;
  platform: MobilePlatform;
}

const PLATFORM_LABELS: Record<MobilePlatform, string> = {
  flutter: "Flutter / Dart",
  "react-native": "React Native",
  kotlin: "Kotlin (Android)",
  swift: "Swift (iOS)",
};

const PLATFORM_ICONS: Record<MobilePlatform, string> = {
  flutter: "🦋",
  "react-native": "⚛️",
  kotlin: "🤖",
  swift: "🍎",
};

export default function MobileBuilder() {
  const [platform, setPlatform] = useState<MobilePlatform>("flutter");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateMobileResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!description.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedFile(null);

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
        body: JSON.stringify({ platform, description }),
      });

      const data: unknown = await res.json();

      if (!res.ok || (data && typeof data === "object" && "error" in data)) {
        setError(
          (data as { error?: string })?.error ||
            `Server error (${res.status})`
        );
        return;
      }

      const typed = data as GenerateMobileResponse;
      setResult(typed);
      if (typed.files?.length > 0) {
        setSelectedFile(typed.files[0]);
      }
    } catch {
      setError("Failed to generate mobile app. Please try again.");
    } catch (err) {
      setError((err as Error)?.message || "Failed to generate mobile app. Please try again.");
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

  async function handleCopy(content: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
      setError("Copy failed. Please select and copy the code manually.");
    }
  }

  async function handleDownload() {
    if (!result?.files?.length) return;
    setDownloadError(null);
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: result.files }),
      });
      if (!res.ok) {
        setDownloadError(`Download failed (${res.status})`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zivo-${platform}-app.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError((err as Error)?.message || "Download failed. Please try again.");
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-6xl mx-auto">
      <div>
        <h2 className="text-xl font-bold mb-1">Mobile App Builder</h2>
        <p className="text-sm text-gray-500">
          Generate a complete mobile app scaffold for your chosen platform.
        </p>
      </div>

      {/* Platform Selection */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(Object.keys(PLATFORM_LABELS) as MobilePlatform[]).map((p) => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-sm font-medium transition-colors ${
              platform === p
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 hover:border-gray-300 text-gray-700"
            }`}
          >
            <span className="text-2xl">{PLATFORM_ICONS[p]}</span>
            <span>{PLATFORM_LABELS[p]}</span>
          </button>
        ))}
      </div>

      {/* Description Input */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">
          Describe your app
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={`e.g. A ${PLATFORM_LABELS[platform]} todo app with user authentication, task categories, and push notifications`}
          rows={4}
          className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !description.trim()}
          className="self-start bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Generating…" : `Generate ${PLATFORM_LABELS[platform]} App`}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {downloadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {downloadError}
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{result.summary}</h3>
              <p className="text-xs text-gray-500">{result.files.length} files generated</p>
            </div>
            <div className="flex gap-2">
              {result.commands && result.commands.length > 0 && (
                <div className="bg-gray-100 rounded px-3 py-1 text-xs font-mono text-gray-600">
                  {result.commands[0]}
                </div>
              )}
              <button
                onClick={handleDownload}
                className="bg-gray-900 text-white px-3 py-1.5 rounded text-xs hover:bg-gray-700"
              >
                Download ZIP
              </button>
            </div>
          </div>

          <div className="flex gap-3 border rounded-lg overflow-hidden h-[500px]">
            {/* File List */}
            <div className="w-56 flex-shrink-0 border-r overflow-y-auto bg-gray-50">
              {result.files.map((file) => (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-3 py-2 text-xs font-mono truncate hover:bg-gray-100 border-b border-gray-100 ${
                    selectedFile?.path === file.path
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700"
                  }`}
                  title={file.path}
                >
                  {file.path}
                </button>
              ))}
            </div>

            {/* Code View */}
            <div className="flex-1 overflow-auto relative">
              {selectedFile && (
                <>
                  <div className="sticky top-0 flex items-center justify-between bg-white border-b px-3 py-1.5">
                    <span className="text-xs font-mono text-gray-500 truncate">
                      {selectedFile.path}
                    </span>
                    <button
                      onClick={() => handleCopy(selectedFile.content)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-gray-800 whitespace-pre-wrap break-words leading-relaxed">
                    {selectedFile.content}
                  </pre>
                </>
              )}
            </div>
          </div>

          {result.commands && result.commands.length > 0 && (
            <div className="bg-gray-900 text-green-400 rounded-lg p-3 text-xs font-mono">
              <p className="text-gray-400 mb-1">// Run these commands to get started:</p>
              <p className="text-gray-400 mb-1">{`// Run these commands to get started:`}</p>
              {result.commands.map((cmd, i) => (
                <p key={i}>$ {cmd}</p>
              ))}
            </div>
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
