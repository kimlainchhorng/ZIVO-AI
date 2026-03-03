'use client';

import { useState } from "react";

export default function AIPage() {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function handleBuild() {
    if (!prompt.trim()) return;

    setLoading(true);
    setOutput(null);

    try {
      const res = await fetch("/api/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      setOutput(data);
    } catch (err) {
      setOutput({ error: "Request failed" });
    }

    setLoading(false);
  }

  return (
    <div className="p-8">
      <h1>ZIVO AI Builder</h1>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full border p-2"
      />

      <button onClick={handleBuild} disabled={loading}>
        {loading ? "Building..." : "Build"}
      </button>

      <pre className="mt-6 bg-black text-green-400 p-4">
        {output ? JSON.stringify(output, null, 2) : "No output yet."}
      </pre>
    </div>
  );
}