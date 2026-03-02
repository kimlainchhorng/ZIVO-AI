"use client";
import { useEffect, useState } from "react";

interface ProjectHistory {
  name: string;
  url: string;
  prompt: string;
  html: string;
  agent: string;
}

const AVAILABLE_AGENTS = [
  { id: "web-scraper", name: "Web Scraper", description: "Extract data from websites" },
  { id: "code-generator", name: "Code Generator", description: "Generate code from prompts" },
  { id: "research", name: "Research Agent", description: "Search and gather information" },
  { id: "base", name: "Base Agent", description: "General purpose AI builder" },
];

export default function AIBuilder() {
  const [prompt, setPrompt] = useState("");
  const [projectName, setProjectName] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("base");
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ProjectHistory[]>([]);
  const [saveUrl, setSaveUrl] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("ai_builder_history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return alert("Enter instructions first");
    setLoading(true);
    try {
      const res = await fetch("/api/generate-site", {
        method: "POST",
        body: JSON.stringify({ 
          prompt, 
          agent: selectedAgent,
          existingHtml: html || null 
        }),
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
        body: JSON.stringify({ htmlContent: html, projectId: projectName.trim() }),
      });
      const data = await res.json();

      if (data.ok) {
        setSaveUrl(data.url);
        const newEntry = { name: projectName.trim(), url: data.url, prompt, html, agent: selectedAgent };
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
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    const updatedHistory = history.filter((p) => p.name !== name);
    setHistory(updatedHistory);
    localStorage.setItem("ai_builder_history", JSON.stringify(updatedHistory));
    if (projectName === name) {
      setProjectName("");
      setHtml("");
      setSaveUrl("");
    }
  };

  const loadProject = (proj: ProjectHistory) => {
    setProjectName(proj.name);
    setPrompt(proj.prompt);
    setHtml(proj.html);
    setSelectedAgent(proj.agent || "base");
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "sans-serif" }}>
      {/* LEFT SIDE: Input & Control Panel (40% width) */}
      <div style={{ width: "40%", padding: "24px", borderRight: "1px solid #eee", overflowY: "auto", backgroundColor: "#ffffff" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px", color: "#1f2937" }}>AI Builder</h1>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {/* Agent Selection */}
          <div>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "8px" }}>Select Agent</label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              style={{ 
                width: "100%", 
                padding: "12px", 
                borderRadius: "8px", 
                border: "1px solid #d1d5db",
                fontSize: "14px",
                backgroundColor: "#f9fafb",
                cursor: "pointer"
              }}
            >
              {AVAILABLE_AGENTS.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} - {agent.description}
                </option>
              ))}
            </select>
          </div>

          {/* Project Name */}
          <div>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "8px" }}>Project Name</label>
            <input
              type="text"
              placeholder="e.g., zivo-landing"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px" }}
            />
          </div>

          {/* Instructions */}
          <div>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "8px" }}>Instructions</label>
            <textarea
              placeholder="Describe what to build or change..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              style={{ width: "100%", height: "150px", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", fontFamily: "inherit" }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button 
              onClick={handleGenerate} 
              disabled={loading}
              style={{ 
                flex: 1, 
                padding: "12px", 
                backgroundColor: loading ? "#9ca3af" : "#000000", 
                color: "white", 
                borderRadius: "8px", 
                cursor: loading ? "not-allowed" : "pointer",
                border: "none",
                fontWeight: "600",
                fontSize: "14px",
                transition: "background-color 0.2s"
              }}
            >
              {loading ? "Processing..." : "Generate / Update"}
            </button>
            <button 
              onClick={handleSave} 
              disabled={!html || loading}
              style={{ 
                padding: "12px", 
                backgroundColor: !html || loading ? "#9ca3af" : "#22c55e", 
                color: "white", 
                borderRadius: "8px", 
                cursor: !html || loading ? "not-allowed" : "pointer",
                border: "none",
                fontWeight: "600",
                fontSize: "14px",
                transition: "background-color 0.2s"
              }}
            >
              Save
            </button>
          </div>

          {/* Success Message */}
          {saveUrl && (
            <div style={{ padding: "12px", backgroundColor: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
              <p style={{ margin: 0, fontSize: "14px", color: "#166534" }}>
                ✓ Project saved! <a href={saveUrl} target="_blank" rel="noopener noreferrer" style={{ fontWeight: "bold", textDecoration: "underline", color: "#15803d" }}>View Live File</a>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE: Preview & History (60% width) */}
      <div style={{ width: "60%", display: "flex", flexDirection: "column", backgroundColor: "#f9fafb" }}>
        
        {/* Top Half: Live Preview */}
        <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", borderBottom: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#6b7280" }}>Live Preview</span>
            {html && (
              <button 
                onClick={() => navigator.clipboard.writeText(html)}
                style={{ fontSize: "12px", padding: "6px 12px", backgroundColor: "#ffffff", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer", color: "#374151" }}
              >
                📋 Copy HTML
              </button>
            )}
          </div>
          <div style={{ flex: 1, backgroundColor: "white", borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgb(0 0 0 / 0.1)", overflow: "hidden" }}>
            {html ? (
              <iframe srcDoc={html} style={{ width: "100%", height: "100%", border: "none" }} title="preview" />
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: "14px" }}>
                Generate a site to see preview
              </div>
            )}
          </div>
        </div>

        {/* Bottom Half: Project History */}
        <div style={{ height: "280px", padding: "20px", overflowY: "auto", borderTop: "1px solid #e5e7eb" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px", color: "#1f2937" }}>Project History</h3>
          <div style={{ display: "grid", gap: "8px" }}>
            {history.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: "14px" }}>No saved projects yet</p>
            ) : (
              history.map((proj, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", backgroundColor: "white", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "600", color: "#1f2937", fontSize: "14px" }}>{proj.name}</div>
                    <div style={{ fontSize: "12px", color: "#9ca3af" }}>{proj.agent} • {proj.prompt.substring(0, 40)}...</div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", fontSize: "12px" }}>
                    <button 
                      onClick={() => loadProject(proj)}
                      style={{ color: "#3b82f6", border: "none", background: "none", cursor: "pointer", fontWeight: "500" }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => deleteProject(proj.name)}
                      style={{ color: "#ef4444", border: "none", background: "none", cursor: "pointer", fontWeight: "500" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}