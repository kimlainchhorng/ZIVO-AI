"use client";
import { useEffect, useState } from "react";

interface ProjectHistory {
  name: string;
  url: string;
  prompt: string;
  html: string;
}

export default function AIBuilder() {
  const [prompt, setPrompt] = useState("");
  const [projectName, setProjectName] = useState("");
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ProjectHistory[]>([]);
  const [saveUrl, setSaveUrl] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem("ai_builder_history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return alert("Enter a prompt first");
    setLoading(true);
    try {
      const body: { prompt: string; existingHtml?: string } = { prompt };
      if (html.trim()) body.existingHtml = html;
      const res = await fetch("/api/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.result) {
        setHtml(data.result);
        setPrompt(""); // Clear instruction box after successful update
      }
    } catch {
      alert("Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!projectName.trim() || !html) return alert("Project name and content required");
    setLoading(true);
    setSaveStatus("");

    try {
      const res = await fetch("/api/save-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html, projectName: projectName.trim() }),
      });
      const data = await res.json();

      if (data.ok) {
        setSaveUrl(data.url);
        setSaveStatus(`Saved! View at: ${data.url}`);
        const newEntry = { name: projectName.trim(), url: data.url, prompt, html };
        const updatedHistory = [newEntry, ...history.filter((p) => p.name !== projectName.trim())];
        setHistory(updatedHistory);
        localStorage.setItem("ai_builder_history", JSON.stringify(updatedHistory));
      }
    } catch {
      alert("Save failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (name: string) => {
    const updatedHistory = history.filter((p) => p.name !== name);
    setHistory(updatedHistory);
    localStorage.setItem("ai_builder_history", JSON.stringify(updatedHistory));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(html);
    alert("HTML Copied to Clipboard!");
  };

  return (
    <div className="min-h-screen p-6 font-sans">
      <h1 className="text-2xl font-bold mb-6">AI Project Dashboard</h1>

      <div className="flex gap-6">
        {/* Left Panel — 40% */}
        <div className="w-2/5 flex flex-col gap-4">
          <input
            type="text"
            placeholder="Project name (e.g., my-portfolio)"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full p-3 border rounded shadow-sm"
          />
          <textarea
            placeholder={html ? "Describe changes to make…" : "What kind of site should I build?"}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-40 p-3 border rounded shadow-sm"
          />
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-black text-white px-6 py-2 rounded hover:opacity-80 disabled:bg-gray-400"
            >
              {loading ? "Building..." : html ? "Update Site" : "Generate Site"}
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !html}
              className="bg-green-600 text-white px-6 py-2 rounded hover:opacity-80 disabled:bg-gray-400"
            >
              Save
            </button>
          </div>
          {saveStatus && (
            <p className="text-sm text-green-700">
              {saveStatus}{" "}
              {saveUrl && (
                <a href={saveUrl} target="_blank" className="underline text-blue-600">
                  Open
                </a>
              )}
            </p>
          )}
        </div>

        {/* Right Panel — 60% */}
        <div className="w-3/5 flex flex-col gap-4">
          {/* Live Preview */}
          <div className="border rounded-lg overflow-hidden shadow-lg">
            <div className="bg-gray-100 p-2 flex justify-between items-center border-b">
              <span className="text-sm font-medium">Live Preview</span>
              {html && (
                <button onClick={copyToClipboard} className="text-xs bg-white border px-2 py-1 rounded">
                  Copy HTML
                </button>
              )}
            </div>
            {html ? (
              <iframe srcDoc={html} className="w-full h-64 bg-white" title="preview" />
            ) : (
              <div className="w-full h-64 flex items-center justify-center text-gray-400 text-sm">
                Preview will appear here
              </div>
            )}
          </div>

          {/* Project History */}
          <div className="border rounded-lg p-4">
            <h3 className="text-base font-semibold mb-3">Project History</h3>
            {history.length === 0 ? (
              <p className="text-gray-400 italic text-sm">No saved projects yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {history.map((proj, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-100"
                  >
                    <span className="font-medium text-gray-700 text-sm">{proj.name}</span>
                    <div className="flex gap-3 text-sm">
                      <a href={proj.url} target="_blank" className="text-blue-500 hover:underline">
                        Open
                      </a>
                      <button
                        onClick={() => {
                          setProjectName(proj.name);
                          setHtml(proj.html);
                          setPrompt("");
                          setSaveUrl(proj.url);
                          setSaveStatus("");
                        }}
                        className="text-gray-500 hover:text-black"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(proj.name)}
                        className="text-red-400 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
