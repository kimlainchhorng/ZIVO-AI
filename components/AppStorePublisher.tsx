"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface GeneratedFile {
  path: string;
  content: string;
}

interface PublishResult {
  files: GeneratedFile[];
  summary: string;
  checklist: string[];
}

export default function AppStorePublisher() {
  const [appName, setAppName] = useState("");
  const [bundleId, setBundleId] = useState("");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState<"ios" | "android" | "both">("both");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PublishResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/publish/app-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appName, bundleId, description, platform }),
      });
      const data = await res.json() as PublishResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">
          🏪 App Store Publisher
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Generate everything needed to submit to Apple App Store & Google Play
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="App Name *">
          <input
            type="text"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="My Awesome App"
            required
            className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </Field>

        <Field label="Bundle ID">
          <input
            type="text"
            value={bundleId}
            onChange={(e) => setBundleId(e.target.value)}
            placeholder="com.example.myapp"
            className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </Field>

        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your app…"
            rows={3}
            className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </Field>

        <Field label="Platform">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as typeof platform)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="both">Both (iOS + Android)</option>
            <option value="ios">iOS only</option>
            <option value="android">Android only</option>
          </select>
        </Field>

        <button
          type="submit"
          disabled={loading || !appName.trim()}
          className="w-full bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating…
            </>
          ) : (
            "Generate App Store Files"
          )}
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</p>
      )}

      {result && (
        <div className="space-y-4">
          <p className="text-sm text-gray-800 font-medium">{result.summary}</p>

          {result.checklist?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Submission Checklist
              </p>
              <ul className="space-y-1">
                {result.checklist.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                    <span className="text-green-500">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
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
                  className="text-xs font-mono bg-gray-50 rounded px-3 py-2 border border-gray-200"
                >
                  📄 {f.path}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
