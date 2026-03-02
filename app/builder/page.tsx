"use client";

import { useState, useEffect } from "react";

interface AppTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  features: string[];
  tags: string[];
}

interface GeneratedProject {
  id: string;
  name: string;
  description: string;
  prompt: string;
  template: string;
  features: string[];
  files: Record<string, string>;
  schema: any;
  createdAt: string;
}

type Tab = "builder" | "schema" | "components" | "auth" | "projects";
type GenerateMode = "app" | "schema" | "components" | "auth" | "api";

export default function BuilderPage() {
  const [tab, setTab] = useState<Tab>("builder");
  const [prompt, setPrompt] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [templates, setTemplates] = useState<AppTemplate[]>([]);
  const [projects, setProjects] = useState<GeneratedProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState("");
  const [generateMode, setGenerateMode] = useState<GenerateMode>("app");
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [featureToAdd, setFeatureToAdd] = useState("");
  const [codeToValidate, setCodeToValidate] = useState("");

  useEffect(() => {
    fetch("/api/templates")
      .then(r => r.json())
      .then(d => setTemplates(d.templates || []))
      .catch(() => {});

    fetch("/api/projects")
      .then(r => r.json())
      .then(d => setProjects(d.projects || []))
      .catch(() => {});
  }, []);

  const FEATURE_OPTIONS = [
    "Authentication", "Admin Panel", "CRUD Dashboard", "Real-time Updates",
    "File Uploads", "Email Integration", "Stripe Payments", "Analytics",
    "Search", "Notifications", "API Keys", "Audit Logs",
  ];

  async function handleGenerate() {
    if (!prompt.trim()) {
      setError("Please enter a description for your app.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const endpoint = {
        app: "/api/generate-app",
        schema: "/api/generate-schema",
        components: "/api/generate-components",
        auth: "/api/generate-auth",
        api: "/api/generate-api",
      }[generateMode];

      const body: any = { prompt };
      if (generateMode === "app") {
        body.template = selectedTemplate || undefined;
        body.features = selectedFeatures.length ? selectedFeatures : undefined;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      setResult(data);
      if (data.projectId) {
        setActiveProjectId(data.projectId);
        const updated = await fetch("/api/projects").then(r => r.json());
        setProjects(updated.projects || []);
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    if (!activeProjectId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/export-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: activeProjectId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Download as JSON manifest
      const blob = new Blob([JSON.stringify(data.files, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeProjectId}-files.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddFeature() {
    if (!activeProjectId || !featureToAdd.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/add-feature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: activeProjectId, feature: featureToAdd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      setFeatureToAdd("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleValidateCode() {
    if (!codeToValidate.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/validate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeToValidate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleFeature(f: string) {
    setSelectedFeatures(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
    );
  }

  const files = result?.project?.files || result?.result?.files || {};
  const fileList = Object.keys(files);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white">
              Z
            </div>
            <span className="text-xl font-bold">ZIVO AI Builder</span>
            <span className="rounded-full bg-indigo-900 px-2 py-0.5 text-xs font-medium text-indigo-300">
              Full-Stack Generator
            </span>
          </div>
          <nav className="flex gap-1">
            {(["builder", "schema", "components", "auth", "projects"] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                  tab === t
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {t}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Builder Tab */}
        {tab === "builder" && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: Input Panel */}
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold">Build Your App</h1>
                <p className="mt-1 text-sm text-gray-400">
                  Describe what you want to build and ZIVO AI generates a complete React + Supabase application.
                </p>
              </div>

              {/* Generate Mode */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Generate</label>
                <div className="flex flex-wrap gap-2">
                  {(["app", "schema", "components", "auth", "api"] as GenerateMode[]).map(m => (
                    <button
                      key={m}
                      onClick={() => setGenerateMode(m)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                        generateMode === m
                          ? "bg-indigo-600 text-white"
                          : "border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200"
                      }`}
                    >
                      {m === "app" ? "Full App" : m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Description *
                </label>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder={
                    generateMode === "app"
                      ? "e.g. A SaaS project management tool where teams can create projects, assign tasks, track time, and collaborate in real-time..."
                      : generateMode === "schema"
                      ? "e.g. An e-commerce database with products, categories, orders, customers, and inventory tracking..."
                      : "Describe what you need..."
                  }
                  rows={4}
                  className="w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Template Selection (app mode only) */}
              {generateMode === "app" && templates.length > 0 && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Template (optional)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {templates.slice(0, 6).map(t => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTemplate(selectedTemplate === t.id ? "" : t.id)}
                        className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                          selectedTemplate === t.id
                            ? "border-indigo-500 bg-indigo-900/30 text-indigo-300"
                            : "border-gray-700 text-gray-400 hover:border-gray-500"
                        }`}
                      >
                        <div className="font-medium">{t.name}</div>
                        <div className="mt-0.5 text-xs text-gray-500">{t.category}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Feature Selection (app mode only) */}
              {generateMode === "app" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Features (optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {FEATURE_OPTIONS.map(f => (
                      <button
                        key={f}
                        onClick={() => toggleFeature(f)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          selectedFeatures.includes(f)
                            ? "bg-indigo-600 text-white"
                            : "border border-gray-700 text-gray-400 hover:border-gray-500"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Generating..." : `Generate ${generateMode === "app" ? "Full App" : generateMode.charAt(0).toUpperCase() + generateMode.slice(1)}`}
              </button>

              {/* Add Feature (when project exists) */}
              {activeProjectId && (
                <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-gray-300">Add Feature to Project</h3>
                  <div className="flex gap-2">
                    <input
                      value={featureToAdd}
                      onChange={e => setFeatureToAdd(e.target.value)}
                      placeholder="e.g. Stripe payments, dark mode..."
                      className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                      onClick={handleAddFeature}
                      disabled={loading || !featureToAdd.trim()}
                      className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Output Panel */}
            <div className="space-y-4">
              {result && (
                <>
                  {/* Project Summary */}
                  {result.project && (
                    <div className="rounded-lg border border-green-800 bg-green-900/20 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-green-300">
                            {result.project.projectName || "App Generated!"}
                          </h3>
                          <p className="mt-0.5 text-sm text-green-400">
                            {fileList.length} files generated
                          </p>
                        </div>
                        <button
                          onClick={handleExport}
                          className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
                        >
                          Export Files
                        </button>
                      </div>
                      {result.project.features && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {result.project.features.map((f: string) => (
                            <span
                              key={f}
                              className="rounded-full bg-green-900 px-2 py-0.5 text-xs text-green-300"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* File Explorer */}
                  {fileList.length > 0 && (
                    <div className="rounded-lg border border-gray-700 bg-gray-900">
                      <div className="border-b border-gray-700 px-4 py-3">
                        <h3 className="text-sm font-semibold">Generated Files</h3>
                      </div>
                      <div className="flex" style={{ height: "400px" }}>
                        {/* File List */}
                        <div className="w-48 overflow-y-auto border-r border-gray-700 py-2">
                          {fileList.map(f => (
                            <button
                              key={f}
                              onClick={() => setSelectedFile(f)}
                              className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${
                                selectedFile === f
                                  ? "bg-indigo-900/50 text-indigo-300"
                                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                              }`}
                            >
                              {f.split("/").pop()}
                              <div className="truncate text-gray-600">{f.includes("/") ? f.substring(0, f.lastIndexOf("/")) : ""}</div>
                            </button>
                          ))}
                        </div>
                        {/* File Content */}
                        <div className="flex-1 overflow-auto p-4">
                          {selectedFile ? (
                            <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                              <code>{files[selectedFile]}</code>
                            </pre>
                          ) : (
                            <p className="text-sm text-gray-500">Select a file to view its content</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Schema result */}
                  {result.schema && (
                    <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
                      <h3 className="mb-3 text-sm font-semibold">Database Schema</h3>
                      <pre className="overflow-auto text-xs text-gray-300">
                        {result.schema.sql || JSON.stringify(result.schema, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Raw result for non-app modes */}
                  {result.result && !result.project && (
                    <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
                      <h3 className="mb-3 text-sm font-semibold">Result</h3>
                      <pre className="overflow-auto text-xs text-gray-300 whitespace-pre-wrap">
                        {JSON.stringify(result.result, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              )}

              {!result && !loading && (
                <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-700 text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl">⚡</div>
                    <p className="mt-2 text-sm">Your generated app will appear here</p>
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex h-64 items-center justify-center rounded-lg border border-gray-700">
                  <div className="text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                    <p className="mt-3 text-sm text-gray-400">Generating your application...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Schema Tab */}
        {tab === "schema" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Database Schema Generator</h1>
              <p className="mt-1 text-sm text-gray-400">
                Generate PostgreSQL schemas with RLS policies for Supabase.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Describe your database needs, e.g.: An e-commerce app with products, categories, orders, customers, and inventory..."
                  rows={6}
                  className="w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                />
                {error && (
                  <div className="rounded-lg border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}
                <button
                  onClick={() => { setGenerateMode("schema"); handleGenerate(); }}
                  disabled={loading}
                  className="w-full rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
                >
                  {loading ? "Generating..." : "Generate Schema"}
                </button>
              </div>
              <div>
                {result?.schema && (
                  <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
                    <h3 className="mb-3 font-semibold">Generated Schema</h3>
                    <pre className="overflow-auto text-xs text-green-300 whitespace-pre-wrap">
                      {result.schema.sql || JSON.stringify(result.schema, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Components Tab */}
        {tab === "components" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">UI Component Generator</h1>
              <p className="mt-1 text-sm text-gray-400">
                Generate accessible, responsive React components with Tailwind CSS.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Describe the components you need, e.g.: A data table with sorting, filtering, and pagination for displaying user records..."
                  rows={4}
                  className="w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                />
                {error && (
                  <div className="rounded-lg border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}
                <button
                  onClick={() => { setGenerateMode("components"); handleGenerate(); }}
                  disabled={loading}
                  className="w-full rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
                >
                  {loading ? "Generating..." : "Generate Components"}
                </button>
              </div>
              <div>
                {result?.result?.components && (
                  <div className="space-y-3">
                    {result.result.components.map((c: any, i: number) => (
                      <div key={i} className="rounded-lg border border-gray-700 bg-gray-900 p-4">
                        <h3 className="font-semibold text-indigo-300">{c.name}</h3>
                        <p className="mt-1 text-sm text-gray-400">{c.description}</p>
                        <pre className="mt-3 overflow-auto text-xs text-gray-300 whitespace-pre-wrap">
                          {c.code}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Auth Tab */}
        {tab === "auth" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Authentication Generator</h1>
              <p className="mt-1 text-sm text-gray-400">
                Generate complete Supabase authentication with email, OTP, and OAuth providers.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Describe your auth requirements, e.g.: Multi-tenant SaaS with email/password, Google OAuth, role-based access (admin, member, viewer)..."
                  rows={4}
                  className="w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                />
                {error && (
                  <div className="rounded-lg border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}
                <button
                  onClick={() => { setGenerateMode("auth"); handleGenerate(); }}
                  disabled={loading}
                  className="w-full rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
                >
                  {loading ? "Generating..." : "Generate Auth System"}
                </button>
              </div>
              <div>
                {result?.result && (
                  <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
                    <h3 className="mb-3 font-semibold">Auth System Files</h3>
                    {result.result.files && (
                      <div className="space-y-2">
                        {Object.entries(result.result.files).map(([file, content]) => (
                          <div key={file}>
                            <div className="text-xs font-medium text-indigo-400">{file}</div>
                            <pre className="mt-1 overflow-auto rounded bg-gray-800 p-2 text-xs text-gray-300 whitespace-pre-wrap">
                              {String(content).substring(0, 500)}...
                            </pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Code Validator */}
            <div className="border-t border-gray-700 pt-6">
              <h2 className="mb-4 text-lg font-semibold">Code Validator</h2>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-3">
                  <textarea
                    value={codeToValidate}
                    onChange={e => setCodeToValidate(e.target.value)}
                    placeholder="Paste code to validate for security issues, errors, and best practices..."
                    rows={8}
                    className="w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm font-mono text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    onClick={handleValidateCode}
                    disabled={loading || !codeToValidate.trim()}
                    className="w-full rounded-lg bg-yellow-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-yellow-500 disabled:opacity-50"
                  >
                    {loading ? "Validating..." : "Validate Code"}
                  </button>
                </div>
                <div>
                  {result?.result?.issues && (
                    <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-semibold">Validation Results</h3>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${result.result.valid ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>
                          Score: {result.result.score}/100
                        </span>
                      </div>
                      <div className="space-y-2">
                        {result.result.issues.map((issue: any, i: number) => (
                          <div key={i} className={`rounded-lg p-3 ${issue.severity === "error" ? "bg-red-900/20 border border-red-800" : issue.severity === "warning" ? "bg-yellow-900/20 border border-yellow-800" : "bg-blue-900/20 border border-blue-800"}`}>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-medium ${issue.severity === "error" ? "text-red-400" : issue.severity === "warning" ? "text-yellow-400" : "text-blue-400"}`}>
                                {issue.severity.toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-500">{issue.category}</span>
                            </div>
                            <p className="mt-1 text-sm">{issue.message}</p>
                            {issue.suggestion && <p className="mt-1 text-xs text-gray-400">{issue.suggestion}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {tab === "projects" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">My Projects</h1>
                <p className="mt-1 text-sm text-gray-400">
                  View, export, and manage your generated applications.
                </p>
              </div>
              <button
                onClick={() => fetch("/api/projects").then(r => r.json()).then(d => setProjects(d.projects || []))}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 hover:border-gray-500 hover:text-gray-200"
              >
                Refresh
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-700 text-gray-500">
                <div className="text-center">
                  <div className="text-4xl">📁</div>
                  <p className="mt-2 text-sm">No projects yet. Generate your first app!</p>
                  <button
                    onClick={() => setTab("builder")}
                    className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                  >
                    Start Building
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map(p => (
                  <div
                    key={p.id}
                    className="rounded-lg border border-gray-700 bg-gray-900 p-5 transition-colors hover:border-gray-600"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{p.name}</h3>
                        <p className="mt-1 text-sm text-gray-400 line-clamp-2">{p.description}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-indigo-900 px-2 py-0.5 text-xs text-indigo-300">
                        {p.template}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {p.features.slice(0, 3).map(f => (
                        <span key={f} className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
                          {f}
                        </span>
                      ))}
                      {p.features.length > 3 && (
                        <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
                          +{p.features.length - 3}
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => {
                          setActiveProjectId(p.id);
                          setTab("builder");
                        }}
                        className="flex-1 rounded-lg border border-gray-700 py-2 text-xs font-medium text-gray-400 hover:border-gray-500 hover:text-gray-200"
                      >
                        Open
                      </button>
                      <button
                        onClick={() => {
                          setActiveProjectId(p.id);
                          handleExport();
                        }}
                        className="flex-1 rounded-lg bg-indigo-700 py-2 text-xs font-medium text-white hover:bg-indigo-600"
                      >
                        Export
                      </button>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
