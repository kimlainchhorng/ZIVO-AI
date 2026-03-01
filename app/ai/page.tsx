"use client";

import { useEffect, useMemo, useState } from "react";

type VersionItem = {
  name: string;
  path: string;
  mtime: number;
  size: number;
};

export default function AiPage() {
  const [prompt, setPrompt] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [siteHtml, setSiteHtml] = useState("");
  const [loadingSite, setLoadingSite] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedUrl, setSavedUrl] = useState("");
  const [saveError, setSaveError] = useState("");

  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [versionError, setVersionError] = useState("");

  // Diff viewer state (select 2 versions)
  const [selected, setSelected] = useState<string[]>([]);
  const [diffResult, setDiffResult] = useState<any[]>([]);
  const [diffError, setDiffError] = useState("");
  const [diffLoading, setDiffLoading] = useState(false);

  const previewHtml = useMemo(() => {
    const s = siteHtml || "";
    return s
      .replace(/^```html\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();
  }, [siteHtml]);

  function logout() {
    document.cookie = "ai_pw=; Path=/; Max-Age=0; SameSite=Lax";
    window.location.href = "/ai-login";
  }

  async function generateSite() {
    if (!prompt.trim()) return;

    setLoadingSite(true);
    setSaveError("");
    setSavedUrl("");

    try {
      const res = await fetch("/api/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) setSiteHtml(data?.error || "Generation failed");
      else setSiteHtml(data?.result || "");
    } catch (e: any) {
      setSiteHtml(e?.message || "Network error");
    } finally {
      setLoadingSite(false);
    }
  }

  async function editSite() {
    if (!previewHtml || !editPrompt.trim()) return;

    setLoadingEdit(true);

    try {
      const res = await fetch("/api/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: editPrompt, currentHtml: previewHtml }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) setSiteHtml(data?.error || "Edit failed");
      else {
        setSiteHtml(data?.result || "");
        setEditPrompt("");
      }
    } catch (e: any) {
      setSiteHtml(e?.message || "Network error");
    } finally {
      setLoadingEdit(false);
    }
  }

  async function saveSite() {
    if (!previewHtml) return;

    setSaving(true);
    setSaveError("");
    setSavedUrl("");

    try {
      const res = await fetch("/api/save-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: previewHtml }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setSaveError(data?.error || "Save failed");
        return;
      }

      setSavedUrl(data?.path || "/generated.html");
      await loadVersions();
    } catch (e: any) {
      setSaveError(e?.message || "Network error");
    } finally {
      setSaving(false);
    }
  }

  async function restoreVersion(versionPath: string) {
    try {
      const res = await fetch("/api/restore-version", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: versionPath }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        alert(data?.error || "Restore failed");
        return;
      }

      await loadGeneratedHtml();
      await loadVersions();
    } catch (e: any) {
      alert(e?.message || "Network error");
    }
  }

  async function deleteVersion(versionPath: string) {
    if (!confirm("Delete this version?")) return;

    try {
      const res = await fetch("/api/delete-version", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: versionPath }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        alert(data?.error || "Delete failed");
        return;
      }

      await loadVersions();
      // if deleted one was selected, remove it
      setSelected((prev) => prev.filter((p) => p !== versionPath));
    } catch (e: any) {
      alert(e?.message || "Network error");
    }
  }

  async function publishVersion(versionPath: string) {
    if (!confirm("Publish this version live as the homepage?")) return;

    try {
      const res = await fetch("/api/publish-version", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: versionPath }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        alert(data?.error || "Publish failed");
        return;
      }

      window.open(data?.path || "/index.html", "_blank");
    } catch (e: any) {
      alert(e?.message || "Network error");
    }
  }

  function toggleSelect(p: string) {
    setDiffError("");
    setDiffResult([]);

    setSelected((prev) => {
      if (prev.includes(p)) return prev.filter((x) => x !== p);
      if (prev.length >= 2) return [prev[1], p]; // keep max 2
      return [...prev, p];
    });
  }

  async function compareSelected() {
    if (selected.length !== 2) return;

    setDiffLoading(true);
    setDiffError("");
    setDiffResult([]);

    try {
      const res = await fetch("/api/compare-versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ a: selected[0], b: selected[1] }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setDiffError(data?.error || "Compare failed");
        return;
      }

      setDiffResult(data?.diff || []);
    } catch (e: any) {
      setDiffError(e?.message || "Network error");
    } finally {
      setDiffLoading(false);
    }
  }

  async function loadVersions() {
  try {
    const res = await fetch("/api/backup-list");
    const data = await res.json();
    if (res.ok) {
      setVersions(data.versions || []);
    }
  } catch {}
}
    setVersionError("");
    try {
      // you can use either endpoint; keep your existing one if you want:
      // const res = await fetch("/api/site-versions");
      const res = await fetch("/api/backup-list");
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setVersionError(data?.error || "Failed to load versions");
        return;
      }

      setVersions(data?.versions || []);
    } catch (e: any) {
      setVersionError(e?.message || "Network error");
    }
  }

  async function loadGeneratedHtml() {
    try {
      const res = await fetch("/generated.html", { cache: "no-store" });
      if (!res.ok) return;
      const t = await res.text();
      if (t.trim().length > 0) setSiteHtml(t);
    } catch {}
  }

  useEffect(() => {
    loadVersions();
    loadGeneratedHtml();
  }, []);

  return (
    <div style={{ maxWidth: 980, margin: "40px auto", padding: 20 }}>
      <h1 style={{ fontSize: 42, fontWeight: 900 }}>Zivo Private AI Builder</h1>

      <button
        onClick={logout}
        style={{
          marginTop: 10,
          padding: "8px 14px",
          borderRadius: 10,
          border: "1px solid #ddd",
          background: "white",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Logout
      </button>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Tell AI what to build..."
        style={{
          width: "100%",
          minHeight: 140,
          padding: 16,
          marginTop: 20,
          borderRadius: 12,
          border: "1px solid #ddd",
        }}
      />

      <button
        onClick={generateSite}
        disabled={loadingSite}
        style={{
          marginTop: 12,
          padding: 14,
          borderRadius: 12,
          border: "none",
          background: "#111",
          color: "white",
          fontWeight: 800,
          width: "100%",
          cursor: "pointer",
        }}
      >
        {loadingSite ? "Generating..." : "Generate Site"}
      </button>

      {siteHtml && (
        <>
          <h3 style={{ marginTop: 30 }}>Modify Current Page</h3>

          <textarea
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            placeholder="Example: add pricing section"
            style={{
              width: "100%",
              minHeight: 100,
              padding: 14,
              marginTop: 10,
              borderRadius: 12,
              border: "1px solid #ddd",
            }}
          />

          <button
            onClick={editSite}
            disabled={loadingEdit}
            style={{
              marginTop: 10,
              padding: 12,
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {loadingEdit ? "Editing..." : "Edit Current Site"}
          </button>

          <div style={{ marginTop: 20 }}>
            <button
              onClick={saveSite}
              disabled={saving}
              style={{
                padding: 12,
                borderRadius: 10,
                border: "1px solid #ddd",
                background: saving ? "#eee" : "white",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {saving ? "Saving..." : "Save to /public/generated.html"}
            </button>

            {savedUrl && (
              <a
                href={savedUrl}
                target="_blank"
                rel="noreferrer"
                style={{ marginLeft: 10, fontWeight: 700 }}
              >
                Open
              </a>
            )}
          </div>

          {saveError && (
            <div style={{ color: "#b00020", marginTop: 8 }}>{saveError}</div>
          )}

          <pre
            style={{
              marginTop: 20,
              padding: 16,
              background: "#f5f5f5",
              borderRadius: 12,
              whiteSpace: "pre-wrap",
            }}
          >
            {siteHtml}
          </pre>

          <h3 style={{ marginTop: 20 }}>Preview</h3>
          <iframe
            title="preview"
            style={{
              width: "100%",
              height: 650,
              border: "1px solid #ddd",
              borderRadius: 12,
              marginTop: 10,
            }}
            srcDoc={previewHtml}
          />

          <div style={{ marginTop: 30 }}>
            <h3>Saved Versions</h3>

            {versionError && (
              <div style={{ color: "#b00020" }}>{versionError}</div>
            )}

            {versions.length === 0 ? (
              <div>No versions yet.</div>
            ) : (
              <>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
                  Tip: click the checkbox to select 2 versions, then Compare.
                </div>

                {versions.map((v) => (
                  <div
                    key={v.path}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: 10,
                      border: "1px solid #eee",
                      borderRadius: 10,
                      marginTop: 8,
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={selected.includes(v.path)}
                        onChange={() => toggleSelect(v.path)}
                      />

                      <div>
                        <div style={{ fontWeight: 700 }}>
  {v.name}
  {v.path === "/generated.html" && (
    <span
      style={{
        marginLeft: 8,
        padding: "2px 6px",
        background: "#0f0",
        borderRadius: 6,
        fontSize: 10,
        fontWeight: 800,
      }}
    >
      LIVE
    </span>
  )}
</div>

                        <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
                          Saved: {new Date(v.mtime).toLocaleString()}
                        </div>

                        <div style={{ fontSize: 12, opacity: 0.6 }}>
                          Size: {(v.size / 1024).toFixed(2)} KB
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <a href={v.path} target="_blank" rel="noreferrer">
                        Open
                      </a>

                      <button onClick={() => restoreVersion(v.path)}>
                        Restore
                      </button>

                      <button onClick={() => publishVersion(v.path)}>
                        Publish
                      </button>

                      <button
                        onClick={() => deleteVersion(v.path)}
                        style={{ color: "#b00020" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: 14 }}>
                  <button
                    onClick={compareSelected}
                    disabled={selected.length !== 2 || diffLoading}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid #ddd",
                      background: selected.length === 2 ? "white" : "#eee",
                      fontWeight: 700,
                      cursor: selected.length === 2 ? "pointer" : "not-allowed",
                    }}
                  >
                    {diffLoading ? "Comparing..." : "Compare Selected (2)"}
                  </button>

                  {diffError && (
                    <div style={{ color: "#b00020", marginTop: 8 }}>{diffError}</div>
                  )}

                  {diffResult.length > 0 && (
                    <pre
                      style={{
                        marginTop: 10,
                        padding: 14,
                        background: "#f7f7f7",
                        borderRadius: 12,
                        whiteSpace: "pre-wrap",
                        border: "1px solid #eee",
                      }}
                    >
                      {diffResult
                        .map((d: any) => {
                          // Accept many shapes: {type,text} or strings
                          const type = d?.type || "";
                          const text = d?.text ?? d?.line ?? String(d);
                          const prefix =
                            type === "add" ? "+ " : type === "del" ? "- " : "  ";
                          return prefix + text;
                        })
                        .join("\n")}
                    </pre>
                  )}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}