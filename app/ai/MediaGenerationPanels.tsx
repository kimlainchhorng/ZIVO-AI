import { COLORS } from "./colors";

interface MediaGenerationPanelsProps {
  mode: string;
  // Image props
  imagePrompt: string;
  setImagePrompt: (value: string) => void;
  imageSize: string;
  setImageSize: (value: string) => void;
  imageError: string;
  imageLoading: boolean;
  handleImageGenerate: () => void;
  // Video props
  videoPrompt: string;
  setVideoPrompt: (value: string) => void;
  videoStyle: string;
  setVideoStyle: (value: string) => void;
  videoFrameCount: number;
  setVideoFrameCount: (value: number) => void;
  videoError: string;
  videoLoading: boolean;
  handleVideoGenerate: () => void;
  videoFrames: string[];
  handleVideoDownloadZip: () => void;
  videoZipError: string;
  // 3D props
  threeDPrompt: string;
  setThreeDPrompt: (value: string) => void;
  threeDSceneType: "object" | "scene" | "character";
  setThreeDSceneType: (value: "object" | "scene" | "character") => void;
  threeDError: string;
  threeDLoading: boolean;
  handle3DGenerate: () => void;
  threeDResult: string | null;
  threeDShowSource: boolean;
  setThreeDShowSource: (value: boolean | ((prev: boolean) => boolean)) => void;
}

