"use client";
import { useEffect, useState } from "react";

interface ProjectHistory {
  name: string;
  url: string;
  prompt: string;
  html: string; // Store HTML for quick preview/copying
}

export default function AIBuilder() {
  const [prompt, setPrompt] = useState("");
  const [projectName, setProjectName] = useState("");
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ProjectHistory[]>([]);
  const [saveUrl, setSaveUrl] = useState("");

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem("ai_builder_history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return alert("Enter a prompt first");
    setLoading(true);
    try {
      const res = await fetch("/api/generate-site", {
        method: "POST",
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.result) setHtml(data.result);
    } catch (err) {
      alert("Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!projectName.trim() || !html) return alert("Project name and content required");
    setLoading(true);

    try {
      const res = await fetch("/api/save-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html, projectName: projectName.trim() }),
      });
      const data = await res.json();

      if (data.ok) {
        setSaveUrl(data.url);
        // Add to history and remove duplicates
        const newEntry = { name: projectName.trim(), url: data.url, prompt, html };
        const updatedHistory = [newEntry, ...history.filter((p) => p.name !== projectName.trim())];
        
        setHistory(updatedHistory);
        localStorage.setItem("ai_builder_history", JSON.stringify(updatedHistory));
      }
    } catch (err) {
      alert("Save failed");
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = (name: string) => {
    if (!confirm(`Delete project "${name}"?`)) return;
    const updatedHistory = history.filter((p) => p.name !== name);
    setHistory(updatedHistory);
    localStorage.setItem("ai_builder_history", JSON.stringify(updatedHistory));
    if (projectName === name) {
      setProjectName("");
      setPrompt("");
      setHtml("");
      setSaveUrl("");
    }
  };

  // Helper for Copying
  const copyToClipboard = () => {
    navigator.clipboard.writeText(html);
    alert("HTML Copied to Clipboard!");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 font-sans">
      <h1 className="text-2xl font-bold mb-6">AI Project Dashboard</h1>

      {/* Project Configuration */}
      <div className="space-y-4 mb-8">
        <input
          type="text"
          placeholder="Project name (e.g., my-portfolio)"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="w-full p-3 border rounded shadow-sm"
        />
        <textarea
          placeholder="What kind of site should I build?"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full h-32 p-3 border rounded shadow-sm"
        />
        <div className="flex gap-4">
          <button 
            onClick={handleGenerate} 
            disabled={loading}
            className="bg-black text-white px-6 py-2 rounded hover:opacity-80 disabled:bg-gray-400"
          >
            {loading ? "Building..." : "Generate Site"}
          </button>
          <button 
            onClick={handleSave} 
            disabled={loading || !html}
            className="bg-green-600 text-white px-6 py-2 rounded hover:opacity-80 disabled:bg-gray-400"
          >
            Save Project
          </button>
          {saveUrl && (
            <a href={saveUrl} target="_blank" className="flex items-center text-blue-600 underline">
              View Live Site
            </a>
          )}
        </div>
      </div>

      {/* Live Preview Pane */}
      {html && (
        <div className="border rounded-lg overflow-hidden shadow-lg mb-10">
          <div className="bg-gray-100 p-2 flex justify-between items-center border-b">
            <span className="text-sm font-medium">Desktop Preview</span>
            <button onClick={copyToClipboard} className="text-xs bg-white border px-2 py-1 rounded">
              Copy HTML
            </button>
          </div>
          <iframe srcDoc={html} className="w-full h-[500px] bg-white" title="preview" />
        </div>
      )}

      {/* Persistent History List */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Your Projects</h3>
        {history.length === 0 ? (
          <p className="text-gray-400 italic">No saved projects found.</p>
        ) : (
          <div className="grid gap-2">
            {history.map((proj, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-100">
                <span className="font-medium text-gray-700">{proj.name}</span>
                <div className="flex gap-4 text-sm">
                  <a href={proj.url} target="_blank" className="text-blue-500 hover:underline">Open Link</a>
                  <button 
                    onClick={() => { 
                      setProjectName(proj.name); 
                      setPrompt(proj.prompt); 
                      setHtml(proj.html);
                    }}
                    className="text-gray-500 hover:text-black"
                  >
                    Edit/Regenerate
                  </button>
                  <button
                    onClick={() => deleteProject(proj.name)}
                    className="text-red-500 hover:text-red-700"
                    aria-label={`Delete project ${proj.name}`}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
