"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2, Bot } from "lucide-react";

interface ChatbotConfig {
  botName: string;
  personality: string;
  primaryColor: string;
}

interface GeneratedFile {
  path: string;
  content: string;
}

interface BuildResult {
  files: GeneratedFile[];
  summary: string;
  setupInstructions: string;
}

export default function ChatbotBuilder() {
  const [config, setConfig] = useState<ChatbotConfig>({
    botName: "Assistant",
    personality: "helpful and professional",
    primaryColor: "#4f46e5",
  });
  const [knowledgeFiles, setKnowledgeFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BuildResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    setKnowledgeFiles((prev) => [...prev, ...accepted]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/plain": [".txt"],
      "application/pdf": [".pdf"],
      "text/markdown": [".md"],
    },
  });

  const handleBuild = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botName: config.botName,
          personality: config.personality,
          primaryColor: config.primaryColor,
          knowledgeBaseDescription:
            knowledgeFiles.length > 0
              ? knowledgeFiles.map((f) => f.name).join(", ")
              : "general knowledge",
        }),
      });
      const data = await res.json() as BuildResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Build failed");
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
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Bot className="w-5 h-5" /> AI Chatbot Builder
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Build a RAG-powered chatbot with your own knowledge base
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Bot Name
          </label>
          <input
            type="text"
            value={config.botName}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, botName: e.target.value }))
            }
            className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Personality
          </label>
          <input
            type="text"
            value={config.personality}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, personality: e.target.value }))
            }
            placeholder="helpful and professional"
            className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Primary Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={config.primaryColor}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, primaryColor: e.target.value }))
              }
              className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
            />
            <span className="text-sm text-gray-600">{config.primaryColor}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Knowledge Base (optional)
          </label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1" />
            <p className="text-xs text-gray-500">
              Drop PDF, TXT, or MD files here
            </p>
          </div>
          {knowledgeFiles.length > 0 && (
            <ul className="mt-2 space-y-1">
              {knowledgeFiles.map((f) => (
                <li key={f.name} className="text-xs text-gray-600">
                  📄 {f.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          onClick={handleBuild}
          disabled={loading}
          className="w-full bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Building…
            </>
          ) : (
            "Build Chatbot"
          )}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</p>
      )}

      {result && (
        <div className="space-y-3">
          <p className="text-sm text-gray-800 font-medium">{result.summary}</p>
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
      )}
    </div>
  );
}