export default function MediaGenerationPanels({
  mode,
  imagePrompt,
  setImagePrompt,
  imageSize,
  setImageSize,
  imageError,
  imageLoading,
  handleImageGenerate,
  videoPrompt,
  setVideoPrompt,
  videoStyle,
  setVideoStyle,
  videoFrameCount,
  setVideoFrameCount,
  videoError,
  videoLoading,
  handleVideoGenerate,
  videoFrames,
  handleVideoDownloadZip,
  videoZipError,
  threeDPrompt,
  setThreeDPrompt,
  threeDSceneType,
  setThreeDSceneType,
  threeDError,
  threeDLoading,
  handle3DGenerate,
  threeDResult,
  threeDShowSource,
  setThreeDShowSource,
}: MediaGenerationPanelsProps) {
  if (mode === "image") {
    return (
      <div style={{ animation: "fadeIn 0.3s ease" }}>
        <div style={{ marginBottom: "1.25rem" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.25rem", letterSpacing: "-0.02em" }}>Generate Images with AI</h1>
          <p style={{ fontSize: "0.8125rem", color: COLORS.textSecondary, margin: 0 }}>Create stunning images from a text description</p>
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ fontSize: "0.75rem", color: COLORS.textSecondary, display: "block", marginBottom: "0.35rem" }}>Prompt</label>
          <textarea
            className="zivo-textarea"
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleImageGenerate(); } }}
            placeholder="A futuristic city at night with neon lights..."
            style={{ width: "100%", minHeight: "100px", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "0.75rem", resize: "vertical", color: COLORS.textPrimary, fontSize: "0.875rem", lineHeight: 1.6, transition: "border-color 0.2s" }}
          />
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ fontSize: "0.75rem", color: COLORS.textSecondary, display: "block", marginBottom: "0.35rem" }}>Size</label>
          <select className="zivo-select" value={imageSize} onChange={(e) => setImageSize(e.target.value)} style={{ width: "100%", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textPrimary, padding: "0.45rem 0.65rem", fontSize: "0.8125rem", cursor: "pointer" }}>
            <option value="1024x1024" style={{ background: COLORS.bgPanel }}>1024 × 1024</option>
            <option value="1792x1024" style={{ background: COLORS.bgPanel }}>1792 × 1024</option>
            <option value="1024x1792" style={{ background: COLORS.bgPanel }}>1024 × 1792</option>
          </select>
        </div>
        {imageError && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: COLORS.error, padding: "0.75rem", borderRadius: "8px", marginBottom: "0.75rem", fontSize: "0.875rem" }}>
            {imageError}
          </div>
        )}
        <button
          className="zivo-btn"
          onClick={handleImageGenerate}
          disabled={imageLoading || !imagePrompt.trim()}
          style={{ width: "100%", padding: "0.7rem", background: imageLoading || !imagePrompt.trim() ? "rgba(99,102,241,0.3)" : COLORS.accentGradient, color: "#fff", borderRadius: "10px", border: "none", cursor: imageLoading || !imagePrompt.trim() ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "0.9375rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
        >
          {imageLoading ? (
            <><span style={{ display: "inline-block", width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Generating…</>
          ) : (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg> Generate Image</>
          )}
        </button>
      </div>
    );
  }

  if (mode === "video") {
    return (
      <div style={{ animation: "fadeIn 0.3s ease" }}>
        <div style={{ marginBottom: "1.25rem" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.25rem", letterSpacing: "-0.02em" }}>Generate Video Frames with AI</h1>
          <p style={{ fontSize: "0.8125rem", color: COLORS.textSecondary, margin: 0 }}>Create sequential keyframes that bring your idea to life</p>
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ fontSize: "0.75rem", color: COLORS.textSecondary, display: "block", marginBottom: "0.35rem" }}>Prompt</label>
          <textarea
            className="zivo-textarea"
            value={videoPrompt}
            onChange={(e) => setVideoPrompt(e.target.value)}
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleVideoGenerate(); } }}
            placeholder="A rocket launching into space..."
            style={{ width: "100%", minHeight: "100px", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "0.75rem", resize: "vertical", color: COLORS.textPrimary, fontSize: "0.875rem", lineHeight: 1.6, transition: "border-color 0.2s" }}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1rem" }}>
          <div>
            <label style={{ fontSize: "0.75rem", color: COLORS.textSecondary, display: "block", marginBottom: "0.35rem" }}>Style</label>
            <select className="zivo-select" value={videoStyle} onChange={(e) => setVideoStyle(e.target.value)} style={{ width: "100%", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textPrimary, padding: "0.45rem 0.65rem", fontSize: "0.8125rem", cursor: "pointer" }}>
              {["cinematic", "anime", "realistic", "cartoon"].map((s) => (
                <option key={s} value={s} style={{ background: COLORS.bgPanel }}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "0.75rem", color: COLORS.textSecondary, display: "block", marginBottom: "0.35rem" }}>Frames</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {[4, 6].map((n) => (
                <button key={n} className="zivo-btn" onClick={() => setVideoFrameCount(n)} style={{ flex: 1, padding: "0.4rem", borderRadius: "8px", border: `1px solid ${videoFrameCount === n ? "rgba(99,102,241,0.5)" : COLORS.border}`, background: videoFrameCount === n ? "rgba(99,102,241,0.15)" : "transparent", color: videoFrameCount === n ? COLORS.accent : COLORS.textSecondary, cursor: "pointer", fontSize: "0.8125rem", fontWeight: videoFrameCount === n ? 600 : 400 }}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
        {videoError && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: COLORS.error, padding: "0.75rem", borderRadius: "8px", marginBottom: "0.75rem", fontSize: "0.875rem" }}>
            {videoError}
          </div>
        )}
        <button
          className="zivo-btn"
          onClick={handleVideoGenerate}
          disabled={videoLoading || !videoPrompt.trim()}
          style={{ width: "100%", padding: "0.7rem", background: videoLoading || !videoPrompt.trim() ? "rgba(99,102,241,0.3)" : COLORS.accentGradient, color: "#fff", borderRadius: "10px", border: "none", cursor: videoLoading || !videoPrompt.trim() ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "0.9375rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
        >
          {videoLoading ? (
            <><span style={{ display: "inline-block", width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Generating {videoFrameCount} frames…</>
          ) : (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect width="15" height="14" x="1" y="5" rx="2"/></svg> Generate Video Frames</>
          )}
        </button>
        {videoFrames.length > 0 && (
          <>
          <button
            className="zivo-btn"
            onClick={handleVideoDownloadZip}
            style={{ width: "100%", marginTop: "0.5rem", padding: "0.55rem", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textSecondary, cursor: "pointer", fontSize: "0.8125rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Download Frames as ZIP
          </button>
          {videoZipError && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: COLORS.error, padding: "0.65rem 0.75rem", borderRadius: "8px", marginTop: "0.5rem", fontSize: "0.8125rem" }}>
              {videoZipError}
            </div>
          )}
          </>
        )}
      </div>
    );
  }

  if (mode === "3d") {
    return (
      <div style={{ animation: "fadeIn 0.3s ease" }}>
        <div style={{ marginBottom: "1.25rem" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.25rem", letterSpacing: "-0.02em" }}>Generate 3D Scenes with AI</h1>
          <p style={{ fontSize: "0.8125rem", color: COLORS.textSecondary, margin: 0 }}>Describe a scene — ZIVO builds interactive Three.js code</p>
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ fontSize: "0.75rem", color: COLORS.textSecondary, display: "block", marginBottom: "0.35rem" }}>Prompt</label>
          <textarea
            className="zivo-textarea"
            value={threeDPrompt}
            onChange={(e) => setThreeDPrompt(e.target.value)}
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handle3DGenerate(); } }}
            placeholder="A spinning planet Earth with continents..."
            style={{ width: "100%", minHeight: "100px", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "0.75rem", resize: "vertical", color: COLORS.textPrimary, fontSize: "0.875rem", lineHeight: 1.6, transition: "border-color 0.2s" }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontSize: "0.75rem", color: COLORS.textSecondary, display: "block", marginBottom: "0.35rem" }}>Scene Type</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {(["object", "scene", "character"] as const).map((t) => (
              <button key={t} className="zivo-btn" onClick={() => setThreeDSceneType(t)} style={{ flex: 1, padding: "0.4rem", borderRadius: "8px", border: `1px solid ${threeDSceneType === t ? "rgba(99,102,241,0.5)" : COLORS.border}`, background: threeDSceneType === t ? "rgba(99,102,241,0.15)" : "transparent", color: threeDSceneType === t ? COLORS.accent : COLORS.textSecondary, cursor: "pointer", fontSize: "0.8125rem", fontWeight: threeDSceneType === t ? 600 : 400, textTransform: "capitalize" }}>
                {t}
              </button>
            ))}
          </div>
        </div>
        {threeDError && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: COLORS.error, padding: "0.75rem", borderRadius: "8px", marginBottom: "0.75rem", fontSize: "0.875rem" }}>
            {threeDError}
          </div>
        )}
        <button
          className="zivo-btn"
          onClick={handle3DGenerate}
          disabled={threeDLoading || !threeDPrompt.trim()}
          style={{ width: "100%", padding: "0.7rem", background: threeDLoading || !threeDPrompt.trim() ? "rgba(99,102,241,0.3)" : COLORS.accentGradient, color: "#fff", borderRadius: "10px", border: "none", cursor: threeDLoading || !threeDPrompt.trim() ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "0.9375rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
        >
          {threeDLoading ? (
            <><span style={{ display: "inline-block", width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Generating 3D Scene…</>
          ) : (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> Generate 3D Scene</>
          )}
        </button>
        {threeDResult && (
          <button
            className="zivo-btn"
            onClick={() => setThreeDShowSource((s) => !s)}
            style={{ width: "100%", marginTop: "0.5rem", padding: "0.55rem", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textSecondary, cursor: "pointer", fontSize: "0.8125rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            {threeDShowSource ? "Hide Source" : "View Source"}
          </button>
        )}
      </div>
    );
  }

  return null;
}
