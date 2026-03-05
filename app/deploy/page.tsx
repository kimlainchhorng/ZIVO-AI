'use client';

import { useState } from 'react';

const COLORS = {
  bg: "#0a0b14",
  bgPanel: "#0f1120",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  borderHover: "rgba(255,255,255,0.16)",
  accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#475569",
};

interface Platform {
  id: string;
  name: string;
  icon: string;
  description: string;
  envVar: string;
  color: string;
}

interface DeployState {
  status: "idle" | "loading" | "success" | "error";
  url?: string;
  error?: string;
}

const PLATFORMS: Platform[] = [
  {
    id: "vercel",
    name: "Vercel",
    icon: "▲",
    description: "Zero-config deployments for Next.js. Fastest edge network.",
    envVar: "VERCEL_TOKEN",
    color: "#000",
  },
  {
    id: "netlify",
    name: "Netlify",
    icon: "◈",
    description: "Deploy with continuous integration and serverless functions.",
    envVar: "NETLIFY_TOKEN",
    color: "#00c7b7",
  },
  {
    id: "docker",
    name: "Docker",
    icon: "🐳",
    description: "Containerize your app for any cloud or self-hosted environment.",
    envVar: "DOCKER_REGISTRY",
    color: "#0db7ed",
  },
  {
    id: "cloudflare",
    name: "Cloudflare Pages",
    icon: "☁️",
    description: "Ultra-fast global deployments on Cloudflare's edge network.",
    envVar: "CLOUDFLARE_API_TOKEN",
    color: "#f38020",
  },
];

