"use client";

import { useState } from "react";
import { Loader2, Copy, Download } from "lucide-react";

interface ColorSwatch {
  name: string;
  hex: string;
}

interface FontPair {
  role: string;
  name: string;
}

interface BrandResult {
  summary: string;
  colorPalette: ColorSwatch[];
  fonts: FontPair[];
  files: Array<{ path: string; content: string }>;
}

export default function BrandKitViewer() {
  const [appName, setAppName] = useState("");
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState<"modern" | "minimal" | "bold" | "playful">("modern");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BrandResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!appName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appName, description, style }),
      });
      const data = await res.json() as BrandResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const copyHex = (hex: string) => {
    navigator.clipboard.writeText(hex).catch(console.error);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">
          🖼️ Brand Kit Generator
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Generate a complete brand identity for your app
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            App Name *
          </label>
          <input
            type="text"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="My App"
            className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A modern web application for…"
            className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Brand Style
          </label>
          <div className="flex gap-2 flex-wrap">
            {(["modern", "minimal", "bold", "playful"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStyle(s)}
                className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                  style === s
                    ? "bg-indigo-600 text-white"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !appName.trim()}
          className="w-full bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating…
            </>
          ) : (
            "Generate Brand Kit"
          )}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</p>
      )}

      {result && (
        <div className="space-y-4">
          <p className="text-sm text-gray-700">{result.summary}</p>

          {result.colorPalette?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Color Palette
              </p>
              <div className="flex gap-3 flex-wrap">
                {result.colorPalette.map((c) => (
                  <div key={c.hex} className="text-center">
                    <div
                      className="w-12 h-12 rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:scale-105 transition-transform"
                      style={{ backgroundColor: c.hex }}
                      onClick={() => copyHex(c.hex)}
                      title={`Copy ${c.hex}`}
                    />
                    <p className="text-xs text-gray-600 mt-1">{c.name}</p>
                    <div className="flex items-center gap-1 justify-center">
                      <p className="text-xs font-mono text-gray-400">{c.hex}</p>
                      <Copy className="w-3 h-3 text-gray-400 cursor-pointer" onClick={() => copyHex(c.hex)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.fonts?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Font Pairing
              </p>
              <div className="flex gap-4">
                {result.fonts.map((f) => (
                  <div key={f.role} className="text-sm">
                    <span className="text-gray-400 text-xs">{f.role}: </span>
                    <span className="text-gray-700 font-medium">{f.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Generated Files
            </p>
            <div className="space-y-1">
              {result.files.map((f) => (
                <div
                  key={f.path}
                  className="flex items-center justify-between text-xs font-mono bg-gray-50 rounded px-3 py-2 border border-gray-200"
                >
                  <span>📄 {f.path}</span>
                  <Download className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-600" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
