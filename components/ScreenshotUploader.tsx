"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { Upload, X, Loader2 } from "lucide-react";

interface GeneratedFile {
  path: string;
  content: string;
}

interface ScreenshotResult {
  files: GeneratedFile[];
  summary: string;
  components: string[];
}

export default function ScreenshotUploader() {
  const [preview, setPreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScreenshotResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1,
  });

  const handleConvert = async () => {
    if (!imageFile) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      if (instructions) formData.append("instructions", instructions);

      const res = await fetch("/api/screenshot-to-code", {
        method: "POST",
        body: formData,
      });
      const data = await res.json() as ScreenshotResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Conversion failed");
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setImageFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-600">
          Drag & drop a screenshot, or click to select
        </p>
        <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP supported</p>
      </div>

      {preview && (
        <div className="relative inline-block">
          <Image
            src={preview}
            alt="Preview"
            width={600}
            height={400}
            unoptimized
            className="max-h-64 rounded-lg border border-gray-200 w-auto"
          />
          <button
            onClick={handleClear}
            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}

      {imageFile && (
        <>
          <input
            type="text"
            placeholder="Additional instructions (optional)…"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleConvert}
            disabled={loading}
            className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Converting…
              </>
            ) : (
              "Convert to Code"
            )}
          </button>
        </>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
      )}

      {result && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-800">{result.summary}</p>
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
