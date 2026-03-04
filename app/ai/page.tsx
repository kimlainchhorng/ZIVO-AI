'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { Suspense } from "react";
import { addHistoryEntry } from "../history/page";

interface GeneratedFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

interface GenerateSiteResponse {
  files?: GeneratedFile[];
  preview_html?: string;
  summary?: string;
  notes?: string;
  error?: string;
}

interface DeployResult {
  url: string;
  deploymentId: string;
}

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

const RocketIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline-block",flexShrink:0 }}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>;
const ClipboardIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline-block",flexShrink:0 }}><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>;
const CartIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline-block",flexShrink:0 }}><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>;
const LockIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline-block",flexShrink:0 }}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const BarChartIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline-block",flexShrink:0 }}><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>;
const DesktopIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>;
const TabletIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><line x1="12" x2="12.01" y1="18" y2="18"/></svg>;
const MobileIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><line x1="12" x2="12.01" y1="18" y2="18"/></svg>;
const InstantPreviewIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const AiPoweredIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 8v4l3 3"/><circle cx="18" cy="6" r="3"/></svg>;
const EditableIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>;

const QUICK_PROMPTS = [
  { icon: <RocketIcon />, label: "Landing Page", prompt: "Build a modern SaaS landing page with hero, features, pricing, and CTA sections" },
  { icon: <ClipboardIcon />, label: "Todo App", prompt: "Build a todo app with categories, due dates, and local storage persistence" },
  { icon: <CartIcon />, label: "E-commerce", prompt: "Build an e-commerce product listing page with cart and checkout flow" },
  { icon: <LockIcon />, label: "Auth Flow", prompt: "Build a complete authentication flow with login, signup, and password reset pages" },
  { icon: <BarChartIcon />, label: "Dashboard", prompt: "Build an analytics dashboard with charts, stats cards, and data tables" },
];

const MODELS = [
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4.1-mini", label: "GPT-4.1-mini" },
  { value: "gpt-4o-mini", label: "GPT-4o-mini" },
];

const LOADING_STEP1_DELAY = 800;
const LOADING_STEP2_DELAY = 2000;
// Debounce delay for AI prompt suggestions (ms)
const SUGGEST_DEBOUNCE_MS = 800;
// Max characters of existing code sent to the enhance endpoint
const MAX_ENHANCE_CONTEXT_LENGTH = 3000;
// Mobile phone frame dimensions for preview
const MOBILE_FRAME_WIDTH = 375;
const MOBILE_FRAME_HEIGHT = 812;

