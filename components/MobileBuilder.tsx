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
      // Fallback: select and prompt manual copy
      alert("Copy failed. Please select and copy the code manually.");
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
              {result.commands.map((cmd, i) => (
                <p key={i}>$ {cmd}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
