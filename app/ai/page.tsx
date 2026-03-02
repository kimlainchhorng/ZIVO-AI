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
  const [saveSuccess, setSaveSuccess] = useState(false);

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, ...(html && { existingHtml: html }) }),
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
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/save-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html, projectName: projectName.trim() }),
      });
      const data = await res.json();

      if (data.ok) {
        setSaveUrl(data.url);
        setSaveSuccess(true);
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
  };

  // Helper for Copying
  const copyToClipboard = () => {
    navigator.clipboard.writeText(html);
    alert("HTML Copied to Clipboard!");
  };

  return (
    <div className="flex flex-col h-screen font-sans overflow-hidden">
      {/* Header */}
      <header className="px-6 py-3 border-b bg-white flex items-center gap-3 shrink-0">
        <h1 className="text-xl font-bold">AI Builder</h1>
      </header>

      {/* Main content: side-by-side layout */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Left panel – 40%: Controls + project management */}
        <aside className="w-full md:w-2/5 border-r flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Project Name</label>
              <input
                type="text"
                placeholder="e.g., my-portfolio"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full p-3 border rounded shadow-sm text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Prompt</label>
              <textarea
                placeholder="What kind of site should I build?"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-36 p-3 border rounded shadow-sm text-sm resize-none"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="bg-black text-white px-5 py-2 rounded hover:opacity-80 disabled:bg-gray-400 text-sm"
              >
                {loading ? "Building..." : "Generate / Update"}
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !html}
                className="bg-green-600 text-white px-5 py-2 rounded hover:opacity-80 disabled:bg-gray-400 text-sm"
              >
                Save Project
              </button>
            </div>

            {saveSuccess && saveUrl && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded px-3 py-2">
                <span>✅ Saved!</span>
                <a href={saveUrl} target="_blank" className="underline font-medium hover:text-green-900">
                  View Live Site
                </a>
              </div>
            )}

            {/* Project history */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3 text-gray-700">Your Projects</h3>
              {history.length === 0 ? (
                <p className="text-gray-400 italic text-sm">No saved projects found.</p>
              ) : (
                <div className="space-y-2">
                  {history.map((proj, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-100"
                    >
                      <span className="font-medium text-gray-700 text-sm truncate mr-2">{proj.name}</span>
                      <div className="flex gap-3 text-xs shrink-0">
                        <a href={proj.url} target="_blank" className="text-blue-500 hover:underline">
                          Open
                        </a>
                        <button
                          onClick={() => {
                            setProjectName(proj.name);
                            setPrompt(proj.prompt);
                            setHtml(proj.html);
                            setSaveUrl("");
                            setSaveSuccess(false);
                          }}
                          className="text-gray-500 hover:text-black"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deleteProject(proj.name)}
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
        </aside>

        {/* Right panel – 60%: Preview (top) + spacer */}
        <main className="w-full md:w-3/5 flex flex-col overflow-hidden bg-gray-50">
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 flex justify-between items-center border-b shrink-0">
              <span className="text-sm font-medium">
                {html ? "Live Preview" : "Preview"}
              </span>
              {html && (
                <button onClick={copyToClipboard} className="text-xs bg-white border px-2 py-1 rounded hover:bg-gray-50">
                  Copy HTML
                </button>
              )}
            </div>
            {html ? (
              <iframe srcDoc={html} className="flex-1 w-full bg-white" title="preview" />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                Generate a site to see the preview here.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