export default function DeployPage() {
  const [deployStates, setDeployStates] = useState<Record<string, DeployState>>(
    Object.fromEntries(PLATFORMS.map((p) => [p.id, { status: "idle" }]))
  );
  const [generatingFiles, setGeneratingFiles] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<Array<{ path: string; content: string }>>([]);
  const [generateError, setGenerateError] = useState<string | null>(null);

  async function handleDeploy(platform: Platform) {
    setDeployStates((prev) => ({ ...prev, [platform.id]: { status: "loading" } }));
    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: platform.id, files: [] }),
      });
      const data = await res.json();
      if (data.error) {
        setDeployStates((prev) => ({ ...prev, [platform.id]: { status: "error", error: data.error } }));
      } else {
        setDeployStates((prev) => ({ ...prev, [platform.id]: { status: "success", url: data.url } }));
      }
    } catch {
      setDeployStates((prev) => ({
        ...prev,
        [platform.id]: { status: "error", error: "Deploy request failed" },
      }));
    }
  }

  async function handleGenerateDeployFiles() {
    setGeneratingFiles(true);
    setGenerateError(null);
    setGeneratedFiles([]);
    try {
      const res = await fetch("/api/generate-deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platforms: ["vercel", "docker", "github-actions"], appName: "my-app" }),
      });
      const data = await res.json();
      if (data.error) {
        setGenerateError(data.error);
      } else {
        setGeneratedFiles(Array.isArray(data.files) ? data.files : []);
      }
    } catch {
      setGenerateError("Failed to generate deploy files");
    }
    setGeneratingFiles(false);
  }

  function downloadFile(path: string, content: string) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = path.split("/").pop() ?? path;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .deploy-card:hover { border-color: rgba(99,102,241,0.4) !important; transform: translateY(-2px); }
        .deploy-btn:hover { opacity: 0.85 !important; }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: COLORS.bg, color: COLORS.textPrimary, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
        <div style={{ flex: 1, padding: '2rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
          <div style={{ marginBottom: '2rem', animation: 'fadeIn 0.4s ease' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>Deploy</h1>
            <p style={{ fontSize: '0.9375rem', color: COLORS.textSecondary, margin: 0 }}>
              Deploy your generated app to any platform in one click
            </p>
          </div>

          {/* Platform Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {PLATFORMS.map((platform, i) => {
              const state = deployStates[platform.id];
              return (
                <div
                  key={platform.id}
                  className="deploy-card"
                  style={{
                    background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '12px',
                    padding: '1.25rem', transition: 'all 0.2s ease', animation: `fadeIn 0.3s ease ${i * 0.05}s both`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                      {platform.icon}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: COLORS.textPrimary, margin: 0 }}>{platform.name}</h3>
                      <p style={{ fontSize: '0.7rem', color: COLORS.textMuted, margin: 0 }}>{platform.envVar}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: COLORS.textSecondary, marginBottom: '1rem', lineHeight: 1.5 }}>
                    {platform.description}
                  </p>

                  {state.status === "success" && state.url && (
                    <div style={{ marginBottom: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px' }}>
                      <a href={state.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8125rem', color: COLORS.success, wordBreak: 'break-all', textDecoration: 'none' }}>
                        ✓ {state.url}
                      </a>
                    </div>
                  )}

                  {state.status === "error" && state.error && (
                    <div style={{ marginBottom: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px' }}>
                      <p style={{ fontSize: '0.8125rem', color: COLORS.error, margin: 0 }}>{state.error}</p>
                    </div>
                  )}

                  <button
                    className="deploy-btn"
                    onClick={() => handleDeploy(platform)}
                    disabled={state.status === "loading"}
                    style={{
                      width: '100%', padding: '0.5rem 1rem', background: state.status === "success" ? 'rgba(16,185,129,0.15)' : COLORS.accentGradient,
                      border: state.status === "success" ? '1px solid rgba(16,185,129,0.3)' : 'none',
                      borderRadius: '6px', color: state.status === "success" ? COLORS.success : '#fff',
                      cursor: state.status === "loading" ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem', fontWeight: 600, transition: 'opacity 0.15s',
                      opacity: state.status === "loading" ? 0.7 : 1,
                    }}
                  >
                    {state.status === "loading" ? "Deploying…" : state.status === "success" ? "✓ Deployed" : "Deploy"}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Generate Deploy Files Section */}
          <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: '12px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: COLORS.textPrimary, margin: '0 0 0.25rem' }}>Generate Deploy Config Files</h2>
                <p style={{ fontSize: '0.8125rem', color: COLORS.textSecondary, margin: 0 }}>
                  Auto-generate <code style={{ color: COLORS.accent }}>vercel.json</code>, <code style={{ color: COLORS.accent }}>Dockerfile</code>, <code style={{ color: COLORS.accent }}>.env.example</code> and more
                </p>
              </div>
              <button
                className="deploy-btn"
                onClick={handleGenerateDeployFiles}
                disabled={generatingFiles}
                style={{
                  padding: '0.5rem 1.25rem', background: COLORS.accentGradient, border: 'none', borderRadius: '6px',
                  color: '#fff', cursor: generatingFiles ? 'not-allowed' : 'pointer', fontSize: '0.875rem',
                  fontWeight: 600, opacity: generatingFiles ? 0.7 : 1, flexShrink: 0, transition: 'opacity 0.15s',
                }}
              >
                {generatingFiles ? "Generating…" : "Generate Files"}
              </button>
            </div>

            {generateError && (
              <p style={{ fontSize: '0.8125rem', color: COLORS.error, margin: '0 0 0.75rem' }}>{generateError}</p>
            )}

            {generatedFiles.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {generatedFiles.map((file) => (
                  <div key={file.path} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.03)', border: `1px solid ${COLORS.border}`, borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.8125rem', color: COLORS.textPrimary, fontFamily: 'monospace' }}>{file.path}</span>
                    <button
                      onClick={() => downloadFile(file.path, file.content)}
                      style={{ padding: '0.25rem 0.75rem', background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: '4px', color: COLORS.textSecondary, cursor: 'pointer', fontSize: '0.75rem', transition: 'opacity 0.15s' }}
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