function getSpeechRecognitionAPI(): typeof SpeechRecognition | null {
  if (typeof window === "undefined") return null;
  return (
    (window as Window & { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
    (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition ||
    null
  );
}

function getFileIcon(path: string): React.ReactElement {
  const ext = path.split(".").pop()?.toLowerCase();
  const s: React.CSSProperties = { display:"inline-block", flexShrink: 0 };
  if (ext === "css")
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1 1.02 2.34 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/></svg>;
  if (ext === "json")
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
  if (ext === "md")
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/></svg>;
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>;
}

function getActionStyle(action: string): React.CSSProperties {
  if (action === "create") return { background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" };
  if (action === "delete") return { background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" };
  return { background: "rgba(99,102,241,0.15)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.3)" };
}

function AIPageInner() {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState<GenerateSiteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [visualEdit, setVisualEdit] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<DeployResult | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [popover, setPopover] = useState<{ x: number; y: number; text: string } | null>(null);
  const [popoverInput, setPopoverInput] = useState("");
  const [activeFile, setActiveFile] = useState<GeneratedFile | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "console">("preview");
  const [deviceMode, setDeviceMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [model, setModel] = useState("gpt-4o");
  const [isRecording, setIsRecording] = useState(false);
  const [buildTime, setBuildTime] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [copyLabel, setCopyLabel] = useState<"save"|"saved">("save");
  const [copyFileLabel, setCopyFileLabel] = useState<"copy"|"copied">("copy");
  const [loadingStep, setLoadingStep] = useState(0);
  const [consoleLogs, setConsoleLogs] = useState<Array<{ text: string; type: "info" | "success" | "error" }>>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Chat panel state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Prompt suggestions state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const suggestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Enhance loading state
  const [enhancing, setEnhancing] = useState(false);

  // GitHub push state
  const [githubPushing, setGithubPushing] = useState(false);
  const [githubPushResult, setGithubPushResult] = useState<string | null>(null);
  const [githubPushError, setGithubPushError] = useState<string | null>(null);

  // Mode switcher
  const [mode, setMode] = useState<"code" | "website" | "mobile" | "image" | "video" | "3d">("code");

  // Website generation state
  const [websitePrompt, setWebsitePrompt] = useState("");
  const [websiteStyle, setWebsiteStyle] = useState("modern");
  const [websiteResult, setWebsiteResult] = useState<{ files: GeneratedFile[]; preview_html: string; summary: string } | null>(null);
  const [websiteLoading, setWebsiteLoading] = useState(false);
  const [websiteError, setWebsiteError] = useState<string | null>(null);

  // Mobile app generation state
  const [mobilePrompt, setMobilePrompt] = useState("");
  const [mobileFramework, setMobileFramework] = useState("react-native");
  const [mobileResult, setMobileResult] = useState<{ files: GeneratedFile[]; preview_html: string; summary: string } | null>(null);
  const [mobileLoading, setMobileLoading] = useState(false);
  const [mobileError, setMobileError] = useState<string | null>(null);

  // Image generation state
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageSize, setImageSize] = useState("1024x1024");

  const [imageResult, setImageResult] = useState<{ dataUrl: string; size: string; prompt: string } | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Video generation state
  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoStyle, setVideoStyle] = useState("cinematic");
  const [videoFrameCount, setVideoFrameCount] = useState(4);
  const [videoFrames, setVideoFrames] = useState<string[]>([]);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoZipError, setVideoZipError] = useState<string | null>(null);

  // 3D generation state
  const [threeDPrompt, setThreeDPrompt] = useState("");
  const [threeDSceneType, setThreeDSceneType] = useState("object");
  const [threeDResult, setThreeDResult] = useState<{ html: string; summary: string } | null>(null);
  const [threeDLoading, setThreeDLoading] = useState(false);
  const [threeDError, setThreeDError] = useState<string | null>(null);
  const [threeDShowSource, setThreeDShowSource] = useState(false);

  // Read ?prompt= from URL
  const searchParams = useSearchParams();
  const pathname = usePathname();
  useEffect(() => {
    const urlPrompt = searchParams.get("prompt");
    if (urlPrompt) setPrompt(urlPrompt);
  }, [searchParams]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Prompt suggestions debounce
  useEffect(() => {
    if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current);
    if (!prompt.trim() || prompt.length < 10) { setSuggestions([]); return; }
    suggestTimerRef.current = setTimeout(async () => {
      setSuggestLoading(true);
      try {
        const res = await fetch("/api/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ partial: prompt }),
        });
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
      } catch { setSuggestions([]); }
      setSuggestLoading(false);
    }, SUGGEST_DEBOUNCE_MS);
    return () => { if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current); };
  }, [prompt]);

  const iframeWidth = deviceMode === "mobile" ? "390px" : deviceMode === "tablet" ? "768px" : "100%";

  async function handleBuild() {
    if (!prompt.trim()) return;
    setLoading(true);
    setLoadingStep(0);
    setOutput(null);
    setDeployResult(null);
    setDeployError(null);
    setDownloadError(null);
    setActiveFile(null);
    setConsoleLogs([{ text: "> Building project...", type: "info" }]);

    const buildStart = Date.now();
    const stepTimer1 = setTimeout(() => setLoadingStep(1), LOADING_STEP1_DELAY);
    const stepTimer2 = setTimeout(() => setLoadingStep(2), LOADING_STEP2_DELAY);

    try {
      const res = await fetch("/api/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model }),
      });
      const data: GenerateSiteResponse = await res.json();
      setOutput(data);
      if (data.files?.length) setActiveFile(data.files[0]);
      const duration = Date.now() - buildStart;
      setBuildTime(`${(duration / 1000).toFixed(1)}s`);
      // Save to build history
      addHistoryEntry({
        createdAt: Date.now(),
        prompt,
        model,
        files: (data.files ?? []).map((f) => ({ path: f.path, action: f.action })),
        buildTimeMs: duration,
      });
      const fileLogs = data.files?.map((f) => ({ text: `> Created: ${f.path}`, type: "success" as const })) ?? [];
      setConsoleLogs((prev) => [
        ...prev,
        ...fileLogs,
        { text: `> Build complete in ${duration}ms ✓`, type: "success" },
      ]);
    } catch {
      setOutput({ error: "Request failed" });
      setConsoleLogs((prev) => [...prev, { text: "> Error: Request failed", type: "error" }]);
    }

    clearTimeout(stepTimer1);
    clearTimeout(stepTimer2);
    setLoading(false);
    setLoadingStep(0);
  }

  const applyVisualEditOverlay = useCallback((active: boolean) => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument;
      if (!doc) return;
      const existing = doc.getElementById("__zivo_overlay__");
      if (active && !existing) {
        const overlay = doc.createElement("div");
        overlay.id = "__zivo_overlay__";
        overlay.style.cssText = "position:fixed;inset:0;z-index:9999;cursor:crosshair;";
        overlay.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const target = e.target as HTMLElement;
          const text = target.textContent?.trim() ?? "";
          setPopover({ x: e.clientX, y: e.clientY, text });
          setPopoverInput(text);
        });
        doc.body.appendChild(overlay);
      } else if (!active && existing) {
        existing.remove();
        setPopover(null);
      }
    } catch {
      // cross-origin iframe; overlay unavailable
    }
  }, []);

  useEffect(() => {
    applyVisualEditOverlay(visualEdit);
  }, [visualEdit, output, applyVisualEditOverlay]);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [consoleLogs]);

  async function handleDeploy(platform: "vercel" | "netlify") {
    if (!output?.files?.length) return;
    setDeploying(true);
    setDeployError(null);
    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, files: output.files }),
      });
      const data = await res.json();
      if (data.error) {
        setDeployError(data.error);
      } else {
        setDeployResult(data as DeployResult);
      }
    } catch {
      setDeployError("Deploy request failed");
    }
    setDeploying(false);
  }

  async function handleDownload() {
    if (!output?.files?.length) return;
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: output.files }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "zivo-app.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setDownloadError("Download failed. Please try again.");
    }
  }

  async function handleGithubPush() {
    if (!output?.files?.length) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("zivo_github_token") : null;
    const repo = typeof window !== "undefined" ? localStorage.getItem("zivo_github_repo") : null;
    if (!token || !repo) {
      setGithubPushError("Connect GitHub first — visit the Connectors page to add your token.");
      return;
    }
    setGithubPushing(true);
    setGithubPushResult(null);
    setGithubPushError(null);
    try {
      const res = await fetch("/api/github-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, repo, files: output.files }),
      });
      const data = await res.json();
      if (data.error) {
        setGithubPushError(data.error);
      } else {
        setGithubPushResult(data.commitUrl);
      }
    } catch {
      setGithubPushError("GitHub push failed. Please try again.");
    }
    setGithubPushing(false);
  }

  async function handleImageGenerate() {
    if (!imagePrompt.trim()) return;
    setImageLoading(true);
    setImageError(null);
    setImageResult(null);
    try {
      const res = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: imagePrompt, size: imageSize }),
      });
      const data = await res.json();
      if (data.error) { setImageError(data.error); }
      else { setImageResult({ dataUrl: data.dataUrl, size: data.size, prompt: data.prompt }); }
    } catch { setImageError("Image generation failed. Please try again."); }
    setImageLoading(false);
  }

  async function handleWebsiteGenerate() {
    if (!websitePrompt.trim()) return;
    setWebsiteLoading(true);
    setWebsiteError(null);
    setWebsiteResult(null);
    try {
      const res = await fetch("/api/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `Build a complete multi-page website: ${websitePrompt}. Style: ${websiteStyle}. Include a homepage, about page, and contact page with modern design.`, model }),
      });
      const data = await res.json();
      if (data.error) { setWebsiteError(data.error); }
      else { setWebsiteResult({ files: data.files ?? [], preview_html: data.preview_html ?? "", summary: data.summary ?? "" }); }
    } catch { setWebsiteError("Website generation failed. Please try again."); }
    setWebsiteLoading(false);
  }

  async function handleMobileGenerate() {
    if (!mobilePrompt.trim()) return;
    setMobileLoading(true);
    setMobileError(null);
    setMobileResult(null);
    try {
      const res = await fetch("/api/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `Build a ${mobileFramework} mobile app: ${mobilePrompt}. Generate the main screens with navigation, styled components, and mobile-first UI patterns. Output as a single self-contained HTML preview that simulates a mobile app interface with a phone frame.`, model }),
      });
      const data = await res.json();
      if (data.error) { setMobileError(data.error); }
      else { setMobileResult({ files: data.files ?? [], preview_html: data.preview_html ?? "", summary: data.summary ?? "" }); }
    } catch { setMobileError("Mobile app generation failed. Please try again."); }
    setMobileLoading(false);
  }

  async function handleVideoGenerate() {
    if (!videoPrompt.trim()) return;
    setVideoLoading(true);
    setVideoError(null);
    setVideoFrames([]);
    try {
      const res = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: videoPrompt, style: videoStyle, frameCount: videoFrameCount }),
      });
      const data = await res.json();
      if (data.error) { setVideoError(data.error); }
      else { setVideoFrames(data.frames ?? []); }
    } catch { setVideoError("Video generation failed. Please try again."); }
    setVideoLoading(false);
  }

  async function handleVideoDownloadZip() {
    if (!videoFrames.length) return;
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      videoFrames.forEach((dataUrl, i) => {
        const base64 = dataUrl.split(",")[1];
        zip.file(`frame-${String(i + 1).padStart(2, "0")}.png`, base64, { base64: true });
      });
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "zivo-frames.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch { setVideoZipError("Download failed. Please try again."); }
  }

  async function handle3DGenerate() {
    if (!threeDPrompt.trim()) return;
    setThreeDLoading(true);
    setThreeDError(null);
    setThreeDResult(null);
    setThreeDShowSource(false);
    try {
      const res = await fetch("/api/3d", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: threeDPrompt, sceneType: threeDSceneType }),
      });
      const data = await res.json();
      if (data.error) { setThreeDError(data.error); }
      else { setThreeDResult({ html: data.html, summary: data.summary }); }
    } catch { setThreeDError("3D generation failed. Please try again."); }
    setThreeDLoading(false);
  }

  function handleVoiceInput() {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const SpeechRecognitionAPI = getSpeechRecognitionAPI();
    if (!SpeechRecognitionAPI) return;
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript;
      setPrompt((prev) => prev + (prev ? " " : "") + transcript);
    };
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }

  async function handleEnhance() {
    if (!output?.preview_html && !output?.files?.length) return;
    setEnhancing(true);
    const currentCode = output?.files?.map((f) => `// ${f.path}\n${f.content}`).join("\n\n---\n\n") ?? output?.preview_html ?? "";
    try {
      const res = await fetch("/api/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Improve and add more features to this code. Make the UI more polished and add useful functionality:\n\n" + currentCode.slice(0, MAX_ENHANCE_CONTEXT_LENGTH),
          model,
          context: [{ role: "user", content: prompt }],
        }),
      });
      const data: GenerateSiteResponse = await res.json();
      setOutput(data);
      if (data.files?.length) setActiveFile(data.files[0]);
    } catch { /* ignore enhance errors */ }
    setEnhancing(false);
  }

  async function handleChatSend() {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatLoading(true);

    const allMessages = [...chatMessages, { role: "user" as const, content: userMsg }];
    let assistantText = "";
    setChatMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          const payload = line.slice(6);
          if (payload === "[DONE]") break;
          try {
            const parsed = JSON.parse(payload) as { text?: string; error?: string };
            if (parsed.text) {
              assistantText += parsed.text;
              setChatMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantText };
                return updated;
              });
            }
          } catch { /* skip malformed chunks */ }
        }
      }
    } catch {
      setChatMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "Sorry, I encountered an error. Please try again." };
        return updated;
      });
    }
    setChatLoading(false);
  }

  const previewSrc = output?.preview_html
    ? `data:text/html;charset=utf-8,${encodeURIComponent(output.preview_html)}`
    : null;

  const hasFiles = Boolean(output?.files?.length);

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes recordPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); } 70% { box-shadow: 0 0 0 8px rgba(239,68,68,0); } }
        @keyframes statusBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .zivo-btn:hover { opacity: 0.85; transform: scale(1.02); }
        .zivo-btn { transition: opacity 0.15s, transform 0.15s; }
        .zivo-chip:hover { background: rgba(99,102,241,0.2) !important; border-color: rgba(99,102,241,0.4) !important; }
        .zivo-file:hover { background: rgba(255,255,255,0.06) !important; }
        .zivo-tab:hover { color: #f1f5f9 !important; }
        .zivo-nav:hover { color: #f1f5f9 !important; }
        .zivo-textarea:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.4); }
        .zivo-input:focus { outline: none; border-color: #6366f1 !important; }
        .zivo-select:focus { outline: none; border-color: #6366f1 !important; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: COLORS.bg, color: COLORS.textPrimary, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", overflow: "hidden" }}>

        {/* Top Nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1.5rem", height: "52px", borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "28px", height: "28px", background: COLORS.accentGradient, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700 }}>Z</div>
            <span style={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.01em" }}>ZIVO AI</span>
            <div style={{ width: "1px", height: "20px", background: COLORS.border, margin: "0 0.25rem" }} />
            <nav style={{ display: "flex", gap: "0.25rem" }}>
              {([["Builder", "/ai"], ["Workflow", "/workflow"], ["Templates", "/templates"], ["History", "/history"], ["Connectors", "/connectors"]] as const).map(([label, href]) => {
                const isActive = pathname === href;
                return (
                  <a
                    key={href}
                    href={href}
                    className="zivo-nav"
                    style={{ padding: "0.25rem 0.75rem", background: isActive ? "rgba(99,102,241,0.15)" : "transparent", color: isActive ? COLORS.accent : COLORS.textSecondary, borderRadius: "6px", border: isActive ? `1px solid rgba(99,102,241,0.3)` : "1px solid transparent", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 500, transition: "color 0.15s", textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                  >
                    {label}
                  </a>
                );
              })}
            </nav>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: COLORS.success, boxShadow: `0 0 6px ${COLORS.success}` }} />
            <span style={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>Ready</span>
            <button
              className="zivo-btn"
              onClick={() => setChatOpen((o) => !o)}
              title="AI Chat"
              style={{ padding: "0.3rem 0.65rem", background: chatOpen ? "rgba(99,102,241,0.15)" : COLORS.bgCard, border: `1px solid ${chatOpen ? "rgba(99,102,241,0.4)" : COLORS.border}`, borderRadius: "6px", color: chatOpen ? COLORS.accent : COLORS.textSecondary, cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.35rem" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Chat
            </button>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: COLORS.accentGradient, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.875rem" }}>Z</div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* Left Panel */}
          <div style={{ width: "40%", minWidth: "360px", display: "flex", flexDirection: "column", borderRight: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, overflow: "hidden" }}>

            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>

              {/* Mode Switcher */}
              <div style={{ display: "flex", gap: "4px", marginBottom: "1.25rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "4px" }}>
                {([
                  ["code", "Code Builder"],
                  ["website", "Website"],
                  ["mobile", "Mobile App"],
                  ["image", "Image"],
                  ["video", "Video"],
                  ["3d", "3D"],
                ] as const).map(([m, label]) => (
                  <button
                    key={m}
                    className="zivo-btn"
                    onClick={() => setMode(m)}
                    style={{ flex: 1, padding: "0.35rem 0.5rem", borderRadius: "7px", border: "none", background: mode === m ? COLORS.accentGradient : "transparent", color: mode === m ? "#fff" : COLORS.textSecondary, cursor: "pointer", fontSize: "0.8125rem", fontWeight: mode === m ? 600 : 400, transition: "background 0.2s, color 0.2s" }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* ── Code Builder Mode ── */}
              {mode === "code" && (<>

              {/* Header */}
              <div style={{ marginBottom: "1.25rem" }}>
                <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.25rem", letterSpacing: "-0.02em" }}>Build full-stack apps with AI</h1>
                <p style={{ fontSize: "0.8125rem", color: COLORS.textSecondary, margin: 0 }}>Describe what you want — ZIVO generates the code instantly</p>
              </div>

              {/* Prompt Section */}
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ position: "relative" }}>
                  <textarea
                    className="zivo-textarea"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                        e.preventDefault();
                        handleBuild();
                      }
                    }}
                    placeholder="Describe the app you want to build... (e.g. A todo app with Supabase auth and dark mode)"
                    maxLength={2000}
                    style={{ width: "100%", minHeight: "120px", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "0.75rem", resize: "vertical", color: COLORS.textPrimary, fontSize: "0.875rem", lineHeight: 1.6, transition: "border-color 0.2s" }}
                  />
                  <span style={{ position: "absolute", bottom: "0.5rem", right: "0.75rem", fontSize: "0.7rem", color: COLORS.textMuted }}>{prompt.length} / 2000</span>
                </div>
              </div>

              {/* Prompt Suggestions */}
              {(suggestions.length > 0 || suggestLoading) && (
                <div style={{ marginBottom: "0.75rem", display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
                  {suggestLoading && <span style={{ fontSize: "0.75rem", color: COLORS.textMuted, display: "flex", alignItems: "center", gap: "0.3rem" }}><span style={{ display: "inline-block", width: "10px", height: "10px", border: "2px solid rgba(255,255,255,0.1)", borderTop: "2px solid " + COLORS.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Suggesting…</span>}
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      className="zivo-chip"
                      onClick={() => setPrompt(s)}
                      style={{ padding: "0.3rem 0.65rem", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "20px", color: COLORS.accent, cursor: "pointer", fontSize: "0.75rem", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", transition: "background 0.15s" }}
                      title={s}
                    >
                      ✦ {s.length > 60 ? s.slice(0, 60) + "…" : s}
                    </button>
                  ))}
                </div>
              )}

              {/* Quick Prompts */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
                {QUICK_PROMPTS.map((qp) => (
                  <button
                    key={qp.label}
                    className="zivo-chip"
                    onClick={() => setPrompt(qp.prompt)}
                    style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.3rem 0.65rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "20px", color: COLORS.textSecondary, cursor: "pointer", fontSize: "0.75rem", transition: "background 0.15s, border-color 0.15s" }}
                  >
                    {qp.icon}
                    <span>{qp.label}</span>
                  </button>
                ))}
              </div>

              {/* Controls Row */}
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", alignItems: "center" }}>
                <select
                  className="zivo-select"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  style={{ flex: 1, background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textPrimary, padding: "0.45rem 0.65rem", fontSize: "0.8125rem", cursor: "pointer", transition: "border-color 0.2s" }}
                >
                  {MODELS.map((m) => (
                    <option key={m.value} value={m.value} style={{ background: COLORS.bgPanel }}>{m.label}</option>
                  ))}
                </select>

                <button
                  className="zivo-btn"
                  onClick={handleVoiceInput}
                  title={isRecording ? "Stop recording" : "Voice input"}
                  style={{ width: "36px", height: "36px", borderRadius: "8px", background: isRecording ? "rgba(239,68,68,0.15)" : COLORS.bgCard, border: `1px solid ${isRecording ? "rgba(239,68,68,0.4)" : COLORS.border}`, color: isRecording ? "#ef4444" : COLORS.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", animation: isRecording ? "recordPulse 1.5s infinite" : "none", flexShrink: 0 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                </button>

                <button
                  className="zivo-btn"
                  onClick={() => { setPrompt(""); setOutput(null); setDeployResult(null); setDeployError(null); setActiveFile(null); }}
                  style={{ padding: "0.45rem 0.75rem", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textSecondary, cursor: "pointer", fontSize: "0.8125rem", flexShrink: 0 }}
                >
                  Clear
                </button>
              </div>

              {/* Build Button */}
              <button
                className="zivo-btn"
                onClick={handleBuild}
                disabled={loading || !prompt.trim()}
                style={{ width: "100%", padding: "0.7rem", background: loading || !prompt.trim() ? "rgba(99,102,241,0.3)" : COLORS.accentGradient, color: "#fff", borderRadius: "10px", border: "none", cursor: loading || !prompt.trim() ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "0.9375rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "1.25rem" }}
              >
                {loading ? (
                  <>
                    <span style={{ display: "inline-block", width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    Building…
                  </>
                ) : (
                  <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Build</>
                )}
              </button>

              {/* Enhance Button */}
              {hasFiles && (
                <button
                  className="zivo-btn"
                  onClick={handleEnhance}
                  disabled={enhancing || loading}
                  style={{ width: "100%", padding: "0.55rem", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textSecondary, cursor: enhancing || loading ? "not-allowed" : "pointer", fontSize: "0.8125rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", marginBottom: "0.75rem" }}
                >
                  {enhancing ? (
                    <><span style={{ display: "inline-block", width: "12px", height: "12px", border: "2px solid rgba(255,255,255,0.2)", borderTop: "2px solid currentColor", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Enhancing…</>
                  ) : (
                    <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 8v4l3 3"/><circle cx="18" cy="6" r="3"/></svg> Enhance with AI</>
                  )}
                </button>
              )}

              {/* Notifications */}
              {deployResult && (
                <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", padding: "0.75rem", borderRadius: "8px", marginBottom: "0.75rem", animation: "fadeIn 0.3s ease", fontSize: "0.875rem" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",marginRight:"4px",verticalAlign:"middle"}}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>{" "}Deployed:{" "}
                  <a href={deployResult.url} target="_blank" rel="noreferrer" style={{ color: COLORS.success }}>
                    {deployResult.url}
                  </a>
                </div>
              )}
              {deployError && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: COLORS.error, padding: "0.75rem", borderRadius: "8px", marginBottom: "0.75rem", fontSize: "0.875rem" }}>
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",marginRight:"4px",verticalAlign:"middle"}}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>{deployError}</>
                </div>
              )}
              {downloadError && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: COLORS.error, padding: "0.75rem", borderRadius: "8px", marginBottom: "0.75rem", fontSize: "0.875rem" }}>
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",marginRight:"4px",verticalAlign:"middle"}}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>{downloadError}</>
                </div>
              )}
              {githubPushResult && (
                <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", padding: "0.75rem", borderRadius: "8px", marginBottom: "0.75rem", animation: "fadeIn 0.3s ease", fontSize: "0.875rem" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",marginRight:"4px",verticalAlign:"middle"}}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>{" "}Pushed:{" "}
                  <a href={githubPushResult} target="_blank" rel="noreferrer" style={{ color: COLORS.success }}>{githubPushResult}</a>
                </div>
              )}
              {githubPushError && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: COLORS.error, padding: "0.75rem", borderRadius: "8px", marginBottom: "0.75rem", fontSize: "0.875rem" }}>
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",marginRight:"4px",verticalAlign:"middle"}}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>{githubPushError}</>
                </div>
              )}
              {output?.error && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: COLORS.error, padding: "0.75rem", borderRadius: "8px", marginBottom: "0.75rem", fontSize: "0.875rem" }}>
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",marginRight:"4px",verticalAlign:"middle"}}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>{output.error}</>
                </div>
              )}
              {output?.summary && (
                <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, padding: "0.75rem", borderRadius: "8px", marginBottom: "0.75rem", fontSize: "0.8125rem", color: COLORS.textSecondary, animation: "fadeIn 0.3s ease" }}>
                  <span style={{ color: COLORS.textPrimary, fontWeight: 600 }}>Summary:</span> {output.summary}
                </div>
              )}

              {/* File Tree */}
              {hasFiles && output?.files && (
                <div style={{ animation: "fadeIn 0.4s ease" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <h2 style={{ fontSize: "0.8125rem", fontWeight: 600, color: COLORS.textSecondary, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>Generated Files</h2>
                    <span style={{ fontSize: "0.75rem", color: COLORS.textMuted }}>{output.files.length} files</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    {output.files.map((f, i) => (
                      <div
                        key={i}
                        className="zivo-file"
                        onClick={() => { setActiveFile(f); setActiveTab("code"); }}
                        style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.5rem", borderRadius: "6px", cursor: "pointer", background: activeFile?.path === f.path ? "rgba(99,102,241,0.12)" : "transparent", border: activeFile?.path === f.path ? "1px solid rgba(99,102,241,0.25)" : "1px solid transparent", transition: "background 0.15s" }}
                      >
                        <span style={{ fontSize: "0.875rem" }}>{getFileIcon(f.path)}</span>
                        <span style={{ flex: 1, fontSize: "0.8125rem", color: activeFile?.path === f.path ? COLORS.textPrimary : COLORS.textSecondary, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.path}</span>
                        <span style={{ fontSize: "0.65rem", fontWeight: 600, padding: "1px 6px", borderRadius: "4px", textTransform: "uppercase", flexShrink: 0, ...getActionStyle(f.action) }}>{f.action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </>)}

              {/* ── Website Mode ── */}
              {mode === "website" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", animation: "fadeIn 0.3s ease" }}>
                  <div>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.25rem", letterSpacing: "-0.02em" }}>Website Builder</h2>
                    <p style={{ fontSize: "0.8125rem", color: COLORS.textSecondary, margin: 0 }}>Describe your website — ZIVO builds a complete multi-page site instantly</p>
                  </div>
                  <div style={{ marginBottom: "0.75rem" }}>
                    <label style={{ fontSize: "0.75rem", color: COLORS.textSecondary, display: "block", marginBottom: "0.35rem" }}>Prompt</label>
                    <textarea
                      className="zivo-textarea"
                      value={websitePrompt}
                      onChange={(e) => setWebsitePrompt(e.target.value)}
                      onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleWebsiteGenerate(); } }}
                      placeholder="A portfolio website for a designer with a dark theme, project gallery, and contact form..."
                      style={{ width: "100%", minHeight: "100px", resize: "vertical", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textPrimary, padding: "0.6rem 0.75rem", fontSize: "0.875rem", fontFamily: "inherit" }}
                    />
                  </div>
                  <div style={{ marginBottom: "0.75rem" }}>
                    <label style={{ fontSize: "0.75rem", color: COLORS.textSecondary, display: "block", marginBottom: "0.35rem" }}>Style</label>
                    <select
                      value={websiteStyle}
                      onChange={(e) => setWebsiteStyle(e.target.value)}
                      style={{ width: "100%", padding: "0.5rem 0.75rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textPrimary, fontSize: "0.875rem" }}
                    >
                      <option value="modern">Modern &amp; Minimal</option>
                      <option value="bold">Bold &amp; Colorful</option>
                      <option value="corporate">Corporate &amp; Professional</option>
                      <option value="creative">Creative &amp; Artistic</option>
                      <option value="dark">Dark &amp; Elegant</option>
                    </select>
                  </div>
                  <button
                    className="zivo-btn"
                    onClick={handleWebsiteGenerate}
                    disabled={websiteLoading || !websitePrompt.trim()}
                    style={{ width: "100%", padding: "0.65rem", background: COLORS.accentGradient, color: "#fff", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                  >
                    {websiteLoading ? (
                      <><span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> Generating...</>
                    ) : (
                      <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Build Website</>
                    )}
                  </button>
                  {websiteError && (
                    <div style={{ padding: "0.6rem 0.75rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: COLORS.error, fontSize: "0.8125rem" }}>{websiteError}</div>
                  )}
                  {websiteResult && (
                    <div style={{ padding: "0.75rem", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "8px" }}>
                      <div style={{ fontSize: "0.8125rem", color: COLORS.success, fontWeight: 600, marginBottom: "0.35rem" }}>✓ Website generated</div>
                      <div style={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>{websiteResult.summary}</div>
                      <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: COLORS.textMuted }}>{websiteResult.files.length} file(s) generated</div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Mobile App Mode ── */}
              {mode === "mobile" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", animation: "fadeIn 0.3s ease" }}>
                  <div>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.25rem", letterSpacing: "-0.02em" }}>Mobile App Builder</h2>
                    <p style={{ fontSize: "0.8125rem", color: COLORS.textSecondary, margin: 0 }}>Describe your app — ZIVO generates React Native / Expo screens instantly</p>
                  </div>
                  <div style={{ marginBottom: "0.75rem" }}>
                    <label style={{ fontSize: "0.75rem", color: COLORS.textSecondary, display: "block", marginBottom: "0.35rem" }}>Prompt</label>
                    <textarea
                      className="zivo-textarea"
                      value={mobilePrompt}
                      onChange={(e) => setMobilePrompt(e.target.value)}
                      onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleMobileGenerate(); } }}
                      placeholder="A fitness tracking app with a home screen, workout logger, and progress charts..."
                      style={{ width: "100%", minHeight: "100px", resize: "vertical", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textPrimary, padding: "0.6rem 0.75rem", fontSize: "0.875rem", fontFamily: "inherit" }}
                    />
                  </div>
                  <div style={{ marginBottom: "0.75rem" }}>
                    <label style={{ fontSize: "0.75rem", color: COLORS.textSecondary, display: "block", marginBottom: "0.35rem" }}>Framework</label>
                    <select
                      value={mobileFramework}
                      onChange={(e) => setMobileFramework(e.target.value)}
                      style={{ width: "100%", padding: "0.5rem 0.75rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textPrimary, fontSize: "0.875rem" }}
                    >
                      <option value="react-native">React Native</option>
                      <option value="expo">Expo (React Native)</option>
                      <option value="flutter-web">Flutter (Web Preview)</option>
                      <option value="ionic">Ionic / Capacitor</option>
                    </select>
                  </div>
                  <button
                    className="zivo-btn"
                    onClick={handleMobileGenerate}
                    disabled={mobileLoading || !mobilePrompt.trim()}
                    style={{ width: "100%", padding: "0.65rem", background: COLORS.accentGradient, color: "#fff", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                  >
                    {mobileLoading ? (
                      <><span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> Generating...</>
                    ) : (
                      <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg> Build Mobile App</>
                    )}
                  </button>
                  {mobileError && (
                    <div style={{ padding: "0.6rem 0.75rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: COLORS.error, fontSize: "0.8125rem" }}>{mobileError}</div>
                  )}
                  {mobileResult && (
                    <div>
                      <div style={{ padding: "0.75rem", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "8px", marginBottom: "0.75rem" }}>
                        <div style={{ fontSize: "0.8125rem", color: COLORS.success, fontWeight: 600, marginBottom: "0.35rem" }}>✓ Mobile app generated</div>
                        <div style={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>{mobileResult.summary}</div>
                        <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: COLORS.textMuted }}>{mobileResult.files.length} file(s) generated</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Image Mode ── */}
              {mode === "image" && (
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
              )}

              {/* ── Video Mode ── */}
              {mode === "video" && (
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
              )}

              {/* ── 3D Mode ── */}
              {mode === "3d" && (
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
              )}

            </div>

            {/* Bottom Actions — Code Builder only */}
            {mode === "code" && hasFiles && (
              <div style={{ padding: "0.875rem 1.25rem", borderTop: `1px solid ${COLORS.border}`, display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                <button
                  className="zivo-btn"
                  onClick={handleDownload}
                  style={{ flex: 1, padding: "0.5rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textSecondary, cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}
                >
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg> ZIP</>
                </button>
                <button
                  className="zivo-btn"
                  onClick={handleGithubPush}
                  disabled={githubPushing}
                  style={{ flex: 1, padding: "0.5rem", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "8px", color: COLORS.accent, cursor: githubPushing ? "not-allowed" : "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{display:"inline-block",flexShrink:0}}><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                  {githubPushing ? "…" : "GitHub"}
                </button>
                <button
                  className="zivo-btn"
                  onClick={() => handleDeploy("vercel")}
                  disabled={deploying}
                  style={{ flex: 1, padding: "0.5rem", background: deploying ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "8px", color: COLORS.success, cursor: deploying ? "not-allowed" : "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}
                >
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg> {deploying ? "…" : "Deploy"}</>
                </button>
                <button
                  className="zivo-btn"
                  onClick={() => {
                    const all = output?.files?.map((f) => `// ${f.path}\n${f.content}`).join("\n\n---\n\n") ?? "";
                    navigator.clipboard.writeText(all).then(() => {
                      setCopyLabel("saved");
                      setTimeout(() => setCopyLabel("save"), 2000);
                    }).catch(() => {});
                  }}
                  style={{ flex: 1, padding: "0.5rem", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textSecondary, cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}
                >
                  {copyLabel === "saved" ? (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Saved!</>
                  ) : (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/></svg> Save</>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: COLORS.bg }}>

            {/* Preview Toolbar — Code Builder mode only */}
            {mode === "code" && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0 1rem", height: "48px", borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, flexShrink: 0 }}>
              {/* Tabs */}
              <div style={{ display: "flex", gap: "2px", marginRight: "0.5rem" }}>
                {(["preview", "code", "console"] as const).map((tab) => (
                  <button
                    key={tab}
                    className="zivo-tab"
                    onClick={() => setActiveTab(tab)}
                    style={{ padding: "0.3rem 0.75rem", borderRadius: "6px", border: "none", background: activeTab === tab ? "rgba(99,102,241,0.15)" : "transparent", color: activeTab === tab ? COLORS.accent : COLORS.textMuted, cursor: "pointer", fontSize: "0.8125rem", fontWeight: 500, textTransform: "capitalize", transition: "color 0.15s" }}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* URL bar */}
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.25rem 0.75rem", maxWidth: "320px" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:COLORS.textMuted,flexShrink:0}}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span style={{ fontSize: "0.8rem", color: COLORS.textSecondary, fontFamily: "monospace" }}>localhost:3000</span>
              </div>

              <div style={{ flex: 1 }} />

              {/* Device switcher */}
              <div style={{ display: "flex", gap: "2px" }}>
              {([
                ["desktop" as const, <DesktopIcon key="d" />],
                ["tablet" as const, <TabletIcon key="t" />],
                ["mobile" as const, <MobileIcon key="m" />],
              ] as Array<["desktop"|"tablet"|"mobile", React.ReactElement]>).map(([deviceType, icon]) => (
                  <button
                    key={deviceType}
                    className="zivo-btn"
                    onClick={() => setDeviceMode(deviceType)}
                    title={deviceType}
                    style={{ width: "30px", height: "30px", borderRadius: "6px", border: "none", background: deviceMode === deviceType ? "rgba(99,102,241,0.15)" : "transparent", color: deviceMode === deviceType ? COLORS.accent : COLORS.textMuted, cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    {icon}
                  </button>
                ))}
              </div>

              {/* Visual Edit Toggle */}
              <button
                className="zivo-btn"
                onClick={() => setVisualEdit((v) => !v)}
                title="Visual Edit"
                style={{ padding: "0.3rem 0.65rem", borderRadius: "6px", border: `1px solid ${visualEdit ? "rgba(99,102,241,0.4)" : COLORS.border}`, background: visualEdit ? "rgba(99,102,241,0.15)" : "transparent", color: visualEdit ? COLORS.accent : COLORS.textMuted, cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.35rem" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg> <span>{visualEdit ? "Editing" : "Edit"}</span>
              </button>

              {/* Refresh */}
              {previewSrc && (
                <button
                  className="zivo-btn"
                  onClick={() => { if (iframeRef.current) iframeRef.current.src = iframeRef.current.src; }}
                  title="Refresh"
                  style={{ width: "30px", height: "30px", borderRadius: "6px", border: "none", background: "transparent", color: COLORS.textMuted, cursor: "pointer", fontSize: "16px" }}
                >
                  ↻
                </button>
              )}
            </div>
            )}

            {/* Loading progress bar */}
            {loading && (
              <div style={{ height: "3px", background: COLORS.bgCard, flexShrink: 0 }}>
                <div style={{ height: "100%", background: COLORS.accentGradient, width: loadingStep === 0 ? "20%" : loadingStep === 1 ? "60%" : "90%", transition: "width 0.8s ease" }} />
              </div>
            )}

            {/* ── Code Builder Right Panel ── */}
            {mode === "code" && (
            <div style={{ flex: 1, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>

              {/* Empty State */}
              {!loading && !output && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "1rem", animation: "fadeIn 0.5s ease", padding: "2rem", textAlign: "center" }}>
                  <div style={{ width: "80px", height: "80px", borderRadius: "20px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366f1" }}><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg></div>
                  <div>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.5rem", color: COLORS.textPrimary }}>Your app will appear here</h2>
                    <p style={{ fontSize: "0.875rem", color: COLORS.textSecondary, margin: 0 }}>Describe your app on the left and click Build to get started</p>
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
                    {[
                      { key: "preview", label: "Instant Preview", icon: <InstantPreviewIcon /> },
                      { key: "ai", label: "AI-Powered", icon: <AiPoweredIcon /> },
                      { key: "edit", label: "Fully Editable", icon: <EditableIcon /> },
                    ].map((chip) => (
                      <span key={chip.key} style={{ padding: "0.35rem 0.75rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "20px", fontSize: "0.8125rem", color: COLORS.textSecondary, display:"inline-flex", alignItems:"center", gap:"0.35rem" }}>{chip.icon}{chip.label}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "1.5rem", padding: "2rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%", maxWidth: "320px" }}>
                    {[
                      "Understanding your prompt...",
                      "Generating files...",
                      "Starting preview...",
                    ].map((step, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", animation: i <= loadingStep ? "fadeIn 0.4s ease" : "none", opacity: i <= loadingStep ? 1 : 0.3 }}>
                        <span style={{ display:"inline-flex", alignItems:"center" }}>
                          {i < loadingStep ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={i === loadingStep ? {animation:"spin 1s linear infinite"} : {}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          )}
                        </span>
                        <span style={{ fontSize: "0.875rem", color: i <= loadingStep ? COLORS.textPrimary : COLORS.textMuted }}>{step}</span>
                      </div>
                    ))}
                  </div>
                  {/* Skeleton */}
                  <div style={{ width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {[80, 60, 90, 50].map((w, i) => (
                      <div key={i} style={{ height: "16px", borderRadius: "8px", background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", width: `${w}%` }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Tab */}
              {!loading && output && activeTab === "preview" && (
                <div style={{ width: iframeWidth, height: "100%", position: "relative", transition: "width 0.3s ease" }}>
                  {previewSrc ? (
                    <>
                      <iframe
                        ref={iframeRef}
                        src={previewSrc}
                        title="Live Preview"
                        style={{ width: "100%", height: "100%", border: visualEdit ? "2px solid rgba(99,102,241,0.6)" : "none", boxShadow: visualEdit ? "0 0 0 3px rgba(99,102,241,0.25)" : "none", transition: "box-shadow 0.2s, border-color 0.2s" }}
                        sandbox="allow-scripts allow-same-origin"
                        onLoad={() => applyVisualEditOverlay(visualEdit)}
                      />
                      {popover && (
                        <div style={{ position: "absolute", top: popover.y, left: popover.x, background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "0.875rem", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", zIndex: 10000, minWidth: "220px", animation: "fadeIn 0.2s ease" }}>
                          <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem", color: COLORS.textSecondary }}>Edit element text:</p>
                          <input
                            className="zivo-input"
                            value={popoverInput}
                            onChange={(e) => setPopoverInput(e.target.value)}
                            style={{ width: "100%", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "6px", padding: "0.35rem 0.5rem", color: COLORS.textPrimary, fontSize: "0.875rem" }}
                          />
                          <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
                            <button
                              className="zivo-btn"
                              onClick={() => {
                                if (output?.preview_html && popover) {
                                  const updated = output.preview_html.replace(popover.text, popoverInput);
                                  setOutput((prev) => prev ? { ...prev, preview_html: updated } : prev);
                                }
                                setPopover(null);
                              }}
                              style={{ flex: 1, padding: "0.35rem", background: COLORS.accentGradient, color: "#fff", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 }}
                            >
                              Apply
                            </button>
                            <button
                              className="zivo-btn"
                              onClick={() => setPopover(null)}
                              style={{ flex: 1, padding: "0.35rem", background: COLORS.bgCard, color: COLORS.textSecondary, borderRadius: "6px", border: `1px solid ${COLORS.border}`, cursor: "pointer", fontSize: "0.75rem" }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: COLORS.textMuted, fontSize: "0.875rem", textAlign: "center", padding: "2rem" }}>
                      {output?.files?.some((f) => f.path.endsWith(".tsx") || f.path.endsWith(".ts"))
                        ? "Live preview not available for TypeScript files — view in Code tab"
                        : "No preview available for this project type."}
                    </div>
                  )}
                </div>
              )}

              {/* Code Tab */}
              {!loading && output && activeTab === "code" && (
                <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", animation: "fadeIn 0.3s ease" }}>
                  {activeFile ? (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 1rem", borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
                        <span style={{ fontSize: "0.875rem" }}>{getFileIcon(activeFile.path)}</span>
                        <code style={{ fontSize: "0.8125rem", color: COLORS.textSecondary, fontFamily: "monospace" }}>{activeFile.path}</code>
                        <span style={{ fontSize: "0.7rem", padding: "1px 6px", borderRadius: "4px", textTransform: "uppercase", fontWeight: 600, ...getActionStyle(activeFile.action) }}>{activeFile.action}</span>
                        <div style={{ flex: 1 }} />
                        <button
                          className="zivo-btn"
                          onClick={() => navigator.clipboard.writeText(activeFile.content).then(() => {
                            setCopyFileLabel("copied");
                            setTimeout(() => setCopyFileLabel("copy"), 2000);
                          }).catch(() => {})}
                          style={{ padding: "0.3rem 0.65rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "6px", color: COLORS.textSecondary, cursor: "pointer", fontSize: "0.75rem" }}
                        >
                          {copyFileLabel === "copied" ? (
                            <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Copied!</>
                          ) : (
                            <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg> Copy</>
                          )}
                        </button>
                      </div>
                      <div style={{ flex: 1, overflow: "auto", padding: "1rem" }}>
                        <pre style={{ margin: 0, fontSize: "0.8125rem", lineHeight: 1.7, color: COLORS.textPrimary, fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                          {activeFile.content.split("\n").map((line, i) => (
                            <div key={i} style={{ display: "flex", gap: "1rem" }}>
                              <span style={{ color: COLORS.textMuted, userSelect: "none", minWidth: "2.5rem", textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                              <span>{line}</span>
                            </div>
                          ))}
                        </pre>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: COLORS.textMuted, fontSize: "0.875rem" }}>
                      Select a file from the left panel to view its code.
                    </div>
                  )}
                </div>
              )}

              {/* Console Tab */}
              {!loading && output && activeTab === "console" && (
                <div style={{ width: "100%", height: "100%", padding: "1rem", animation: "fadeIn 0.3s ease", overflow: "auto", background: "#000" }}>
                  <div style={{ fontFamily: "'Fira Code', 'SF Mono', 'Monaco', 'Consolas', monospace", fontSize: "0.8125rem", lineHeight: 1.8 }}>
                    {consoleLogs.map((log, i) => (
                      <div key={i} style={{ color: log.type === "error" ? COLORS.error : log.type === "success" ? COLORS.success : "#4ade80" }}>
                        {log.text}
                      </div>
                    ))}
                    {consoleLogs.length === 0 && (
                      <div style={{ color: COLORS.textMuted }}>No console output yet.</div>
                    )}
                    <div ref={consoleEndRef} />
                  </div>
                </div>
              )}
            </div>
            )}

            {/* ── Image Right Panel ── */}
            {mode === "image" && (
              <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: imageResult || imageLoading ? "flex-start" : "center", padding: "2rem", gap: "1.5rem" }}>
                {!imageResult && !imageLoading && (
                  <div style={{ textAlign: "center", color: COLORS.textMuted }}>
                    <div style={{ width: "80px", height: "80px", borderRadius: "20px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366f1", margin: "0 auto 1rem" }}>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                    </div>
                    <p style={{ fontSize: "0.875rem" }}>Your generated image will appear here</p>
                  </div>
                )}
                {imageLoading && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                    <span style={{ display: "inline-block", width: "40px", height: "40px", border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    <p style={{ color: COLORS.textSecondary, fontSize: "0.875rem" }}>Generating image…</p>
                  </div>
                )}
                {imageResult && (
                  <div style={{ width: "100%", maxWidth: "640px", animation: "fadeIn 0.4s ease" }}>
                    <img
                      src={imageResult.dataUrl}
                      alt={imageResult.prompt}
                      style={{ width: "100%", borderRadius: "12px", border: `1px solid ${COLORS.border}`, display: "block" }}
                    />
                    <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
                      <a
                        href={imageResult.dataUrl}
                        download="zivo-image.png"
                        style={{ flex: 1, padding: "0.5rem", background: COLORS.accentGradient, color: "#fff", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600, textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                        Download PNG
                      </a>
                    </div>
                    <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: COLORS.textMuted }}>{imageResult.size}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Video Right Panel ── */}
            {mode === "video" && (
              <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: videoFrames.length || videoLoading ? "flex-start" : "center", padding: "2rem", gap: "1rem" }}>
                {!videoFrames.length && !videoLoading && (
                  <div style={{ textAlign: "center", color: COLORS.textMuted }}>
                    <div style={{ width: "80px", height: "80px", borderRadius: "20px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366f1", margin: "0 auto 1rem" }}>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect width="15" height="14" x="1" y="5" rx="2"/></svg>
                    </div>
                    <p style={{ fontSize: "0.875rem" }}>Your generated frames will appear here</p>
                  </div>
                )}
                {videoLoading && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                    <span style={{ display: "inline-block", width: "40px", height: "40px", border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    <p style={{ color: COLORS.textSecondary, fontSize: "0.875rem" }}>Generating {videoFrameCount} frames in parallel…</p>
                  </div>
                )}
                {videoFrames.length > 0 && (
                  <div style={{ width: "100%", maxWidth: "780px", animation: "fadeIn 0.4s ease" }}>
                    <p style={{ fontSize: "0.8125rem", color: COLORS.textSecondary, marginBottom: "0.75rem" }}>{videoFrames.length} frames generated · {videoStyle}</p>
                    <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(videoFrames.length, 3)}, 1fr)`, gap: "0.5rem" }}>
                      {videoFrames.map((frame, i) => (
                        <div key={i} style={{ position: "relative", borderRadius: "8px", overflow: "hidden", border: `1px solid ${COLORS.border}` }}>
                          <img src={frame} alt={`Frame ${i + 1}`} style={{ width: "100%", display: "block" }} />
                          <div style={{ position: "absolute", top: "6px", left: "6px", background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: "0.7rem", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>
                            {i + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Website Right Panel ── */}
            {mode === "website" && (
              <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {/* Toolbar */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0 1rem", height: "48px", borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: COLORS.accent }}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: COLORS.textSecondary }}>Website Preview</span>
                </div>
                {!websiteResult && !websiteLoading && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "1rem", color: COLORS.textMuted, textAlign: "center", padding: "2rem" }}>
                    <div style={{ width: "80px", height: "80px", borderRadius: "20px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366f1" }}>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    </div>
                    <p style={{ fontSize: "0.875rem" }}>Your generated website will appear here</p>
                  </div>
                )}
                {websiteLoading && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "1rem" }}>
                    <span style={{ display: "inline-block", width: "40px", height: "40px", border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    <p style={{ color: COLORS.textSecondary, fontSize: "0.875rem" }}>Building website…</p>
                  </div>
                )}
                {websiteResult?.preview_html && (
                  <iframe
                    title="Website Preview"
                    srcDoc={websiteResult.preview_html}
                    style={{ flex: 1, width: "100%", border: "none" }}
                    sandbox="allow-scripts allow-same-origin"
                  />
                )}
              </div>
            )}

            {/* ── Mobile App Right Panel ── */}
            {mode === "mobile" && (
              <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
                {/* Toolbar */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0 1rem", height: "48px", borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: COLORS.accent }}><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: COLORS.textSecondary }}>Mobile Preview</span>
                </div>
                {!mobileResult && !mobileLoading && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "1rem", color: COLORS.textMuted, textAlign: "center", padding: "2rem" }}>
                    <div style={{ width: "80px", height: "80px", borderRadius: "20px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366f1" }}>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                    </div>
                    <p style={{ fontSize: "0.875rem" }}>Your generated mobile app will appear here</p>
                  </div>
                )}
                {mobileLoading && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "1rem" }}>
                    <span style={{ display: "inline-block", width: "40px", height: "40px", border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    <p style={{ color: COLORS.textSecondary, fontSize: "0.875rem" }}>Building mobile app…</p>
                  </div>
                )}
                {mobileResult?.preview_html && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", flex: 1 }}>
                    <div style={{ width: `${MOBILE_FRAME_WIDTH}px`, height: `${MOBILE_FRAME_HEIGHT}px`, borderRadius: "40px", border: "8px solid #111", boxShadow: "0 0 0 2px #333, 0 20px 60px rgba(0,0,0,0.5)", overflow: "hidden", flexShrink: 0, background: "#000", position: "relative" }}>
                      <iframe
                        title="Mobile App Preview"
                        srcDoc={mobileResult.preview_html}
                        style={{ width: "100%", height: "100%", border: "none" }}
                        sandbox="allow-scripts allow-same-origin"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── 3D Right Panel ── */}
            {mode === "3d" && (
              <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {!threeDResult && !threeDLoading && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "1rem", color: COLORS.textMuted, textAlign: "center", padding: "2rem" }}>
                    <div style={{ width: "80px", height: "80px", borderRadius: "20px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366f1" }}>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                    </div>
                    <p style={{ fontSize: "0.875rem" }}>Your interactive 3D scene will appear here</p>
                  </div>
                )}
                {threeDLoading && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "1rem" }}>
                    <span style={{ display: "inline-block", width: "40px", height: "40px", border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    <p style={{ color: COLORS.textSecondary, fontSize: "0.875rem" }}>Generating 3D scene…</p>
                  </div>
                )}
                {threeDResult && !threeDShowSource && (
                  <iframe
                    title="3D Scene"
                    srcDoc={threeDResult.html}
                    style={{ flex: 1, width: "100%", border: "none" }}
                    sandbox="allow-scripts allow-same-origin"
                  />
                )}
                {threeDResult && threeDShowSource && (
                  <div style={{ flex: 1, overflow: "auto", padding: "1rem", background: "#000" }}>
                    <pre style={{ margin: 0, fontSize: "0.8125rem", lineHeight: 1.7, color: COLORS.textPrimary, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {threeDResult.html}
                    </pre>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Chat Panel Overlay */}
        {chatOpen && (
          <div style={{ position: "fixed", top: "52px", right: 0, bottom: "28px", width: "340px", background: COLORS.bgPanel, borderLeft: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", zIndex: 40, animation: "fadeIn 0.2s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
              <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>AI Chat</span>
              <button onClick={() => setChatOpen(false)} style={{ background: "transparent", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: "1.25rem" }}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {chatMessages.length === 0 && (
                <div style={{ textAlign: "center", color: COLORS.textMuted, fontSize: "0.8125rem", padding: "2rem 0" }}>Ask the AI anything about your project…</div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", gap: "0.25rem" }}>
                  <div style={{ maxWidth: "85%", padding: "0.5rem 0.75rem", borderRadius: msg.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px", background: msg.role === "user" ? COLORS.accentGradient : COLORS.bgCard, border: `1px solid ${COLORS.border}`, fontSize: "0.8125rem", color: COLORS.textPrimary, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{msg.content || (msg.role === "assistant" && chatLoading ? "…" : "")}</div>
                  {msg.role === "assistant" && msg.content && (
                    <button
                      onClick={() => setPrompt((prev) => prev ? prev + "\n\n" + msg.content : msg.content)}
                      style={{ fontSize: "0.7rem", color: COLORS.accent, background: "transparent", border: "none", cursor: "pointer", padding: "0 0.25rem" }}
                    >
                      Use in prompt ↑
                    </button>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div style={{ padding: "0.75rem", borderTop: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
                  placeholder="Ask something…"
                  style={{ flex: 1, background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.45rem 0.65rem", color: COLORS.textPrimary, fontSize: "0.8125rem", outline: "none" }}
                />
                <button
                  onClick={handleChatSend}
                  disabled={chatLoading || !chatInput.trim()}
                  style={{ padding: "0.45rem 0.75rem", background: chatLoading || !chatInput.trim() ? "rgba(99,102,241,0.3)" : COLORS.accentGradient, border: "none", borderRadius: "8px", color: "#fff", cursor: chatLoading || !chatInput.trim() ? "not-allowed" : "pointer", fontSize: "0.8125rem", fontWeight: 600 }}
                >
                  {chatLoading ? "…" : "→"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1.5rem", height: "28px", borderTop: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, flexShrink: 0, fontSize: "0.7rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: loading ? COLORS.warning : COLORS.success, animation: "statusBlink 2s infinite" }} />
            <span style={{ color: COLORS.textMuted }}>{loading ? "Building…" : "Ready to build"}</span>
          </div>
          <span style={{ color: COLORS.textMuted }}>{buildTime ? `Last build: ${buildTime}` : "No builds yet"}</span>
          <span style={{ color: COLORS.textMuted }}>{model} · {prompt.length} chars</span>
        </div>
      </div>
    </>
  );
}

export default function AIPage() {
  return (
    <Suspense fallback={null}>
      <AIPageInner />
    </Suspense>
  );
}