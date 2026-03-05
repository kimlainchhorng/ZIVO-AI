'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import Image from "next/image";
import { Suspense } from "react";
import { addHistoryEntry } from "@/lib/history-store";
import PlanViewer from "@/components/PlanViewer";
import BuildOutputPanel from "@/components/BuildOutputPanel";
import DiffViewer from "@/components/DiffViewer";
import ModelSelector from "@/components/ModelSelector";
import CommandPalette from "@/components/CommandPalette";
import DesignSystemPanel from "@/components/DesignSystemPanel";
import DesignPanel from "@/components/DesignPanel";
import FullAppModal, { type FullAppOptions } from "@/components/FullAppModal";
import BlueprintPanel from "@/components/BlueprintPanel";
import type { ProjectPlan } from "@/lib/ai/project-planner";
import type { BuildError, BuildWarning } from "@/lib/ai/fix-loop";
import type { ArchitecturePlan } from "@/app/api/plan/route";
import BuildProgressIndicator, { type BuildStage } from "@/components/BuildProgressIndicator";
import ConsolePanel from "@/components/ConsolePanel";
import SEOAnalyzer from "@/components/SEOAnalyzer";
import AccessibilityScanner from "@/components/AccessibilityScanner";
import PerformanceAnalyzer from "@/components/PerformanceAnalyzer";
import DocGenerator from "@/components/DocGenerator";
import AgentOrchestrator from "@/components/AgentOrchestrator";
import TemplateSelector from "@/components/TemplateSelector";
import type { LogEntry } from "@/lib/logger";
import { Icon } from "@/components/icons/Icon";
import { getWebContainer, resetWebContainer } from "@/lib/webcontainer";
import type { FileSystemTree, WebContainerProcess } from "@webcontainer/api";
import GeneratedAppAnalysis from "@/components/GeneratedAppAnalysis";
import FileTree from "@/components/FileTree";
import VoiceInput from "@/components/VoiceInput";

interface SecurityIssue {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  line?: number;
  cwe?: string;
  recommendation: string;
}

interface SecurityScanResult {
  issues: SecurityIssue[];
  score: number;
  summary: string;
  language: string;
}

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
  iterationCount?: number;
  projectId?: string;
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

/** Maximum characters to display per chat bubble in the build history sidebar. */
const MAX_CHAT_HISTORY_DISPLAY_LENGTH = 120;

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

const PROMPT_SUGGESTIONS = [
  "Build a complete e-commerce application with product catalog, shopping cart, Stripe checkout, order management, admin panel, user authentication, and mobile-responsive design",
  "Build an e-commerce app featuring product listings, cart, checkout, user accounts, and order history",
  "Build a responsive e-commerce platform with product search, filters, reviews, and payment processing",
];

const TEMPLATE_SHORTCUTS = [
  { icon: "🏠", label: "Landing Page", prompt: "Build a beautiful SaaS landing page with hero, features, pricing, FAQ, and CTA sections" },
  { icon: "📋", label: "Todo App", prompt: "Build a full-stack todo app with auth, CRUD operations, categories, and due dates" },
  { icon: "🛒", label: "E-commerce", prompt: "Build a complete e-commerce store with product catalog, cart, and Stripe checkout" },
  { icon: "🔐", label: "Auth Flow", prompt: "Build a complete authentication system with login, signup, password reset, and profile pages" },
  { icon: "📊", label: "Dashboard", prompt: "Build a modern analytics dashboard with charts, stats cards, data tables, and filters" },
];

const TEMPLATE_CARDS = [
  { iconName: "rocket" as const, label: "Landing Page", description: "SaaS landing page with hero, features, pricing, testimonials, and CTA", prompt: "Build a SaaS landing page with hero, features, pricing, testimonials, and CTA" },
  { iconName: "barChart" as const, label: "Dashboard", description: "Analytics dashboard with sidebar navigation, stats cards, charts, and data tables", prompt: "Build an analytics dashboard with sidebar navigation, stats cards, charts, and data tables" },
  { iconName: "cart" as const, label: "E-commerce", description: "E-commerce store with product listings, cart, and checkout flow", prompt: "Build an e-commerce store with product listings, cart, and checkout flow" },
  { iconName: "lock" as const, label: "Auth System", description: "Complete auth flow with login, signup, forgot password, and profile pages", prompt: "Build a complete auth flow with login, signup, forgot password, and profile pages" },
  { iconName: "settings" as const, label: "Admin Panel", description: "Admin panel with user management, data tables, CRUD operations, and role permissions", prompt: "Build an admin panel with user management, data tables, CRUD operations, and role permissions" },
  { iconName: "mobile" as const, label: "Mobile App", description: "Mobile-first React Native-style app with bottom navigation and card-based UI", prompt: "Build a mobile-first React Native-style app with bottom navigation and card-based UI" },
  { iconName: "users" as const, label: "SaaS App", description: "Full SaaS application with dashboard, billing, team management, and settings", prompt: "Build a full SaaS application with dashboard, billing, team management, and settings" },
  { iconName: "globe" as const, label: "Marketplace", description: "Marketplace with listings, search, filters, seller profiles, and messaging", prompt: "Build a marketplace with listings, search, filters, seller profiles, and messaging" },
];

const MODELS = [
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4.1-mini", label: "GPT-4.1-mini" },
  { value: "gpt-4o-mini", label: "GPT-4o-mini" },
];

const LOADING_STEP1_DELAY = 800;
const LOADING_STEP2_DELAY = 2000;
const LOADING_STEP3_DELAY = 8000;
// Debounce delay for AI prompt suggestions (ms)
const SUGGEST_DEBOUNCE_MS = 800;
// Max characters of existing code sent to the enhance endpoint
const MAX_ENHANCE_CONTEXT_LENGTH = 3000;
// Mobile phone frame dimensions for preview
const MOBILE_FRAME_WIDTH = 375;
const MOBILE_FRAME_HEIGHT = 812;
// Max characters shown in the quick prompt suggestion chip text
const MAX_PROMPT_SUGGESTION_LENGTH = 72;

// Map SSE stage names (from /api/build) to buildStages array indices:
// buildStages: [prompt(0), parse(1), blueprint(2), generate(3), validate(4), fix(5), preview(6), deploy(7)]
const SSE_STAGE_TO_BUILD_INDEX: Readonly<Record<string, number>> = {
  BLUEPRINT: 2,
  MANIFEST: 3,
  GENERATE: 3,
  GENERATING: 3,
  VALIDATE: 4,
  VALIDATING: 4,
  FIX: 5,
  FIXING: 5,
  DONE: 6,
};

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
  const [vercelToken, setVercelToken] = useState("");
  const [showVercelTokenInput, setShowVercelTokenInput] = useState(false);
  const [supabaseToken, setSupabaseToken] = useState<string | null>(null);
  const [supabaseUserEmail, setSupabaseUserEmail] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [popover, setPopover] = useState<{ x: number; y: number; text: string } | null>(null);
  const [popoverInput, setPopoverInput] = useState("");
  const [activeFile, setActiveFile] = useState<GeneratedFile | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "console" | "diff" | "design">("preview");
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

  // Iteration tracking for iterative builds
  const [buildIterationCount, setBuildIterationCount] = useState(0);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);

  // Project memory ID — persisted in localStorage across page reloads
  const [projectId, setProjectId] = useState<string | null>(null);

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
  const [connectedGithubRepo, setConnectedGithubRepo] = useState<string | null>(null);
  // GitHub push modal
  const [githubModalOpen, setGithubModalOpen] = useState(false);
  const [githubModalOwner, setGithubModalOwner] = useState("");
  const [githubModalRepo, setGithubModalRepo] = useState("");
  const [githubModalBranch, setGithubModalBranch] = useState("main");
  const [githubModalToken, setGithubModalToken] = useState("");

  // Mode switcher
  const [mode, setMode] = useState<"code" | "security" | "website" | "mobile" | "image" | "video" | "3d">("code");

  // Website generation state
  const [websitePrompt, setWebsitePrompt] = useState("");
  const [websiteStyle, setWebsiteStyle] = useState("modern");
  const [websiteResult, setWebsiteResult] = useState<{ files: GeneratedFile[]; preview_html: string; summary: string } | null>(null);
  const [websiteLoading, setWebsiteLoading] = useState(false);
  const [websiteError, setWebsiteError] = useState<string | null>(null);
  // Website iteration tracking
  const [websiteIteration, setWebsiteIteration] = useState(0);
  const [, setWebsiteHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  // Website v2 pass counter for SSE progress
  const [websitePassMessage, setWebsitePassMessage] = useState<string | null>(null);
  const [websiteLivePreviewUrl, setWebsiteLivePreviewUrl] = useState<string | null>(null);
  const [websiteLivePreviewRunning, setWebsiteLivePreviewRunning] = useState(false);
  const [websiteLivePreviewStatus, setWebsiteLivePreviewStatus] = useState<string | null>(null);
  const [websiteLivePreviewError, setWebsiteLivePreviewError] = useState<string | null>(null);
  const websiteDevProcessRef = useRef<WebContainerProcess | null>(null);
  const websiteServerUnsubscribeRef = useRef<(() => void) | null>(null);

  // Mobile app generation state
  const [mobilePrompt, setMobilePrompt] = useState("");
  const [mobileFramework, setMobileFramework] = useState("react-native");
  const [mobileResult, setMobileResult] = useState<{ files: GeneratedFile[]; preview_html: string; summary: string } | null>(null);
  const [mobileLoading, setMobileLoading] = useState(false);
  const [mobileError, setMobileError] = useState<string | null>(null);
  // Mobile v2 pass counter for SSE progress
  const [mobilePassMessage, setMobilePassMessage] = useState<string | null>(null);

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

  // Security scan state
  const [securityCode, setSecurityCode] = useState("");
  const [securityLanguage, setSecurityLanguage] = useState("typescript");
  const [securityScanResult, setSecurityScanResult] = useState<SecurityScanResult | null>(null);
  const [securityScanning, setSecurityScanning] = useState(false);
  const [securityFixing, setSecurityFixing] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [securityFixedCode, setSecurityFixedCode] = useState<string | null>(null);
  const [securityActiveTab, setSecurityActiveTab] = useState<"scan" | "fixed">("scan");
  const [securityCopyLabel, setSecurityCopyLabel] = useState<"copy" | "copied">("copy");

  // Read ?prompt= from URL
  const searchParams = useSearchParams();
  const pathname = usePathname();
  useEffect(() => {
    const urlPrompt = searchParams.get("prompt");
    if (urlPrompt) setPrompt(urlPrompt);
  }, [searchParams]);

  // Read connected GitHub repo from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("zivo_github_token");
    const repo  = localStorage.getItem("zivo_github_repo");
    setConnectedGithubRepo(token && repo ? repo : null);
  }, []);

  // Load project memory from localStorage on mount (Upgrade 11)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("zivo_project_memory");
      if (stored) setProjectMemory(JSON.parse(stored));
    } catch {
      // Ignore invalid stored data
    }
  }, []);

  // Load projectId from localStorage on mount; generate one if absent
  useEffect(() => {
    try {
      const stored = localStorage.getItem("zivo_project_id");
      if (stored) {
        setProjectId(stored);
      } else {
        const newId = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36));
        localStorage.setItem("zivo_project_id", newId);
        setProjectId(newId);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Load Supabase auth token and Vercel token from localStorage on mount
  useEffect(() => {
    try {
      const token = localStorage.getItem("zivo_supabase_token");
      if (token) {
        setSupabaseToken(token);
        // Try to decode email from JWT without a full verify (client-side only display)
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          if (payload?.email) setSupabaseUserEmail(payload.email as string);
        } catch {
          // Ignore JWT decode failures
        }
      }
      const vt = localStorage.getItem("zivo_vercel_token");
      if (vt) setVercelToken(vt);
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Ctrl+K / Cmd+K command palette; Ctrl+T / Cmd+T create page
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((o) => !o);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "t") {
        e.preventDefault();
        setCreatePageModalOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

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

  // Plan feature state
  const [planResult, setPlanResult] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [plan, setPlan] = useState<ProjectPlan | null>(null);
  const [isPlanLoading, setIsPlanLoading] = useState(false);
  const [buildErrors, setBuildErrors] = useState<BuildError[]>([]);
  const [buildWarnings, setBuildWarnings] = useState<BuildWarning[]>([]);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [buildIteration, setBuildIteration] = useState(0);
  const [isBuildRunning, setIsBuildRunning] = useState(false);
  const [activeLeftTab, setActiveLeftTab] = useState<"prompt" | "plan" | "templates" | "workflows" | "generate" | "blueprint" | "projects">("prompt");
  // Supabase-persisted project ID (set after a successful build when user is authenticated)
  const [savedProjectId, setSavedProjectId] = useState<string | null>(null);
  // Instruction input for continuing an existing project build
  const [continueInstruction, setContinueInstruction] = useState("");
  const [activeRightTab, setActiveRightTab] = useState<"files" | "code" | "diff">("files");
  const [diffFiles, setDiffFiles] = useState<Array<{path: string; oldContent: string; newContent: string}>>([]);
  const [showDiff, setShowDiff] = useState(false);
  // Architecture plan from /api/plan
  const [planData, setPlanData] = useState<ArchitecturePlan | null>(null);
  // Command palette + design system panel
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [buildStages, setBuildStages] = useState<BuildStage[]>([
    { id: "prompt", label: "Prompt", icon: "edit", status: "pending" },
    { id: "parse", label: "Parse", icon: "search", status: "pending" },
    { id: "blueprint", label: "Blueprint", icon: "fileText", status: "pending" },
    { id: "generate", label: "Generate", icon: "zap", status: "pending" },
    { id: "validate", label: "Validate", icon: "check", status: "pending" },
    { id: "fix", label: "Fix", icon: "settings", status: "pending" },
    { id: "preview", label: "Preview", icon: "eye", status: "pending" },
    { id: "deploy", label: "Deploy", icon: "rocket", status: "pending" },
  ]);
  const [currentBuildStage, setCurrentBuildStage] = useState(0);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [consolePanelOpen, setConsolePanelOpen] = useState(false);
  const [buildOutputOpen, setBuildOutputOpen] = useState(false);
  const [analysisTab, setAnalysisTab] = useState<"seo" | "a11y" | "perf" | "docs" | "agents">("seo");
  const [analysisPanelOpen, setAnalysisPanelOpen] = useState(false);
  const [designSystemOpen, setDesignSystemOpen] = useState(false);
  // Design panel (visual token editor)
  const [designPanelOpen, setDesignPanelOpen] = useState(false);
  // Full App Modal
  const [fullAppModalOpen, setFullAppModalOpen] = useState(false);
  const [fullAppLoading, setFullAppLoading] = useState(false);
  // Create Page Modal
  const [createPageModalOpen, setCreatePageModalOpen] = useState(false);
  const [createPageName, setCreatePageName] = useState("");
  const [createPageRoute, setCreatePageRoute] = useState("");
  const [createPageDescription, setCreatePageDescription] = useState("");
  // Abort controller for streaming build
  const abortControllerRef = useRef<AbortController | null>(null);
  // File search (Upgrade 14b)
  const [_fileSearchQuery, setFileSearchQuery] = useState("");
  // Auto-fix state (Upgrade 9)
  const [autoFixing, setAutoFixing] = useState(false);
  const [autoFixLog, setAutoFixLog] = useState<string | null>(null);
  // Project memory (Upgrade 11)
  const [projectMemory, setProjectMemory] = useState<Record<string, unknown> | null>(null);
  // Design tab settings (Upgrade 6)
  const [designPrimaryColor, setDesignPrimaryColor] = useState("#6366f1");
  const [designFontFamily, setDesignFontFamily] = useState("Inter");
  const [designSpacing, setDesignSpacing] = useState("normal");

  // Click-to-Edit: in-panel code editor state
  const [editedContent, setEditedContent] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  // Resizable left panel
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(() => {
    if (typeof window === "undefined") return 280;
    const stored = localStorage.getItem("zivo_left_panel_width");
    return stored ? Math.min(480, Math.max(220, parseInt(stored, 10))) : 280;
  });
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const isDraggingPanelRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartWidthRef = useRef(0);

  // Streaming code tab: displayed content (typed character by character when loading)
  const [streamedCodeContent, setStreamedCodeContent] = useState<string>("");
  const streamedCodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const iframeWidth = deviceMode === "mobile" ? "390px" : deviceMode === "tablet" ? "768px" : "100%";

  async function handleBuild(promptOverride?: string) {
    const buildPrompt = promptOverride ?? prompt;
    if (!buildPrompt.trim()) return;

    // Capture existing files before resetting output (for iterative builds)
    const existingFilesForBuild = output?.files?.length ? output.files : undefined;
    const isIteration = buildIterationCount > 0;

    setLoading(true);
    setLoadingStep(0);
    setOutput(null);
    setDeployResult(null);
    setDeployError(null);
    setDownloadError(null);
    setActiveFile(null);
    setEditedContent(null);
    setSaveStatus("idle");
    setFileSearchQuery("");
    setAutoFixLog(null);
    setWebsiteLivePreviewError(null);
    setConsoleLogs([{ text: isIteration ? `> Iteration ${buildIterationCount + 1}: Updating project...` : "> Building project...", type: "info" }]);
    setBuildOutputOpen(true); // auto-open build output when build starts
    setIsBuildRunning(true);
    setBuildErrors([]);
    setBuildWarnings([]);
    setBuildLogs([]);
    setBuildIteration(0);
    setShowDiff(false);

    // Fetch plan in parallel (non-blocking)
    setIsPlanLoading(true);
    fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: buildPrompt, model }),
    }).then((r) => r.json()).then((p: ProjectPlan & { error?: string }) => {
      if (!p.error) setPlan(p);
    }).catch(() => {}).finally(() => setIsPlanLoading(false));

    const buildStart = Date.now();
    const stepTimer1 = setTimeout(() => setLoadingStep(1), LOADING_STEP1_DELAY);
    const stepTimer2 = setTimeout(() => setLoadingStep(2), LOADING_STEP2_DELAY);
    const stepTimer3 = setTimeout(() => setLoadingStep(3), LOADING_STEP3_DELAY);

    // Initialise first stage as active
    setBuildStages((prev) => prev.map((s, i) => ({ ...s, status: i === 0 ? "active" : "pending" })));
    setCurrentBuildStage(0);

    // Create abort controller for this build, cancel any previous
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Build conversation context for iterative builds
    const buildContext = isIteration ? conversationHistory : [];

    // Collected files from SSE stream
    let collectedFiles: GeneratedFile[] = [];
    let buildSummary = "";
    let collectedPreviewHtml: string | undefined;

    try {
      const buildHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (supabaseToken) buildHeaders["Authorization"] = `Bearer ${supabaseToken}`;
      const res = await fetch("/api/build", {
        method: "POST",
        headers: buildHeaders,
        body: JSON.stringify({
          prompt: continueInstruction.trim() || buildPrompt,
          model,
          projectMemory,
          context: buildContext,
          existingFiles: existingFilesForBuild,
          projectId,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuffer += decoder.decode(value, { stream: true });

        const lines = sseBuffer.split("\n");
        sseBuffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === "[DONE]") continue;

          let evt: { type: string; stage?: string; message?: string; progress?: number; files?: GeneratedFile[]; preview_html?: string; details?: unknown; data?: Record<string, unknown> };
          try {
            evt = JSON.parse(raw) as typeof evt;
          } catch {
            continue;
          }

          if (evt.type === "stage" && evt.stage) {
            const stageIdx = SSE_STAGE_TO_BUILD_INDEX[evt.stage] ?? -1;
            if (stageIdx >= 0) {
              setBuildStages((prev) =>
                prev.map((s, i) => ({
                  ...s,
                  status:
                    i < stageIdx ? "done" : i === stageIdx ? "active" : "pending",
                }))
              );
              setCurrentBuildStage(stageIdx);
            }
            if (evt.message) {
              setConsoleLogs((prev) => [...prev, { text: `> [${evt.stage}] ${evt.message}`, type: "info" }]);
            }
            if (evt.stage === "DONE") {
              buildSummary = evt.message ?? buildSummary;
              // Capture persisted projectId returned from the server when authenticated
              if (evt.data?.projectId && typeof evt.data.projectId === "string") {
                setSavedProjectId(evt.data.projectId);
              }
            }
          } else if (evt.type === "files" && Array.isArray(evt.files)) {
            collectedFiles = evt.files as GeneratedFile[];
            if (evt.preview_html) collectedPreviewHtml = evt.preview_html;
            // Show files incrementally
            if (collectedFiles.length > 0 && !activeFile) {
              setActiveFile(collectedFiles[0]);
              setEditedContent(collectedFiles[0].content);
              setActiveRightTab("files");
            }
            setOutput((prev) => ({ ...(prev ?? {}), files: collectedFiles }));
          } else if (evt.type === "error") {
            const errMsg = String(evt.message ?? "Build error");
            setConsoleLogs((prev) => [...prev, { text: `> ❌ ${errMsg}`, type: "error" }]);
            setOutput({ error: errMsg });
          }
        }
      }

      // Process collected files
      const data: GenerateSiteResponse = {
        files: collectedFiles,
        preview_html: collectedPreviewHtml,
        summary: buildSummary || `Generated ${collectedFiles.length} files.`,
      };
      setOutput(data);

      if (collectedFiles.length > 0) {
        setActiveFile(collectedFiles[0]);
        setEditedContent(collectedFiles[0].content);
        // Build a lookup map for O(1) access to existing file content
        const existingFileMap = new Map(
          (existingFilesForBuild ?? []).map((ef) => [ef.path, ef.content])
        );
        setDiffFiles(collectedFiles.map((f) => ({ path: f.path, oldContent: existingFileMap.get(f.path) ?? "", newContent: f.content })));
        setShowDiff(true);

        // If a full standalone HTML document is available, the iframe already shows it
        // via the useEffect on output.preview_html — no WebContainer needed.
        const isStandaloneHtmlDocument =
          typeof data.preview_html === "string" &&
          /^<!doctype|^<html/i.test(data.preview_html.trimStart());
        if (!isStandaloneHtmlDocument) {
          void startWebsiteLivePreview(collectedFiles);
        }
        setActiveRightTab("files");
      }

      const duration = Date.now() - buildStart;
      setBuildTime(`${(duration / 1000).toFixed(1)}s`);

      // Mark all stages done
      setBuildStages((prev) => prev.map((s) => ({ ...s, status: "done" as const })));
      setCurrentBuildStage(7);

      // Update conversation history for next iteration
      const newHistory: Array<{ role: "user" | "assistant"; content: string }> = [
        ...buildContext,
        { role: "user", content: buildPrompt },
        { role: "assistant", content: data.summary ?? `Generated ${data.files?.length ?? 0} files.` },
      ];
      setConversationHistory(newHistory);
      setBuildIterationCount((n) => n + 1);

      // Save to build history
      addHistoryEntry({
        createdAt: Date.now(),
        prompt: buildPrompt,
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

      // Save project memory after successful build
      if (data.files?.length) {
        const pages = data.files
          .filter((f) => f.path.endsWith("page.tsx") || f.path.endsWith("page.ts"))
          .map((f) => ({ route: "/" + f.path.replace(/^app\//, "").replace(/\/page\.(tsx|ts)$/, ""), description: f.path }));
        const componentPaths = data.files
          .filter((f) => f.path.startsWith("components/"))
          .map((f) => f.path);
        const updatedMemory: Record<string, unknown> = {
          ...(projectMemory ?? {}),
          name: (projectMemory as Record<string, unknown> | null)?.name ?? "My App",
          framework: "next.js",
          lastUpdated: Date.now(),
          pages,
          components: componentPaths,
        };
        setProjectMemory(updatedMemory);
        try { localStorage.setItem("zivo_project_memory", JSON.stringify(updatedMemory)); } catch { /* ignore */ }
      }

      // Auto-fix errors loop — validate generated files and fix any errors
      if (data.files?.length) {
        const { validateFiles } = await import("@/agents/validator");
        const validationResult = validateFiles(data.files.map((f) => ({ path: f.path, content: f.content })));
        const errorsToFix = validationResult.issues
          .filter((i) => i.type === "error")
          .map((i) => ({ file: i.file, line: i.line, message: i.message, type: "typescript" as const }));
        if (errorsToFix.length > 0) {
          let currentFiles = data.files;
          let iteration = 0;
          const MAX_FIX_ITERATIONS = 3;
          setAutoFixing(true);
          setConsoleLogs((prev) => [...prev, { text: `> 🔧 Auto-fixing ${errorsToFix.length} error(s)…`, type: "info" }]);
          while (iteration < MAX_FIX_ITERATIONS) {
            try {
              const fixRes = await fetch("/api/fix-errors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ files: currentFiles, errors: errorsToFix, iteration }),
              });
              const fixData = await fixRes.json();
              if (fixData.files?.length) {
                currentFiles = fixData.files;
                setOutput((prev) => prev ? { ...prev, files: fixData.files } : prev);
              }
              setAutoFixLog(fixData.summary ?? null);
              setConsoleLogs((prev) => [...prev, { text: `> 🔧 ${fixData.summary}`, type: "success" }]);
              if (fixData.fixed === 0) break;
            } catch {
              break;
            }
            iteration++;
          }
          setAutoFixing(false);
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") {
        setConsoleLogs((prev) => [...prev, { text: "> Build stopped by user.", type: "error" }]);
      } else {
        setOutput({ error: "Request failed" });
        setConsoleLogs((prev) => [...prev, { text: "> Error: Request failed", type: "error" }]);
      }
    }

    abortControllerRef.current = null;
    clearTimeout(stepTimer1);
    clearTimeout(stepTimer2);
    clearTimeout(stepTimer3);
    setLoading(false);
    setLoadingStep(0);
    setIsBuildRunning(false);
  }

  function handleStopBuild() {
    abortControllerRef.current?.abort();
  }

  function handleStartFresh() {
    // Generate a new projectId and persist it
    const newId = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36));
    try {
      localStorage.setItem("zivo_project_id", newId);
    } catch { /* ignore */ }
    setProjectId(newId);
    setSavedProjectId(null);
    setContinueInstruction("");
    // Reset all build state
    setOutput(null);
    setActiveFile(null);
    setEditedContent(null);
    setConversationHistory([]);
    setBuildIterationCount(0);
    setDiffFiles([]);
    setShowDiff(false);
    setPlan(null);
    setPlanData(null);
    setConsoleLogs([{ text: "> 🆕 New project started.", type: "info" }]);
  }

  /** Save the currently edited file content to local state (and Supabase if authenticated). */
  async function handleFileSave() {
    if (!activeFile || editedContent === null) return;
    const newContent = editedContent;
    setIsSaving(true);
    setSaveStatus("idle");

    // Update local output.files state
    const updatedFile: GeneratedFile = { ...activeFile, content: newContent, action: "update" };
    setActiveFile(updatedFile);
    setOutput((prev) =>
      prev
        ? { ...prev, files: (prev.files ?? []).map((f) => (f.path === activeFile.path ? updatedFile : f)) }
        : prev
    );

    // Also refresh diff tracking for the edited file
    setDiffFiles((prev) =>
      prev.map((d) => (d.path === activeFile.path ? { ...d, newContent } : d))
    );

    // Persist to Supabase if the user has a saved project
    if (savedProjectId) {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("zivo_supabase_token") : null;
        if (token) {
          const res = await fetch(`/api/projects/${savedProjectId}/files`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ path: activeFile.path, content: newContent }),
          });
          if (!res.ok) throw new Error("Save failed");
        }
      } catch {
        setIsSaving(false);
        setSaveStatus("error");
        return;
      }
    }

    setIsSaving(false);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2500);
  }

  /**
   * Generates a static HTML snapshot from generated files for the preview pane.
   * Used as a fallback when no preview_html is available (e.g. Next.js/TypeScript builds).
   */
  function buildHTMLSnapshot(files: GeneratedFile[]): string {
    let appName = "ZIVO App";
    const pkgFile = files.find((f) => f.path === "package.json");
    if (pkgFile) {
      try {
        const pkg = JSON.parse(pkgFile.content) as { name?: string };
        if (pkg.name) appName = pkg.name;
      } catch { /* ignore */ }
    }

    const pageFiles = files.filter(
      (f) =>
        f.path.endsWith("/page.tsx") ||
        f.path.endsWith("/page.ts") ||
        f.path === "pages/index.tsx" ||
        f.path === "pages/index.ts"
    );

    const routes = pageFiles.map((f) => {
      const route =
        f.path
          .replace(/^(src\/app|app|pages)/, "")
          .replace(/\/page\.(tsx|ts|jsx|js)$/, "")
          .replace(/^$/, "/") || "/";
      return route || "/";
    });

    const components = files
      .filter(
        (f) =>
          f.path.startsWith("components/") ||
          f.path.startsWith("src/components/")
      )
      .map((f) => f.path.split("/").pop()?.replace(/\.(tsx|ts|jsx|js)$/, "") ?? "")
      .filter(Boolean)
      .slice(0, 16);

    const mainPage = files.find(
      (f) =>
        f.path === "app/page.tsx" ||
        f.path === "src/app/page.tsx" ||
        f.path === "pages/index.tsx" ||
        f.path === "app/page.ts"
    );
    let mainContent = "";
    if (mainPage) {
      mainContent = mainPage.content
        .replace(/^import\s.*$/gm, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\{[^}]*\}/g, "")
        .replace(/\/\/.*$/gm, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 400);
    }

    const totalKB = Math.round(files.reduce((a, f) => a + f.content.length, 0) / 1024);

    const esc = (s: string) =>
      s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] ?? c));

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(appName)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;background:#0a0b14;color:#f1f5f9;min-height:100vh}
  .hdr{background:#0f1120;border-bottom:1px solid rgba(255,255,255,.08);padding:.875rem 2rem;display:flex;align-items:center;gap:.75rem}
  .logo{width:32px;height:32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1rem;flex-shrink:0;color:#fff}
  .hdr h1{font-size:1.125rem;font-weight:700}
  .badge{padding:.2rem .65rem;background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.3);border-radius:20px;font-size:.7rem;color:#f59e0b;font-weight:600;margin-left:.25rem}
  .wrap{max-width:860px;margin:1.5rem auto;padding:0 1.5rem;display:grid;gap:1.25rem}
  .note{padding:.65rem 1rem;background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.25);border-radius:8px;font-size:.8125rem;color:#f59e0b}
  .card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:1.125rem}
  .card h2{font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;font-weight:600;margin-bottom:.75rem}
  .stats{display:flex;gap:2rem;flex-wrap:wrap}
  .sn{font-size:1.625rem;font-weight:800;color:#f1f5f9;line-height:1}
  .sl{font-size:.7rem;color:#475569;text-transform:uppercase;letter-spacing:.06em;margin-top:.2rem}
  .routes{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:.4rem}
  .route{padding:.4rem .65rem;background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.25);border-radius:7px;font-size:.8rem;color:#a5b4fc;font-family:monospace}
  .tags{display:flex;flex-wrap:wrap;gap:.35rem}
  .tag{padding:.2rem .55rem;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:6px;font-size:.75rem;color:#94a3b8}
  .txt{font-size:.8125rem;color:#94a3b8;line-height:1.75}
</style>
</head>
<body>
<div class="hdr">
  <div class="logo">Z</div>
  <h1>${esc(appName)}</h1>
  <span class="badge">HTML Snapshot</span>
</div>
<div class="wrap">
  <div class="note">&#9432; This is a static snapshot preview. Use the <strong>Code</strong> tab to view and edit files.</div>
  <div class="card">
    <h2>Project Overview</h2>
    <div class="stats">
      <div><div class="sn">${files.length}</div><div class="sl">Files</div></div>
      <div><div class="sn">${routes.length}</div><div class="sl">Routes</div></div>
      <div><div class="sn">${components.length}</div><div class="sl">Components</div></div>
      <div><div class="sn">${totalKB}KB</div><div class="sl">Total Size</div></div>
    </div>
  </div>
  ${routes.length > 0 ? `<div class="card"><h2>Pages &amp; Routes (${routes.length})</h2><div class="routes">${routes.map((r) => `<div class="route">${esc(r)}</div>`).join("")}</div></div>` : ""}
  ${components.length > 0 ? `<div class="card"><h2>Components (${components.length})</h2><div class="tags">${components.map((c) => `<span class="tag">${esc(c)}</span>`).join("")}</div></div>` : ""}
  ${mainContent ? `<div class="card"><h2>Homepage Content</h2><p class="txt">${esc(mainContent)}</p></div>` : ""}
</div>
</body>
</html>`;
  }

  async function generatePreviewFromFiles(files: GeneratedFile[]): Promise<string> {
    if (!files.length) return "";
    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files }),
      });
      if (res.ok) {
        const data = await res.json() as { previewHtml?: string };
        if (typeof data.previewHtml === "string" && data.previewHtml.trim()) {
          return data.previewHtml;
        }
      }
    } catch {
      // Ignore preview API failures and fall back to local HTML snapshot.
    }

    return buildHTMLSnapshot(files);
  }
  function toWebContainerTree(files: GeneratedFile[]): FileSystemTree {
    const tree: FileSystemTree = {};

    for (const file of files) {
      if (!file.path || file.action === "delete") continue;
      const parts = file.path.split("/").filter(Boolean);
      if (parts.length === 0) continue;

      let current = tree;
      for (let i = 0; i < parts.length; i += 1) {
        const part = parts[i];
        const isLeaf = i === parts.length - 1;

        if (isLeaf) {
          current[part] = { file: { contents: file.content ?? "" } };
          continue;
        }

        const existing = current[part];
        if (!existing || !("directory" in existing)) {
          current[part] = { directory: {} };
        }

        current = (current[part] as { directory: FileSystemTree }).directory;
      }
    }

    return tree;
  }

  async function startWebsiteLivePreview(files: GeneratedFile[], retryCount = 0): Promise<void> {
    if (!files.length) return;

    if (retryCount === 0) {
      // Check crossOriginIsolated before attempting WebContainer boot.
      // If the browser doesn't have COOP/COEP headers, skip silently —
      // the static HTML snapshot is already showing in the iframe.
      const isCrossOriginIsolated =
        typeof window !== 'undefined' &&
        window.crossOriginIsolated === true;
      if (!isCrossOriginIsolated) {
        setWebsiteLivePreviewRunning(false);
        setWebsiteLivePreviewStatus(null);
        return;
      }

      setWebsiteLivePreviewError(null);
      setWebsiteLivePreviewStatus("Booting live runtime…");
      setWebsiteLivePreviewRunning(true);
      setWebsiteLivePreviewUrl(null);
    }

    try {
      try {
        websiteServerUnsubscribeRef.current?.();
      } catch {
        // ignore
      }
      websiteServerUnsubscribeRef.current = null;

      try {
        websiteDevProcessRef.current?.kill();
      } catch {
        // ignore
      }
      websiteDevProcessRef.current = null;

      const webcontainer = await getWebContainer();
      await webcontainer.mount(toWebContainerTree(files));

      websiteServerUnsubscribeRef.current = webcontainer.on("server-ready", (_port, url) => {
        setWebsiteLivePreviewUrl(url);
        setWebsiteLivePreviewStatus("Live preview ready");
      });

      setWebsiteLivePreviewStatus("Installing dependencies…");
      const installProcess = await webcontainer.spawn("npm", ["install", "--no-audit", "--no-fund"]);
      const installCode = await installProcess.exit;
      if (installCode !== 0) throw new Error(`npm install failed (${installCode})`);

      setWebsiteLivePreviewStatus("Starting Next.js dev server…");
      const devProcess = await webcontainer.spawn("npm", ["run", "dev", "--", "--port", "3000", "--hostname", "0.0.0.0"]);
      websiteDevProcessRef.current = devProcess;

      void devProcess.exit.then((code) => {
        setWebsiteLivePreviewRunning(false);
        if (code !== 0) {
          setWebsiteLivePreviewError(`Live preview exited with code ${code}.`);
          setWebsiteLivePreviewStatus(null);
        }
      });
    } catch (err: unknown) {
      // Check if this is the UNKNOWN write error (errno -4094)
      const isWriteError =
        err instanceof Error &&
        (err.message.includes("-4094") ||
          err.message.includes("UNKNOWN") ||
          err.message.includes("syscall: 'write'") ||
          err.message.includes("write"));
      // Allow up to 4 retries (5 total attempts) for write errors.
      // Delays: 2s, 4s, 8s, 16s (exponential backoff starting at 2s).
      if (retryCount < 4 && isWriteError) {
        const delay = 2000 * Math.pow(2, retryCount);
        setWebsiteLivePreviewStatus(`Write error — retrying (attempt ${retryCount + 2}/5)…`);
        await new Promise<void>((resolve) => setTimeout(resolve, delay));
        // Reset the singleton so the next getWebContainer() call boots fresh.
        resetWebContainer();
        return startWebsiteLivePreview(files, retryCount + 1);
      }
      // All retries exhausted — graceful fallback to static snapshot
      setWebsiteLivePreviewRunning(false);
      setWebsiteLivePreviewStatus(null);
      setWebsiteLivePreviewError("Live preview unavailable — showing static snapshot");
    }
  }

  async function handlePlan() {
    if (!prompt.trim()) return;
    setPlanLoading(true);
    setPlanResult(null);
    setPlanData(null);
    setPlanOpen(true);
    setActiveLeftTab("plan");
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model }),
      });
      const data = await res.json() as ArchitecturePlan & { error?: string };
      if (data.error) {
        setPlanResult(`**Error:** ${data.error}`);
      } else {
        setPlanData(data);
        setPlanResult(null);
      }
    } catch {
      setPlanResult("**Error:** Failed to generate plan.");
    }
    setPlanLoading(false);
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

  // Auto-refresh iframe when preview_html changes
  useEffect(() => {
    if (output?.preview_html && iframeRef.current) {
      iframeRef.current.srcdoc = output.preview_html;
    }
  }, [output?.preview_html]);

  async function handleDeploy(platform: "vercel" | "netlify") {
    if (!output?.files?.length) return;

    // If deploying to Vercel and no token available, show the token input
    if (platform === "vercel" && !vercelToken) {
      setShowVercelTokenInput(true);
      return;
    }

    setDeploying(true);
    setDeployError(null);
    try {
      const body: Record<string, unknown> = { platform, files: output.files };
      if (platform === "vercel" && vercelToken) body.token = vercelToken;
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) {
        setDeployError(data.error);
        // If the error is about a missing token, show the token input
        if (data.error.includes("VERCEL_TOKEN")) {
          setShowVercelTokenInput(true);
        }
      } else {
        setDeployResult(data as DeployResult);
        setShowVercelTokenInput(false);
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
      const res = await fetch("/api/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "upsert",
          token,
          repo,
          files: output.files.map((f) => ({
            path: f.path,
            content: f.content,
            message: `ZIVO AI: ${prompt.slice(0, 60)}`,
          })),
        }),
      });
      const data = await res.json();
      if (data.error) {
        setGithubPushError(data.error);
      } else {
        const parts = repo.split("/");
        const repoUrl = parts.length === 2 && parts[0] && parts[1]
          ? `https://github.com/${parts[0]}/${parts[1]}`
          : `https://github.com/${repo}`;
        setGithubPushResult(repoUrl);
      }
    } catch {
      setGithubPushError("GitHub push failed. Please try again.");
    }
    setGithubPushing(false);
  }

  async function handleGithubModalPush() {
    if (!output?.files?.length) return;
    const token = githubModalToken.trim() || (typeof window !== "undefined" ? localStorage.getItem("zivo_github_token") : null);
    const repoFull = githubModalOwner.trim() && githubModalRepo.trim()
      ? `${githubModalOwner.trim()}/${githubModalRepo.trim()}`
      : connectedGithubRepo ?? (typeof window !== "undefined" ? localStorage.getItem("zivo_github_repo") : null);
    if (!token || !repoFull) {
      setGithubPushError("Enter owner/repo and a GitHub token.");
      return;
    }
    setGithubPushing(true);
    setGithubPushResult(null);
    setGithubPushError(null);
    setGithubModalOpen(false);
    try {
      const res = await fetch("/api/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "upsert",
          token,
          repo: repoFull,
          branch: githubModalBranch.trim() || "main",
          files: output.files.map((f) => ({
            path: f.path,
            content: f.content,
            message: `ZIVO AI: ${prompt.slice(0, 60)}`,
          })),
        }),
      });
      const data = await res.json();
      if (data.error) {
        setGithubPushError(data.error);
      } else {
        setGithubPushResult(`https://github.com/${repoFull}/tree/${githubModalBranch.trim() || "main"}`);
        // Persist token and repo for future use
        try {
          localStorage.setItem("zivo_github_token", token);
          localStorage.setItem("zivo_github_repo", repoFull);
        } catch { /* ignore */ }
      }
    } catch {
      setGithubPushError("GitHub push failed. Please try again.");
    }
    setGithubPushing(false);
  }

  async function handleShare() {
    if (!savedProjectId || !supabaseToken) return;
    setSharing(true);
    try {
      const res = await fetch(`/api/projects/${savedProjectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseToken}` },
        body: JSON.stringify({ visibility: "public" }),
      });
      if (res.ok) {
        const url = `${window.location.origin}/p/${savedProjectId}`;
        setShareUrl(url);
        // Best-effort clipboard copy; the URL is also displayed in the UI as a fallback
        navigator.clipboard.writeText(url).catch(() => {});
      }
    } catch {
      // Share failed silently; shareUrl remains null so user sees no change
    }
    setSharing(false);
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

    const previousFiles = output?.files ?? [];

    setWebsiteLoading(true);
    setWebsiteError(null);
    setWebsiteResult(null);
    setWebsitePassMessage(null);
    setWebsiteLivePreviewUrl(null);
    setWebsiteLivePreviewError(null);
    setWebsiteLivePreviewStatus(null);
    try {
      const newIteration = websiteIteration + 1;
      const res = await fetch("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${websitePrompt}. Style: ${websiteStyle}.`,
          model,
          mode: "website_v2",
        }),
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = "";
      let collectedFiles: GeneratedFile[] = [];
      let buildSummary = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split("\n");
        sseBuffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === "[DONE]") continue;
          let evt: { type: string; stage?: string; message?: string; progress?: number; files?: GeneratedFile[] };
          try { evt = JSON.parse(raw) as typeof evt; } catch { continue; }

          if (evt.type === "stage") {
            if (evt.message) setWebsitePassMessage(evt.message);
            if (evt.stage === "DONE") buildSummary = evt.message ?? buildSummary;
          } else if (evt.type === "files" && Array.isArray(evt.files)) {
            collectedFiles = evt.files;
          } else if (evt.type === "error") {
            setWebsiteError(String(evt.message ?? "Website generation failed."));
          }
        }
      }

      if (collectedFiles.length > 0) {
        setWebsitePassMessage("Preparing website preview…");
        const previewHtml = await generatePreviewFromFiles(collectedFiles);
        const summary = buildSummary || `Generated ${collectedFiles.length} files.`;

        setWebsiteResult({ files: collectedFiles, preview_html: previewHtml, summary });
        setWebsiteIteration(newIteration);
        setWebsiteHistory((prev) => [
          ...prev,
          { role: "user" as const, content: websitePrompt },
          { role: "assistant" as const, content: summary },
        ]);

        setOutput({ files: collectedFiles, preview_html: previewHtml, summary });
        setActiveFile(collectedFiles[0]);
        setEditedContent(collectedFiles[0].content);
        setActiveRightTab("files");

        const previousFileMap = new Map(previousFiles.map((f) => [f.path, f.content]));
        setDiffFiles(
          collectedFiles.map((f) => ({
            path: f.path,
            oldContent: previousFileMap.get(f.path) ?? "",
            newContent: f.content,
          }))
        );
        setShowDiff(true);

        void startWebsiteLivePreview(collectedFiles);
      } else if (!websiteError) {
        setWebsiteError("No files were generated. Try a more specific prompt.");
      }
    } catch (err: unknown) {
      setWebsiteError(err instanceof Error ? err.message : "Website generation failed. Please try again.");
    }
    setWebsiteLoading(false);
    setWebsitePassMessage(null);
    setWebsiteLivePreviewUrl(null);
    setWebsiteLivePreviewError(null);
    setWebsiteLivePreviewStatus(null);
  }

  async function handleMobileGenerate() {
    if (!mobilePrompt.trim()) return;
    setMobileLoading(true);
    setMobileError(null);
    setMobileResult(null);
    setMobilePassMessage(null);
    try {
      const res = await fetch("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${mobileFramework} mobile app: ${mobilePrompt}`,
          model,
          mode: "mobile_v2",
        }),
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = "";
      let collectedFiles: GeneratedFile[] = [];
      let buildSummary = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split("\n");
        sseBuffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === "[DONE]") continue;
          let evt: { type: string; stage?: string; message?: string; progress?: number; files?: GeneratedFile[] };
          try { evt = JSON.parse(raw) as typeof evt; } catch { continue; }

          if (evt.type === "stage") {
            if (evt.message) setMobilePassMessage(evt.message);
            if (evt.stage === "DONE") buildSummary = evt.message ?? buildSummary;
          } else if (evt.type === "files" && Array.isArray(evt.files)) {
            collectedFiles = evt.files;
          } else if (evt.type === "error") {
            setMobileError(String(evt.message ?? "Mobile generation failed."));
          }
        }
      }

      if (collectedFiles.length > 0) {
        setMobileResult({ files: collectedFiles, preview_html: "", summary: buildSummary || `Generated ${collectedFiles.length} files.` });
      }
    } catch (err: unknown) {
      setMobileError(err instanceof Error ? err.message : "Mobile app generation failed. Please try again.");
    }
    setMobileLoading(false);
    setMobilePassMessage(null);
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

  async function handleSecurityScan() {
    if (!securityCode.trim()) return;
    setSecurityScanning(true);
    setSecurityError(null);
    setSecurityScanResult(null);
    setSecurityFixedCode(null);
    try {
      const res = await fetch("/api/security-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: securityCode, language: securityLanguage, mode: "scan" }),
      });
      const data = await res.json() as SecurityScanResult & { error?: string };
      if (data.error) { setSecurityError(data.error); }
      else { setSecurityScanResult(data); setSecurityActiveTab("scan"); }
    } catch { setSecurityError("Scan failed. Please try again."); }
    setSecurityScanning(false);
  }

  async function handleSecurityFix() {
    if (!securityCode.trim() || !securityScanResult) return;
    setSecurityFixing(true);
    setSecurityError(null);
    try {
      const issuesSummary = securityScanResult.issues
        .map((i) => `[${i.severity.toUpperCase()}] ${i.title}: ${i.description}`)
        .join("\n");
      const res = await fetch("/api/security-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: securityCode, language: securityLanguage, mode: "fix", issues: issuesSummary }),
      });
      const data = await res.json() as { fixedCode?: string; error?: string };
      if (data.error) { setSecurityError(data.error); }
      else { setSecurityFixedCode(data.fixedCode ?? ""); setSecurityActiveTab("fixed"); }
    } catch { setSecurityError("Fix failed. Please try again."); }
    setSecurityFixing(false);
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

  async function handleFullAppBuild(options: FullAppOptions) {
    setFullAppModalOpen(false);
    setFullAppLoading(true);
    setLoading(true);
    setLoadingStep(0);
    setOutput(null);
    setActiveFile(null);
    setEditedContent(null);
    setSaveStatus("idle");
    setConsoleLogs([{ text: `> ⚡ Building full app: ${options.appName}…`, type: "info" }]);
    setBuildErrors([]);
    setBuildWarnings([]);
    setBuildLogs([]);
    setBuildIteration(0);
    setShowDiff(false);

    // Build an enriched prompt that includes app metadata so the pipeline
    // understands the full-app context; /api/build accepts a single prompt string
    // so we prepend the structured fields here on the client side.
    const featureList = options.features.length > 0 ? options.features.join(", ") : "none";
    const fullAppPrompt = [
      `App name: ${options.appName}`,
      `App type: ${options.appType}`,
      `Required features: ${featureList}`,
      options.prompt,
    ].join("\n");

    // Initialise first stage as active
    setBuildStages((prev) => prev.map((s, i) => ({ ...s, status: i === 0 ? "active" : "pending" })));
    setCurrentBuildStage(0);

    // Create abort controller for this build, cancel any previous
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const buildStart = Date.now();
    const stepTimer1 = setTimeout(() => setLoadingStep(1), LOADING_STEP1_DELAY);
    const stepTimer2 = setTimeout(() => setLoadingStep(2), LOADING_STEP2_DELAY);
    const stepTimer3 = setTimeout(() => setLoadingStep(3), LOADING_STEP3_DELAY);

    let collectedFiles: GeneratedFile[] = [];
    let buildSummary = "";

    try {
      const res = await fetch("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: fullAppPrompt,
          model,
          projectId,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuffer += decoder.decode(value, { stream: true });

        const lines = sseBuffer.split("\n");
        sseBuffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === "[DONE]") continue;

          let evt: { type: string; stage?: string; message?: string; progress?: number; files?: GeneratedFile[]; details?: unknown };
          try {
            evt = JSON.parse(raw) as typeof evt;
          } catch {
            continue;
          }

          if (evt.type === "stage" && evt.stage) {
            const stageIdx = SSE_STAGE_TO_BUILD_INDEX[evt.stage] ?? -1;
            if (stageIdx >= 0) {
              setBuildStages((prev) =>
                prev.map((s, i) => ({
                  ...s,
                  status:
                    i < stageIdx ? "done" : i === stageIdx ? "active" : "pending",
                }))
              );
              setCurrentBuildStage(stageIdx);
            }
            if (evt.message) {
              setConsoleLogs((prev) => [...prev, { text: `> [${evt.stage}] ${evt.message}`, type: "info" }]);
            }
            if (evt.stage === "DONE") {
              buildSummary = evt.message ?? buildSummary;
            }
          } else if (evt.type === "files" && Array.isArray(evt.files)) {
            collectedFiles = evt.files as GeneratedFile[];
            if (collectedFiles.length > 0 && !activeFile) {
              setActiveFile(collectedFiles[0]);
              setEditedContent(collectedFiles[0].content);
              setActiveRightTab("files");
            }
            setOutput((prev) => ({ ...(prev ?? {}), files: collectedFiles }));
          } else if (evt.type === "error") {
            const errMsg = String(evt.message ?? "Build error");
            setConsoleLogs((prev) => [...prev, { text: `> ❌ ${errMsg}`, type: "error" }]);
            setOutput({ error: errMsg });
          }
        }
      }

      // Update output with final summary (files were already streamed incrementally)
      setOutput((prev) => ({
        ...(prev ?? {}),
        files: collectedFiles,
        summary: buildSummary || `Generated ${collectedFiles.length} files.`,
      }));

      if (collectedFiles.length > 0) {
        setActiveFile(collectedFiles[0]);
        setEditedContent(collectedFiles[0].content);
        setDiffFiles(collectedFiles.map((f) => ({ path: f.path, oldContent: "", newContent: f.content })));
        setShowDiff(true);
        setActiveRightTab("files");
        setActiveTab("code");
      }

      const duration = Date.now() - buildStart;
      setBuildTime(`${(duration / 1000).toFixed(1)}s`);

      // Mark all stages done
      setBuildStages((prev) => prev.map((s) => ({ ...s, status: "done" as const })));
      setCurrentBuildStage(7);

      const fileLogs = collectedFiles.map((f) => ({ text: `> Created: ${f.path}`, type: "success" as const }));
      setConsoleLogs((prev) => [
        ...prev,
        ...fileLogs,
        { text: `> ⚡ Full app built in ${duration}ms — ${collectedFiles.length} files`, type: "success" },
      ]);

      addHistoryEntry({
        createdAt: Date.now(),
        prompt: options.prompt,
        model,
        files: collectedFiles.map((f) => ({ path: f.path, action: f.action })),
        buildTimeMs: duration,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setConsoleLogs((prev) => [...prev, { text: "> Build cancelled.", type: "info" }]);
      } else {
        setOutput({ error: "Full app generation failed. Please try again." });
        setConsoleLogs((prev) => [...prev, { text: "> Error: Full app generation failed", type: "error" }]);
      }
    }

    clearTimeout(stepTimer1);
    clearTimeout(stepTimer2);
    clearTimeout(stepTimer3);
    setLoading(false);
    setLoadingStep(0);
    setFullAppLoading(false);
    setIsBuildRunning(false);
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
  const hasFiles = Boolean(output?.files?.length);

  // Streaming code tab: type out active file content when loading
  // STREAMING_CHUNKS: number of equal-sized steps to stream the file over ~2s at 16ms/tick
  const STREAMING_CHUNKS = 120;
  useEffect(() => {
    if (loading && activeFile) {
      setStreamedCodeContent("");
      const content = activeFile.content;
      let idx = 0;
      const tick = () => {
        idx += Math.max(1, Math.floor(content.length / STREAMING_CHUNKS));
        setStreamedCodeContent(content.slice(0, idx));
        if (idx < content.length) {
          streamedCodeTimerRef.current = setTimeout(tick, 16);
        } else {
          setStreamedCodeContent(content);
        }
      };
      streamedCodeTimerRef.current = setTimeout(tick, 40);
      return () => {
        if (streamedCodeTimerRef.current) clearTimeout(streamedCodeTimerRef.current);
      };
    } else if (!loading && activeFile) {
      setStreamedCodeContent(activeFile.content);
    }
  }, [loading, activeFile]);

  // Left panel drag-to-resize handlers
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isDraggingPanelRef.current) return;
      const delta = e.clientX - dragStartXRef.current;
      const newWidth = Math.min(480, Math.max(220, dragStartWidthRef.current + delta));
      setLeftPanelWidth(newWidth);
    }
    function onMouseUp() {
      if (!isDraggingPanelRef.current) return;
      isDraggingPanelRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      try {
        localStorage.setItem("zivo_left_panel_width", String(leftPanelWidth));
      } catch { /* ignore */ }
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [leftPanelWidth]);

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes recordPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); } 70% { box-shadow: 0 0 0 8px rgba(239,68,68,0); } }
        @keyframes cursorBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1.5rem", height: "48px", borderBottom: `1px solid ${COLORS.border}`, background: "#0a0b14", flexShrink: 0 }}>
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
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: loading ? COLORS.warning : COLORS.success, boxShadow: `0 0 6px ${loading ? COLORS.warning : COLORS.success}`, animation: loading ? "statusBlink 1.5s ease-in-out infinite" : "none" }} aria-hidden="true" />
            <span style={{ fontSize: "0.75rem", color: COLORS.textSecondary }} aria-live="polite" aria-label={loading ? "Building project" : "Ready to build"}>{loading ? "Building..." : "Ready"}</span>
            <button
              className="zivo-btn"
              onClick={() => setChatOpen((o) => !o)}
              title="AI Chat"
              style={{ padding: "0.3rem 0.65rem", background: chatOpen ? "rgba(99,102,241,0.15)" : COLORS.bgCard, border: `1px solid ${chatOpen ? "rgba(99,102,241,0.4)" : COLORS.border}`, borderRadius: "6px", color: chatOpen ? COLORS.accent : COLORS.textSecondary, cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.35rem" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Chat
            </button>
            {supabaseUserEmail ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: COLORS.accentGradient, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer" }} title={supabaseUserEmail}>
                  {supabaseUserEmail.charAt(0).toUpperCase()}
                </div>
                <button
                  className="zivo-btn"
                  onClick={() => {
                    localStorage.removeItem("zivo_supabase_token");
                    setSupabaseToken(null);
                    setSupabaseUserEmail(null);
                    setSavedProjectId(null);
                  }}
                  style={{ padding: "0.3rem 0.65rem", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: "6px", color: COLORS.textMuted, cursor: "pointer", fontSize: "0.75rem" }}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <a
                href="/auth?next=/ai"
                style={{ padding: "0.3rem 0.75rem", background: COLORS.accentGradient, borderRadius: "6px", color: "#fff", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
              >
                Sign In
              </a>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* Left Panel */}
          <div style={{ width: leftPanelCollapsed ? 0 : `${leftPanelWidth}px`, flexShrink: 0, display: "flex", flexDirection: "column", borderRight: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, overflow: "hidden", transition: leftPanelCollapsed ? "width 0.2s ease" : "none", position: "relative" }}>

            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>

              {/* Mode Switcher */}
              <div style={{ display: "flex", gap: "4px", marginBottom: "1.25rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "4px" }}>
                {([
                  ["code", "Code Builder"],
                  ["security", "Security"],
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
                    style={{ flex: 1, padding: "0.35rem 0.5rem", borderRadius: "7px", border: "none", background: mode === m ? (m === "security" ? "linear-gradient(135deg,#f97316,#ef4444)" : COLORS.accentGradient) : "transparent", color: mode === m ? "#fff" : COLORS.textSecondary, cursor: "pointer", fontSize: "0.8125rem", fontWeight: mode === m ? 600 : 400, transition: "background 0.2s, color 0.2s" }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* ── Code Builder Mode ── */}
              {mode === "code" && (<>

              {/* Header */}
              <div style={{ marginBottom: "1.25rem", textAlign: "center" }}>
                <h1 style={{ fontSize: "1.375rem", fontWeight: 700, margin: "0 0 0.25rem", letterSpacing: "-0.02em" }}>What will you build today?</h1>
                <p style={{ fontSize: "0.8125rem", color: COLORS.textSecondary, margin: "0 0 0.75rem" }}>Describe what to build — ZIVO AI generates the full code instantly</p>
                <ModelSelector task="code" value={model} onChange={setModel} />
              </div>

              {/* Prompt / Plan / Templates / Workflows / Generate / Blueprint / Projects Tabs */}
              <div style={{ display: "flex", gap: "4px", marginBottom: "0.875rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "3px" }}>
                {([
                  ["prompt", "Prompt"],
                  ["plan", "Plan"],
                  ["templates", "Templates"],
                  ["workflows", "Workflows"],
                  ["generate", "Generate"],
                  ["blueprint", "Blueprint"],
                  ["projects", "Projects"],
                ] as const).map(([tab, label]) => (
                  <button
                    key={tab}
                    className="zivo-btn"
                    onClick={() => setActiveLeftTab(tab)}
                    style={{ flex: 1, padding: "0.35rem 0.5rem", borderRadius: "6px", border: "none", background: activeLeftTab === tab ? COLORS.accentGradient : "transparent", color: activeLeftTab === tab ? "#fff" : COLORS.textSecondary, cursor: "pointer", fontSize: "0.8125rem", fontWeight: activeLeftTab === tab ? 600 : 400, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem" }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Plan Viewer (structured ArchitecturePlan) */}
              {activeLeftTab === "plan" && (
                <div style={{ animation: "fadeIn 0.3s ease" }}>
                  {(isPlanLoading || planLoading) && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "1rem", color: COLORS.textSecondary, fontSize: "0.8125rem" }}>
                      <span style={{ display: "inline-block", width: "14px", height: "14px", border: "2px solid rgba(139,92,246,0.3)", borderTop: "2px solid #8b5cf6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      Generating architecture plan…
                    </div>
                  )}
                  {planData && !isPlanLoading && !planLoading && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {/* Project type badge */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <span style={{ padding: "0.25rem 0.75rem", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "20px", fontSize: "0.8125rem", fontWeight: 700, color: COLORS.accent }}>{planData.projectType}</span>
                        <span style={{ padding: "0.2rem 0.6rem", background: planData.complexity === "complex" ? "rgba(239,68,68,0.12)" : planData.complexity === "medium" ? "rgba(245,158,11,0.12)" : "rgba(16,185,129,0.12)", border: `1px solid ${planData.complexity === "complex" ? "rgba(239,68,68,0.3)" : planData.complexity === "medium" ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.3)"}`, borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600, color: planData.complexity === "complex" ? COLORS.error : planData.complexity === "medium" ? COLORS.warning : COLORS.success, textTransform: "capitalize" }}>{planData.complexity}</span>
                        <span style={{ fontSize: "0.75rem", color: COLORS.textMuted }}>~{planData.estimatedFiles} files</span>
                      </div>

                      {/* Tech stack */}
                      {planData.techStack.length > 0 && (
                        <div>
                          <div style={{ fontSize: "0.7rem", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: "0.35rem" }}>Tech Stack</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                            {planData.techStack.map((t, i) => (
                              <span key={i} title={t.purpose} style={{ padding: "0.2rem 0.55rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "6px", fontSize: "0.75rem", color: COLORS.textSecondary }}>{t.name}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pages */}
                      {planData.pages.length > 0 && (
                        <div>
                          <div style={{ fontSize: "0.7rem", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: "0.35rem" }}>Pages ({planData.pages.length})</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            {planData.pages.map((p, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", padding: "0.35rem 0.5rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "6px" }}>
                                <code style={{ fontSize: "0.7rem", color: COLORS.accent, fontFamily: "monospace", flexShrink: 0, marginTop: "1px" }}>{p.path}</code>
                                <span style={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>{p.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Auth */}
                      {planData.auth.required && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.6rem", background: "rgba(99,102,241,0.06)", border: `1px solid rgba(99,102,241,0.15)`, borderRadius: "6px", fontSize: "0.75rem" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLORS.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          <span style={{ color: COLORS.textSecondary }}>Auth: <strong style={{ color: COLORS.textPrimary }}>{planData.auth.provider}</strong></span>
                          {planData.auth.methods.map((m) => <span key={m} style={{ padding: "0 5px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", color: COLORS.textMuted }}>{m}</span>)}
                        </div>
                      )}

                      {/* Third-party services */}
                      {planData.thirdPartyServices.length > 0 && (
                        <div>
                          <div style={{ fontSize: "0.7rem", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: "0.35rem" }}>Services</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                            {planData.thirdPartyServices.map((s, i) => (
                              <span key={i} style={{ padding: "0.2rem 0.55rem", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "6px", fontSize: "0.75rem", color: COLORS.success }}>{s}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Build This Plan button */}
                      <button
                        className="zivo-btn"
                        onClick={() => { setActiveLeftTab("prompt"); handleBuild(); }}
                        disabled={loading}
                        style={{ width: "100%", padding: "0.55rem", background: COLORS.accentGradient, border: "none", borderRadius: "8px", color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "0.875rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", marginTop: "0.25rem" }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                        Build This Plan ▶
                      </button>
                    </div>
                  )}
                  {!planData && !isPlanLoading && !planLoading && (
                    <div style={{ textAlign: "center", padding: "1.5rem", color: COLORS.textMuted, fontSize: "0.8125rem" }}>
                      Click <strong style={{ color: COLORS.textSecondary }}>Plan</strong> to generate an architecture plan for your project.
                    </div>
                  )}
                  {/* Legacy PlanViewer fallback for older plan type */}
                  {!planData && !isPlanLoading && !planLoading && plan && <PlanViewer plan={plan} isLoading={isPlanLoading} />}
                </div>
              )}

              {/* Templates Tab */}
              {activeLeftTab === "templates" && (
                <div style={{ animation: "fadeIn 0.3s ease" }}>
                  <div style={{ fontSize: "0.7rem", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: "0.75rem" }}>Quick Start Templates</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {TEMPLATE_CARDS.map((tpl) => (
                      <div
                        key={tpl.label}
                        className="zivo-file"
                        style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "0.75rem", cursor: "pointer", transition: "border-color 0.15s, background 0.15s" }}
                        onClick={() => { setPrompt(tpl.prompt); setActiveLeftTab("prompt"); }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setPrompt(tpl.prompt); setActiveLeftTab("prompt"); } }}
                        aria-label={`Use template: ${tpl.label}`}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", color: COLORS.accent }}><Icon name={tpl.iconName} size={16} /></span>
                          <span style={{ fontWeight: 600, fontSize: "0.875rem", color: COLORS.textPrimary }}>{tpl.label}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: "0.75rem", color: COLORS.textSecondary, lineHeight: 1.5 }}>{tpl.description}</p>
                        <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.35rem" }}>
                          <button
                            className="zivo-btn"
                            onClick={(e) => { e.stopPropagation(); setPrompt(tpl.prompt); setActiveLeftTab("prompt"); }}
                            style={{ padding: "0.25rem 0.6rem", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: "20px", color: COLORS.accent, cursor: "pointer", fontSize: "0.7rem", fontWeight: 600 }}
                          >
                            Use Template
                          </button>
                          <button
                            className="zivo-btn"
                            onClick={(e) => { e.stopPropagation(); setPrompt(tpl.prompt); setActiveLeftTab("prompt"); handleBuild(tpl.prompt); }}
                            style={{ padding: "0.25rem 0.6rem", background: COLORS.accentGradient, border: "none", borderRadius: "20px", color: "#fff", cursor: "pointer", fontSize: "0.7rem", fontWeight: 600 }}
                          >
                            Build Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: "1rem", textAlign: "center" }}>
                    <a href="/component-library" style={{ fontSize: "0.75rem", color: COLORS.accent, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                      Browse Component Library →
                    </a>
                  </div>
                </div>
              )}

              {/* Workflows Tab */}
              {activeLeftTab === "workflows" && (
                <div style={{ animation: "fadeIn 0.3s ease" }}>
                  <div style={{ fontSize: "0.7rem", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: "0.75rem" }}>Automated Workflows</div>
                  <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: "12px", padding: "1.25rem", textAlign: "center" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>⚡</div>
                    <div style={{ fontWeight: 600, color: COLORS.textPrimary, marginBottom: "0.4rem", fontSize: "0.9375rem" }}>Visual Workflow Builder</div>
                    <p style={{ fontSize: "0.8125rem", color: COLORS.textSecondary, margin: "0 0 1rem", lineHeight: 1.6 }}>
                      Chain AI actions, set triggers, and automate your build pipeline with a drag-and-drop workflow editor.
                    </p>
                    <a
                      href="/workflow"
                      className="zivo-btn"
                      style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1.25rem", background: COLORS.accentGradient, color: "#fff", borderRadius: "8px", textDecoration: "none", fontSize: "0.8125rem", fontWeight: 600 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                      Open Workflow Builder
                    </a>
                  </div>
                </div>
              )}

              {/* Generate Tab — quick-generate buttons */}
              {activeLeftTab === "generate" && (
                <div style={{ animation: "fadeIn 0.3s ease" }}>
                  <div style={{ fontSize: "0.7rem", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: "0.75rem" }}>Quick Generate</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {([
                      { icon: "🏗️", label: "Full App", description: "Generate all pages, auth, db, and deployment config", action: () => setFullAppModalOpen(true) },
                      { icon: "🔐", label: "Add Auth", description: "Login, signup, forgot password + middleware", action: () => { setPrompt("Add complete authentication system with login, signup, forgot-password pages, Supabase auth integration, and middleware to protect private routes."); setActiveLeftTab("prompt"); } },
                      { icon: "🗄️", label: "Add Database", description: "Supabase schema, types, and CRUD helpers", action: () => { setPrompt("Add a Supabase database layer with SQL schema migrations, TypeScript types, RLS policies, and CRUD helper functions for the app."); setActiveLeftTab("prompt"); } },
                      { icon: "🧩", label: "Component Library", description: "Button, Card, Modal, Table, and 10+ more", action: () => { setPrompt("Generate a complete shadcn/ui-compatible component library with Button, Card, Input, Badge, Modal, Table, Dropdown, Toast, Avatar, and Tabs components using Tailwind CSS."); setActiveLeftTab("prompt"); } },
                      { icon: "🚀", label: "Deploy Config", description: "Vercel, Docker, GitHub Actions, Cloudflare, Netlify", action: () => { setPrompt("Generate deployment configuration files for Vercel, Docker (multi-stage), GitHub Actions CI/CD pipeline, Cloudflare Pages, and Netlify."); setActiveLeftTab("prompt"); } },
                      { icon: "🎨", label: "Design System", description: "Theme tokens, Tailwind config, CSS variables", action: () => { setPrompt("Generate a complete design system with Tailwind config tokens, CSS custom properties, design tokens JSON, and a ThemeProvider component with dark mode toggle."); setActiveLeftTab("prompt"); } },
                    ] as const).map(({ icon, label, description, action }) => (
                      <button
                        key={label}
                        className="zivo-file"
                        onClick={action}
                        disabled={loading}
                        style={{ width: "100%", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "0.75rem", cursor: loading ? "not-allowed" : "pointer", textAlign: "left", opacity: loading ? 0.5 : 1, transition: "border-color 0.15s, background 0.15s" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                          <span style={{ fontSize: "1.125rem", lineHeight: 1 }}>{icon}</span>
                          <span style={{ fontWeight: 600, fontSize: "0.875rem", color: COLORS.textPrimary }}>{label}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: "0.75rem", color: COLORS.textSecondary, lineHeight: 1.5 }}>{description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Blueprint Panel */}
              {activeLeftTab === "blueprint" && (
                <div style={{ animation: "fadeIn 0.3s ease" }}>
                  <div style={{ fontSize: "0.7rem", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: "0.75rem" }}>App Blueprint</div>
                  <BlueprintPanel prompt={prompt} />
                </div>
              )}

              {/* Projects Tab — My Saved Projects */}
              {activeLeftTab === "projects" && (
                <div style={{ animation: "fadeIn 0.3s ease" }}>
                  <div style={{ fontSize: "0.7rem", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: "0.75rem" }}>My Projects</div>
                  {savedProjectId ? (
                    <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "10px", padding: "0.875rem", marginBottom: "0.875rem" }}>
                      <div style={{ fontSize: "0.75rem", color: COLORS.textMuted, marginBottom: "0.35rem" }}>Current Project (saved)</div>
                      <div style={{ fontSize: "0.8125rem", color: COLORS.accent, fontFamily: "monospace", wordBreak: "break-all", marginBottom: "0.5rem" }}>{savedProjectId}</div>
                      <div style={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                        This project is persisted in Supabase. Use the <strong style={{ color: COLORS.textPrimary }}>Continue Building</strong> input below the output to add features.
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", marginBottom: "0.875rem", textAlign: "center" }}>
                      <div style={{ fontSize: "0.8125rem", color: COLORS.textSecondary, marginBottom: "0.35rem" }}>No active saved project</div>
                      <div style={{ fontSize: "0.75rem", color: COLORS.textMuted }}>Build a project while authenticated to save it here.</div>
                    </div>
                  )}
                  <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem" }}>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: COLORS.textPrimary, marginBottom: "0.35rem" }}>How It Works</div>
                    <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.75rem", color: COLORS.textSecondary, lineHeight: 1.8 }}>
                      <li>Sign in with Supabase to enable project persistence.</li>
                      <li>After each build, your project files are saved automatically.</li>
                      <li>Use <strong style={{ color: COLORS.textPrimary }}>Continue Building</strong> to patch the project iteratively.</li>
                      <li>All projects default to <strong style={{ color: COLORS.textPrimary }}>public</strong> visibility.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Conversation History Chat Bubbles */}
              {activeLeftTab === "prompt" && conversationHistory.length > 0 && (
                <div style={{ marginBottom: "0.875rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  <div style={{ fontSize: "0.7rem", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Build History</div>
                  {conversationHistory.map((msg, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                        animation: "fadeIn 0.3s ease",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "88%",
                          padding: "0.5rem 0.75rem",
                          borderRadius: msg.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                          background: msg.role === "user" ? "rgba(99,102,241,0.2)" : COLORS.bgCard,
                          border: `1px solid ${msg.role === "user" ? "rgba(99,102,241,0.35)" : COLORS.border}`,
                          fontSize: "0.8rem",
                          color: msg.role === "user" ? COLORS.textPrimary : COLORS.textSecondary,
                          lineHeight: 1.5,
                          wordBreak: "break-word",
                        }}
                      >
                        {msg.content.length > MAX_CHAT_HISTORY_DISPLAY_LENGTH ? msg.content.slice(0, MAX_CHAT_HISTORY_DISPLAY_LENGTH) + "…" : msg.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Continue Building section header */}
              {activeLeftTab === "prompt" && buildIterationCount > 0 && (
                <div style={{ marginBottom: "0.625rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{ height: "1px", flex: 1, background: COLORS.border }} />
                  <span style={{ fontSize: "0.65rem", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, flexShrink: 0 }}>Continue Building</span>
                  <div style={{ height: "1px", flex: 1, background: COLORS.border }} />
                </div>
              )}

              {/* Unified Prompt Box */}
              {activeLeftTab === "prompt" && (
              <div style={{ marginBottom: "0.875rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "14px", overflow: "hidden" }}>
                {/* Textarea */}
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
                  placeholder="Build a complete e-commerce app with product listings, cart, and Stripe checkout…"
                  maxLength={2000}
                  style={{ width: "100%", minHeight: "100px", background: "transparent", border: "none", borderRadius: 0, padding: "0.875rem 0.875rem 0.25rem", resize: "none", color: COLORS.textPrimary, fontSize: "0.875rem", lineHeight: 1.6, outline: "none", boxSizing: "border-box" }}
                />
                {/* Toolbar row */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.625rem 0.625rem", borderTop: `1px solid ${COLORS.border}` }}>
                  {/* Attachment button */}
                  <button
                    className="zivo-btn"
                    title="Attach file (coming soon)"
                    style={{ width: "30px", height: "30px", borderRadius: "7px", background: "transparent", border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, cursor: "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "1rem" }}
                  >
                    +
                  </button>
                  {/* Model selector */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <select
                      className="zivo-select"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      style={{ appearance: "none", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: "20px", color: COLORS.accent, padding: "0.25rem 1.5rem 0.25rem 0.625rem", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                    >
                      {MODELS.map((m) => (
                        <option key={m.value} value={m.value} style={{ background: COLORS.bgPanel }}>{m.label}</option>
                      ))}
                    </select>
                    <span style={{ position: "absolute", right: "0.45rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: "0.6rem", color: COLORS.accent }}>▾</span>
                  </div>
                  {/* Voice input (Web Speech API) */}
                  <button
                    className="zivo-btn"
                    onClick={handleVoiceInput}
                    title={isRecording ? "Stop recording" : "Voice input"}
                    style={{ width: "30px", height: "30px", borderRadius: "7px", background: isRecording ? "rgba(239,68,68,0.15)" : "transparent", border: `1px solid ${isRecording ? "rgba(239,68,68,0.4)" : COLORS.border}`, color: isRecording ? "#ef4444" : COLORS.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", animation: isRecording ? "recordPulse 1.5s infinite" : "none", flexShrink: 0 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                  </button>
                  {/* Voice input (AI transcription) */}
                  <VoiceInput
                    onTranscription={(text) => { setPrompt((prev) => prev ? `${prev} ${text}` : text); }}
                  />
                  <div style={{ flex: 1 }} />
                  {/* Char count */}
                  <span style={{ fontSize: "0.68rem", color: COLORS.textMuted, flexShrink: 0 }}>{prompt.length}/2000</span>
                  {/* Plan button */}
                  <button
                    className="zivo-btn"
                    onClick={handlePlan}
                    disabled={planLoading || !prompt.trim()}
                    title="Generate a plan before building"
                    style={{ padding: "0.3rem 0.65rem", borderRadius: "20px", background: planLoading ? "rgba(139,92,246,0.2)" : "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)", color: "#8b5cf6", cursor: planLoading || !prompt.trim() ? "not-allowed" : "pointer", fontSize: "0.75rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem", flexShrink: 0 }}
                  >
                    {planLoading ? (
                      <span style={{ display: "inline-block", width: "11px", height: "11px", border: "2px solid rgba(139,92,246,0.3)", borderTop: "2px solid #8b5cf6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    ) : (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                    )}
                    Plan
                  </button>
                  {/* Build Now button */}
                  <button
                    className="zivo-btn"
                    onClick={() => handleBuild()}
                    disabled={loading || !prompt.trim()}
                    style={{ padding: "0.3rem 0.875rem", borderRadius: "20px", background: loading || !prompt.trim() ? "rgba(99,102,241,0.3)" : COLORS.accentGradient, color: "#fff", border: "none", cursor: loading || !prompt.trim() ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.3rem", flexShrink: 0 }}
                  >
                    {loading ? (
                      <span style={{ display: "inline-block", width: "11px", height: "11px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    ) : (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    )}
                    {loading ? "Building…" : buildIterationCount > 0 ? `Update ▶ (iter. ${buildIterationCount + 1})` : "Build now ▶"}
                  </button>
                  {/* Build Full App button */}
                  <button
                    className="zivo-btn"
                    onClick={() => setFullAppModalOpen(true)}
                    disabled={loading}
                    title="Generate a complete multi-page app"
                    style={{ padding: "0.3rem 0.875rem", borderRadius: "20px", background: "linear-gradient(135deg, #f59e0b, #ef4444)", color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.3rem", flexShrink: 0, opacity: loading ? 0.5 : 1 }}
                  >
                    <span>⚡</span>
                    Full App
                  </button>
                </div>
              </div>
              )}
              {/* or start from row + Start Fresh */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.75rem", color: COLORS.textMuted, flexShrink: 0 }}>or start from</span>
                {[
                  { emoji: "🎨", label: "Figma" },
                  { emoji: "🐙", label: "GitHub" },
                  { emoji: "📋", label: "Team template" },
                ].map((item) => (
                  <button
                    key={item.label}
                    className="zivo-chip"
                    title={`${item.label} import (coming soon)`}
                    style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.25rem 0.6rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "20px", color: COLORS.textSecondary, cursor: "default", fontSize: "0.75rem" }}
                  >
                    {item.emoji} {item.label}
                  </button>
                ))}
                {buildIterationCount > 0 && (
                  <span style={{ marginLeft: "auto", padding: "0.2rem 0.55rem", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "20px", fontSize: "0.7rem", fontWeight: 700, color: COLORS.success }}>
                    Iteration {buildIterationCount}
                  </span>
                )}
                <button
                  className="zivo-btn"
                  onClick={handleStartFresh}
                  title="Clear project memory and start a new project"
                  style={{ marginLeft: buildIterationCount > 0 ? "0" : "auto", padding: "0.25rem 0.6rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "20px", color: "#ef4444", cursor: "pointer", fontSize: "0.7rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem", flexShrink: 0 }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                  Start Fresh
                </button>
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

              {/* Quick Prompts — Lovable-style text chips with "+" prefix */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "0.875rem" }}>
                {PROMPT_SUGGESTIONS.map((ps, i) => (
                  <button
                    key={i}
                    className="zivo-chip"
                    onClick={() => setPrompt(ps)}
                    style={{ display: "flex", alignItems: "flex-start", gap: "0.35rem", padding: "0.35rem 0.65rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textSecondary, cursor: "pointer", fontSize: "0.72rem", transition: "background 0.15s, border-color 0.15s", textAlign: "left", lineHeight: 1.4 }}
                    title={ps}
                  >
                    <span style={{ color: COLORS.accent, fontWeight: 700, flexShrink: 0 }}>+</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" as const }}>
                      {ps.length > MAX_PROMPT_SUGGESTION_LENGTH ? ps.slice(0, MAX_PROMPT_SUGGESTION_LENGTH) + "…" : ps}
                    </span>
                  </button>
                ))}
              </div>

              {/* Quick Prompt icon chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.875rem" }}>
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

              {/* Template Shortcuts grid */}
              {!prompt.trim() && (
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.7rem", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: "0.5rem" }}>Templates</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.35rem" }}>
                    {TEMPLATE_SHORTCUTS.map((t) => (
                      <button
                        key={t.label}
                        className="zivo-chip"
                        onClick={() => setPrompt(t.prompt)}
                        title={t.prompt}
                        style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.65rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textSecondary, cursor: "pointer", fontSize: "0.75rem", transition: "background 0.15s, border-color 0.15s", textAlign: "left" }}
                      >
                        <span style={{ fontSize: "0.875rem", flexShrink: 0 }}>{t.icon}</span>
                        <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Template Selector — shown when prompt is empty */}
              {!prompt.trim() && (
                <div style={{ marginBottom: "1rem" }}>
                  <TemplateSelector
                    onSelect={(p) => setPrompt(p)}
                    onSubmit={(p) => { setPrompt(p); handleBuild(p); }}
                  />
                </div>
              )}

              {/* Plan Panel */}
              {planOpen && (
                <div style={{ marginBottom: "1rem", background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "12px", overflow: "hidden", animation: "fadeIn 0.3s ease" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.65rem 0.875rem", borderBottom: "1px solid rgba(139,92,246,0.15)" }}>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#8b5cf6", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                      Build Plan
                    </span>
                    <button
                      className="zivo-btn"
                      onClick={() => setPlanOpen(false)}
                      style={{ background: "transparent", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: "0.8rem", padding: "0 0.25rem" }}
                    >
                      ✕
                    </button>
                  </div>
                  <div style={{ padding: "0.875rem" }}>
                    {planLoading ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: COLORS.textSecondary, fontSize: "0.8125rem" }}>
                        <span style={{ display: "inline-block", width: "14px", height: "14px", border: "2px solid rgba(139,92,246,0.3)", borderTop: "2px solid #8b5cf6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                        Generating plan…
                      </div>
                    ) : planResult ? (
                      <>
                        <div style={{ fontSize: "0.8125rem", color: COLORS.textPrimary, lineHeight: 1.75 }}>
                          {planResult.split("\n").map((line, i) => {
                            const trimmed = line.trimStart();
                            const indent = line.length - trimmed.length;
                            const bold = trimmed.replace(/\*\*(.+?)\*\*/g, "$1");
                            const isHeading = /^\*\*.*\*\*$/.test(trimmed) || trimmed.startsWith("##") || trimmed.startsWith("#");
                            const displayLine = bold.replace(/^#+\s*/, "");
                            return (
                              <div key={i} style={{ paddingLeft: `${indent * 0.35}rem`, fontWeight: isHeading ? 700 : 400, color: isHeading ? COLORS.textPrimary : COLORS.textSecondary, marginBottom: isHeading ? "0.15rem" : 0 }}>
                                {displayLine || "\u00A0"}
                              </div>
                            );
                          })}
                        </div>
                        <button
                          className="zivo-btn"
                          onClick={() => { setPlanOpen(false); handleBuild(); }}
                          disabled={loading}
                          style={{ marginTop: "0.875rem", width: "100%", padding: "0.55rem", background: COLORS.accentGradient, border: "none", borderRadius: "8px", color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "0.875rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                          Build from Plan ▶
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Connected Project Panel */}
              <div style={{ marginBottom: "1rem" }}>
                {connectedGithubRepo ? (
                  <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "0.75rem 1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: COLORS.textSecondary, display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                        Connected Project
                      </span>
                      <a href="/connectors" style={{ fontSize: "0.7rem", color: COLORS.accent, textDecoration: "none" }}>Change</a>
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: COLORS.textPrimary, fontWeight: 500, marginBottom: "0.5rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{connectedGithubRepo}</div>
                    <button
                      className="zivo-btn"
                      onClick={handleGithubPush}
                      disabled={githubPushing || !output?.files?.length}
                      style={{ width: "100%", padding: "0.4rem 0.75rem", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.35)", borderRadius: "6px", color: COLORS.accent, cursor: githubPushing || !output?.files?.length ? "not-allowed" : "pointer", fontSize: "0.8rem", fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", opacity: !output?.files?.length ? 0.5 : 1 }}
                    >
                      {githubPushing ? (
                        <><span style={{ display: "inline-block", width: "12px", height: "12px", border: "2px solid rgba(99,102,241,0.3)", borderTop: "2px solid currentColor", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Pushing…</>
                      ) : (
                        <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" x2="12" y1="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg> Push to GitHub</>
                      )}
                    </button>
                    {githubPushResult && (
                      <div style={{ marginTop: "0.5rem", fontSize: "0.775rem", color: COLORS.success, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        Pushed!{" "}<a href={githubPushResult} target="_blank" rel="noreferrer" style={{ color: COLORS.success }}>View repo</a>
                      </div>
                    )}
                    {githubPushError && (
                      <div style={{ marginTop: "0.5rem", fontSize: "0.775rem", color: COLORS.error }}>{githubPushError}</div>
                    )}
                  </div>
                ) : (
                  <a href="/connectors" style={{ fontSize: "0.8125rem", color: COLORS.textMuted, textDecoration: "none", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                    Connect a GitHub repo →
                  </a>
                )}
              </div>

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
              {githubPushResult && !connectedGithubRepo && (
                <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", padding: "0.75rem", borderRadius: "8px", marginBottom: "0.75rem", animation: "fadeIn 0.3s ease", fontSize: "0.875rem" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",marginRight:"4px",verticalAlign:"middle"}}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>{" "}Pushed:{" "}
                  <a href={githubPushResult} target="_blank" rel="noreferrer" style={{ color: COLORS.success }}>{githubPushResult}</a>
                </div>
              )}
              {githubPushError && !connectedGithubRepo && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: COLORS.error, padding: "0.75rem", borderRadius: "8px", marginBottom: "0.75rem", fontSize: "0.875rem" }}>
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",marginRight:"4px",verticalAlign:"middle"}}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>{githubPushError}</>
                </div>
              )}
              {output?.error && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: COLORS.error, padding: "0.75rem", borderRadius: "8px", marginBottom: "0.75rem", fontSize: "0.875rem" }}>
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",marginRight:"4px",verticalAlign:"middle"}}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>{output.error}</>
                </div>
              )}
              {/* ── Build Summary Card (Lovable-style) ── */}
              {hasFiles && !loading && output?.summary && (() => {
                const buildFiles = output?.files ?? [];
                const routeCount = buildFiles.filter(f => f.path.includes("/app/") || f.path.includes("/pages/") || f.path.match(/page\.(tsx?|jsx?)$/)).length;
                const componentCount = buildFiles.filter(f => f.path.includes("/components/") || (f.path.match(/\.(tsx?)$/) && !f.path.includes("/api/") && !f.path.match(/page\.(tsx?|jsx?)$/))).length;
                return (
                <div style={{ marginBottom: "0.875rem", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "12px", overflow: "hidden", animation: "fadeIn 0.4s ease" }}>
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 0.875rem", borderBottom: "1px solid rgba(16,185,129,0.12)", background: "rgba(16,185,129,0.04)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.success }}>Build complete</span>
                    <div style={{ flex: 1 }} />
                    <span style={{ fontSize: "0.65rem", padding: "1px 6px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "20px", color: COLORS.success, fontWeight: 700 }}>
                      {buildFiles.length} files
                    </span>
                  </div>
                  {/* Summary text */}
                  <div style={{ padding: "0.625rem 0.875rem", fontSize: "0.8125rem", color: COLORS.textSecondary, lineHeight: 1.55 }}>
                    {output.summary}
                  </div>
                  {/* Stats row */}
                  <div style={{ padding: "0 0.875rem 0.625rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {[
                      { label: "Files", value: buildFiles.length, color: COLORS.accent },
                      { label: "Routes", value: routeCount, color: "#8b5cf6" },
                      { label: "Components", value: componentCount, color: COLORS.warning },
                    ].map(({ label, value, color }) => value > 0 && (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.2rem 0.6rem", background: "rgba(255,255,255,0.04)", border: `1px solid ${COLORS.border}`, borderRadius: "20px" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color }}>{value}</span>
                        <span style={{ fontSize: "0.7rem", color: COLORS.textMuted }}>{label}</span>
                      </div>
                    ))}
                  </div>
                  {/* View in Files link */}
                  <button
                    className="zivo-btn"
                    onClick={() => setActiveRightTab("files")}
                    style={{ width: "100%", padding: "0.45rem", background: "transparent", border: "none", borderTop: "1px solid rgba(16,185,129,0.12)", color: COLORS.textSecondary, cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                    <span>View in Files panel →</span>
                  </button>
                </div>
                );
              })()}
              {/* File count hint (files are in the right panel) — shown only when no summary */}
              {hasFiles && !loading && !output?.summary && (
                <div style={{ marginBottom: "0.5rem", padding: "0.5rem 0.625rem", background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: "8px", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: COLORS.textSecondary, animation: "fadeIn 0.3s ease" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLORS.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                  <span><strong style={{ color: COLORS.accent }}>{output?.files?.length ?? 0} files</strong> generated — view in the <strong style={{ color: COLORS.textPrimary }}>Files</strong> panel →</span>
                </div>
              )}

              {/* ── Saved Project ID badge ── */}
              {savedProjectId && !loading && (
                <div style={{ marginBottom: "0.75rem", padding: "0.625rem 0.75rem", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "8px", animation: "fadeIn 0.3s ease" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLORS.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: COLORS.success }}>Saved ✓</span>
                    </div>
                    {supabaseToken && (
                      <button
                        className="zivo-btn"
                        onClick={handleShare}
                        disabled={sharing}
                        style={{ padding: "0.2rem 0.55rem", background: sharing ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.35)", borderRadius: "5px", color: COLORS.accent, cursor: sharing ? "not-allowed" : "pointer", fontSize: "0.7rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}
                      >
                        {sharing ? (
                          <><span style={{ width: "10px", height: "10px", border: "2px solid rgba(99,102,241,0.3)", borderTopColor: COLORS.accent, borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /></>
                        ) : (
                          <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg> Share</>
                        )}
                      </button>
                    )}
                  </div>
                  {shareUrl ? (
                    <div style={{ fontSize: "0.7rem", color: COLORS.success, wordBreak: "break-all" }}>
                      Link copied! <a href={shareUrl} target="_blank" rel="noreferrer" style={{ color: COLORS.success, fontWeight: 600 }}>{shareUrl}</a>
                    </div>
                  ) : (
                    <div style={{ fontSize: "0.7rem", color: COLORS.textMuted, fontFamily: "monospace", wordBreak: "break-all" }}>ID: {savedProjectId}</div>
                  )}
                </div>
              )}
              {/* Continue Building in left sidebar (code mode) */}
              {hasFiles && !loading && mode === "code" && (
                <div style={{ marginBottom: "0.875rem", background: "rgba(99,102,241,0.05)", border: `1px solid rgba(99,102,241,0.18)`, borderRadius: "12px", overflow: "hidden", animation: "fadeIn 0.3s ease" }}>
                  {/* Card header */}
                  <div style={{ padding: "0.5rem 0.75rem 0.4rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={COLORS.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    <span style={{ fontSize: "0.7rem", color: COLORS.accent, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>Continue Building</span>
                    {buildIterationCount > 0 && (
                      <span style={{ marginLeft: "auto", fontSize: "0.65rem", padding: "1px 6px", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "20px", color: COLORS.accent, fontWeight: 700 }}>
                        iter. {buildIterationCount}
                      </span>
                    )}
                  </div>
                  <div style={{ padding: "0 0.625rem 0.625rem" }}>
                    <textarea
                      className="zivo-textarea"
                      value={continueInstruction}
                      onChange={(e) => setContinueInstruction(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                          e.preventDefault();
                          if (continueInstruction.trim()) {
                            const instruction = continueInstruction;
                            setContinueInstruction("");
                            handleBuild(instruction);
                          }
                        }
                      }}
                      placeholder="Add dark mode… Add auth with Supabase… Add a dashboard page…"
                      maxLength={1000}
                      style={{ width: "100%", minHeight: "56px", resize: "none", background: "rgba(255,255,255,0.03)", border: `1px solid rgba(99,102,241,0.15)`, borderRadius: "8px", color: COLORS.textPrimary, fontSize: "0.8125rem", lineHeight: 1.5, outline: "none", boxSizing: "border-box", padding: "0.5rem 0.625rem", marginBottom: "0.4rem" }}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span style={{ fontSize: "0.68rem", color: COLORS.textMuted }}>{continueInstruction.length}/1000</span>
                      <div style={{ flex: 1 }} />
                      <button
                        className="zivo-btn"
                        disabled={!continueInstruction.trim() || loading}
                        onClick={() => {
                          if (continueInstruction.trim()) {
                            const instruction = continueInstruction;
                            setContinueInstruction("");
                            handleBuild(instruction);
                          }
                        }}
                        style={{ padding: "0.35rem 0.875rem", background: continueInstruction.trim() ? COLORS.accentGradient : "rgba(99,102,241,0.15)", border: "none", borderRadius: "20px", color: "#fff", cursor: !continueInstruction.trim() || loading ? "not-allowed" : "pointer", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem", opacity: !continueInstruction.trim() || loading ? 0.5 : 1 }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              )}
              </>)}

              {/* ── Security Mode ── */}
              {mode === "security" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", animation: "fadeIn 0.3s ease" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>Security Scanner</h2>
                    </div>
                    <p style={{ fontSize: "0.8125rem", color: COLORS.textSecondary, margin: 0 }}>Paste code → scan → auto-fix vulnerabilities</p>
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: COLORS.textSecondary, display: "block", marginBottom: "0.35rem" }}>Language</label>
                    <select
                      className="zivo-select"
                      value={securityLanguage}
                      onChange={(e) => setSecurityLanguage(e.target.value)}
                      style={{ width: "100%", padding: "0.45rem 0.65rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textPrimary, fontSize: "0.8125rem", cursor: "pointer" }}
                    >
                      {["typescript", "javascript", "python", "go", "rust", "java", "php", "other"].map((lang) => (
                        <option key={lang} value={lang} style={{ background: COLORS.bgPanel }}>{lang.charAt(0).toUpperCase() + lang.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: COLORS.textSecondary, display: "block", marginBottom: "0.35rem" }}>Code</label>
                    <textarea
                      className="zivo-textarea"
                      value={securityCode}
                      onChange={(e) => setSecurityCode(e.target.value)}
                      placeholder="Paste your code here to scan for vulnerabilities..."
                      style={{ width: "100%", minHeight: "160px", resize: "vertical", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textPrimary, padding: "0.6rem 0.75rem", fontSize: "0.8125rem", fontFamily: "'JetBrains Mono','Fira Code',monospace" }}
                    />
                  </div>
                  {securityError && (
                    <div style={{ padding: "0.6rem 0.75rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: COLORS.error, fontSize: "0.8125rem" }}>{securityError}</div>
                  )}
                  <button
                    className="zivo-btn"
                    onClick={handleSecurityScan}
                    disabled={securityScanning || !securityCode.trim()}
                    style={{ width: "100%", padding: "0.65rem", background: securityScanning || !securityCode.trim() ? "rgba(249,115,22,0.3)" : "linear-gradient(135deg,#f97316,#ef4444)", color: "#fff", borderRadius: "8px", border: "none", cursor: securityScanning || !securityCode.trim() ? "not-allowed" : "pointer", fontSize: "0.875rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                  >
                    {securityScanning ? (
                      <><span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> Scanning…</>
                    ) : (
                      <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg> Scan for Vulnerabilities</>
                    )}
                  </button>
                  {securityScanResult && (
                    <>
                      <div style={{ padding: "0.75rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                          <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: COLORS.textPrimary }}>Security Score</span>
                          <span style={{ fontSize: "0.875rem", fontWeight: 700, color: securityScanResult.score >= 90 ? COLORS.success : securityScanResult.score >= 70 ? "#3b82f6" : securityScanResult.score >= 40 ? COLORS.warning : COLORS.error }}>{securityScanResult.score}/100</span>
                        </div>
                        <div style={{ height: "6px", background: COLORS.border, borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${securityScanResult.score}%`, borderRadius: "3px", background: securityScanResult.score >= 90 ? COLORS.success : securityScanResult.score >= 70 ? "#3b82f6" : securityScanResult.score >= 40 ? COLORS.warning : COLORS.error, transition: "width 0.6s ease" }} />
                        </div>
                        <div style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                          {(["critical","high","medium","low","info"] as const).map((sev) => {
                            const count = securityScanResult.issues.filter((i) => i.severity === sev).length;
                            if (!count) return null;
                            const sevColors: Record<string,string> = { critical:"#ef4444", high:"#f97316", medium:"#f59e0b", low:"#3b82f6", info:"#94a3b8" };
                            return <span key={sev} style={{ fontSize: "0.75rem", padding: "1px 6px", borderRadius: "4px", background: `${sevColors[sev]}22`, color: sevColors[sev], fontWeight: 600 }}>{count} {sev}</span>;
                          })}
                        </div>
                      </div>
                      <button
                        className="zivo-btn"
                        onClick={handleSecurityFix}
                        disabled={securityFixing}
                        style={{ width: "100%", padding: "0.65rem", background: securityFixing ? "rgba(16,185,129,0.3)" : "linear-gradient(135deg,#10b981,#059669)", color: "#fff", borderRadius: "8px", border: "none", cursor: securityFixing ? "not-allowed" : "pointer", fontSize: "0.875rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                      >
                        {securityFixing ? (
                          <><span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> Fixing…</>
                        ) : (
                          <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> Auto-Fix All Issues</>
                        )}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* ── Website Mode ── */}
              {mode === "website" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", animation: "fadeIn 0.3s ease" }}>
                  <div>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.25rem", letterSpacing: "-0.02em" }}>Website Builder v2</h2>
                    <p style={{ fontSize: "0.8125rem", color: COLORS.textSecondary, margin: 0 }}>Describe your website — ZIVO builds a real Next.js multi-page site with design tokens and multi-pass quality</p>
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
                  {websiteLoading && websitePassMessage && (
                    <div style={{ padding: "0.5rem 0.75rem", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "8px", fontSize: "0.8125rem", color: COLORS.accent }}>{websitePassMessage}</div>
                  )}
                  {websiteError && (
                    <div style={{ padding: "0.6rem 0.75rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: COLORS.error, fontSize: "0.8125rem" }}>{websiteError}</div>
                  )}
                  {websiteResult && (
                    <div style={{ padding: "0.75rem", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                        <div style={{ fontSize: "0.8125rem", color: COLORS.success, fontWeight: 600 }}>Website generated</div>
                        {websiteIteration > 1 && (
                          <span style={{ padding: "0.1rem 0.4rem", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "20px", fontSize: "0.65rem", fontWeight: 700, color: COLORS.accent }}>iteration {websiteIteration}</span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>{websiteResult.summary}</div>
                      <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: COLORS.textMuted }}>{websiteResult.files.length} file(s) generated</div>
                      <button
                        className="zivo-btn"
                        onClick={() => { setMode("code"); setActiveRightTab("files"); }}
                        style={{ marginTop: "0.6rem", padding: "0.35rem 0.6rem", fontSize: "0.75rem", borderRadius: "6px", border: `1px solid ${COLORS.border}`, background: COLORS.bgCard, color: COLORS.textPrimary, cursor: "pointer" }}
                      >
                        Open in Code Builder
                      </button>
                      <button
                        className="zivo-btn"
                        onClick={() => void startWebsiteLivePreview(websiteResult.files)}
                        disabled={websiteLivePreviewRunning}
                        style={{ marginTop: "0.45rem", padding: "0.35rem 0.6rem", fontSize: "0.75rem", borderRadius: "6px", border: `1px solid ${COLORS.border}`, background: COLORS.bgCard, color: COLORS.textPrimary, cursor: websiteLivePreviewRunning ? "not-allowed" : "pointer", opacity: websiteLivePreviewRunning ? 0.6 : 1 }}
                      >
                        {websiteLivePreviewRunning ? "Starting live runtime…" : websiteLivePreviewUrl ? "Restart Live Preview" : "Start Live Preview"}
                      </button>
                      {websiteLivePreviewStatus && (
                        <div style={{ marginTop: "0.45rem", fontSize: "0.72rem", color: COLORS.textSecondary }}>{websiteLivePreviewStatus}</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Mobile App Mode ── */}
              {mode === "mobile" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", animation: "fadeIn 0.3s ease" }}>
                  <div>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.25rem", letterSpacing: "-0.02em" }}>Mobile App Builder v2</h2>
                    <p style={{ fontSize: "0.8125rem", color: COLORS.textSecondary, margin: 0 }}>Describe your app — ZIVO generates a real Expo Router app with navigation, mock data, and multi-pass quality</p>
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
                  {mobileLoading && mobilePassMessage && (
                    <div style={{ padding: "0.5rem 0.75rem", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "8px", fontSize: "0.8125rem", color: COLORS.accent }}>{mobilePassMessage}</div>
                  )}
                  {mobileError && (
                    <div style={{ padding: "0.6rem 0.75rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: COLORS.error, fontSize: "0.8125rem" }}>{mobileError}</div>
                  )}
                  {mobileResult && (
                    <div>
                      <div style={{ padding: "0.75rem", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "8px", marginBottom: "0.75rem" }}>
                        <div style={{ fontSize: "0.8125rem", color: COLORS.success, fontWeight: 600, marginBottom: "0.35rem" }}>Mobile app generated</div>
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
              <div style={{ padding: "0.75rem 1rem", borderTop: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, flexShrink: 0 }}>
                {/* Vercel token input (shown when deploy is clicked and no token exists) */}
                {showVercelTokenInput && (
                  <div style={{ marginBottom: "0.625rem", padding: "0.625rem 0.75rem", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: "8px", animation: "fadeIn 0.2s ease" }}>
                    <div style={{ fontSize: "0.75rem", color: COLORS.textSecondary, marginBottom: "0.4rem" }}>
                      Enter your{" "}
                      <a href="https://vercel.com/account/tokens" target="_blank" rel="noreferrer" style={{ color: COLORS.accent }}>Vercel token</a>
                      {" "}to deploy:
                    </div>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <input
                        type="password"
                        value={vercelToken}
                        onChange={(e) => setVercelToken(e.target.value)}
                        placeholder="vercel_..."
                        style={{ flex: 1, padding: "0.4rem 0.6rem", background: "rgba(0,0,0,0.3)", border: `1px solid ${COLORS.border}`, borderRadius: "6px", color: COLORS.textPrimary, fontSize: "0.8125rem", outline: "none" }}
                      />
                      <button
                        className="zivo-btn"
                        onClick={() => {
                          if (vercelToken) {
                            try { localStorage.setItem("zivo_vercel_token", vercelToken); } catch { /* ignore */ }
                            setShowVercelTokenInput(false);
                            handleDeploy("vercel");
                          }
                        }}
                        disabled={!vercelToken.trim()}
                        style={{ padding: "0.4rem 0.75rem", background: COLORS.accentGradient, border: "none", borderRadius: "6px", color: "#fff", cursor: !vercelToken.trim() ? "not-allowed" : "pointer", fontSize: "0.8125rem", fontWeight: 600, flexShrink: 0 }}
                      >
                        Deploy
                      </button>
                      <button
                        className="zivo-btn"
                        onClick={() => setShowVercelTokenInput(false)}
                        style={{ padding: "0.4rem 0.6rem", background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: "6px", color: COLORS.textMuted, cursor: "pointer", fontSize: "0.8125rem" }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
                {/* Action row */}
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  {/* ZIP download */}
                  <button
                    className="zivo-btn"
                    onClick={handleDownload}
                    title="Download as ZIP"
                    style={{ flex: 1, padding: "0.45rem 0.5rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.textSecondary, cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem", transition: "border-color 0.15s" }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    <span>ZIP</span>
                  </button>
                  {/* GitHub push */}
                  <button
                    className="zivo-btn"
                    onClick={() => {
                      if (connectedGithubRepo) {
                        handleGithubPush();
                      } else {
                        setGithubModalOpen(true);
                      }
                    }}
                    disabled={githubPushing}
                    title="Push to GitHub"
                    style={{ flex: 1, padding: "0.45rem 0.5rem", background: githubPushing ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: "8px", color: COLORS.accent, cursor: githubPushing ? "not-allowed" : "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem" }}
                  >
                    {githubPushing ? (
                      <span style={{ display: "inline-block", width: "11px", height: "11px", border: "2px solid rgba(99,102,241,0.3)", borderTop: "2px solid currentColor", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                    )}
                    <span>{githubPushing ? "Pushing…" : "GitHub"}</span>
                  </button>
                  {/* Deploy */}
                  <button
                    className="zivo-btn"
                    onClick={() => handleDeploy("vercel")}
                    disabled={deploying}
                    title="Deploy to Vercel"
                    style={{ flex: 1, padding: "0.45rem 0.5rem", background: deploying ? "rgba(16,185,129,0.06)" : "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.28)", borderRadius: "8px", color: COLORS.success, cursor: deploying ? "not-allowed" : "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem" }}
                  >
                    {deploying ? (
                      <span style={{ display: "inline-block", width: "11px", height: "11px", border: "2px solid rgba(16,185,129,0.3)", borderTop: "2px solid currentColor", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                    )}
                    <span>{deploying ? "Deploying…" : "Deploy"}</span>
                  </button>
                  {/* Save / copy all */}
                  <button
                    className="zivo-btn"
                    onClick={() => {
                      const all = output?.files?.map((f) => `// ${f.path}\n${f.content}`).join("\n\n---\n\n") ?? "";
                      navigator.clipboard.writeText(all).then(() => {
                        setCopyLabel("saved");
                        setTimeout(() => setCopyLabel("save"), 2000);
                      }).catch(() => {});
                    }}
                    title="Copy all files to clipboard"
                    style={{ flex: 1, padding: "0.45rem 0.5rem", background: copyLabel === "saved" ? "rgba(16,185,129,0.12)" : "transparent", border: `1px solid ${copyLabel === "saved" ? "rgba(16,185,129,0.3)" : COLORS.border}`, borderRadius: "8px", color: copyLabel === "saved" ? COLORS.success : COLORS.textSecondary, cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem", transition: "background 0.2s, border-color 0.2s, color 0.2s" }}
                  >
                    {copyLabel === "saved" ? (
                      <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><span>Saved!</span></>
                    ) : (
                      <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/></svg><span>Save</span></>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Left Panel Drag Handle + Collapse Toggle */}
          <div style={{ position: "relative", width: "0px", flexShrink: 0 }}>
            {/* Drag handle */}
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                isDraggingPanelRef.current = true;
                dragStartXRef.current = e.clientX;
                dragStartWidthRef.current = leftPanelCollapsed ? 0 : leftPanelWidth;
                if (leftPanelCollapsed) setLeftPanelCollapsed(false);
                document.body.style.cursor = "ew-resize";
                document.body.style.userSelect = "none";
              }}
              style={{ position: "absolute", top: 0, left: "-2px", width: "4px", height: "100%", cursor: "ew-resize", zIndex: 10, background: "transparent" }}
              title="Drag to resize panel"
            />
            {/* Collapse/expand toggle */}
            <button
              onClick={() => setLeftPanelCollapsed((c) => !c)}
              title={leftPanelCollapsed ? "Expand panel" : "Collapse panel"}
              style={{ position: "absolute", top: "50%", left: "-12px", transform: "translateY(-50%)", width: "18px", height: "40px", background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textMuted, zIndex: 10, fontSize: "10px", padding: 0, transition: "background 0.15s, color 0.15s" }}
            >
              {leftPanelCollapsed ? "›" : "‹"}
            </button>
          </div>

          {/* Right Panel */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: COLORS.bg }}>

            {/* Preview Toolbar — Code Builder mode only */}
            {mode === "code" && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0 1rem", height: "48px", borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, flexShrink: 0 }}>
              {/* Tabs */}
              <div style={{ display: "flex", gap: "1px", background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "3px" }}>
                {(["preview", "code", "console"] as const).map((tab) => (
                  <button
                    key={tab}
                    className="zivo-tab"
                    onClick={() => setActiveTab(tab)}
                    style={{ padding: "0.25rem 0.7rem", borderRadius: "6px", border: "none", background: activeTab === tab ? COLORS.bgPanel : "transparent", color: activeTab === tab ? COLORS.textPrimary : COLORS.textMuted, cursor: "pointer", fontSize: "0.8rem", fontWeight: activeTab === tab ? 600 : 400, transition: "color 0.15s, background 0.15s", boxShadow: activeTab === tab ? `0 0 0 1px ${COLORS.border}` : "none" }}
                  >
                    {tab === "preview" && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", marginRight: "0.25rem", verticalAlign: "middle" }}><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>}{tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
                <button
                  className="zivo-tab"
                  onClick={() => setActiveTab("design")}
                  style={{ padding: "0.25rem 0.7rem", borderRadius: "6px", border: "none", background: activeTab === "design" ? COLORS.bgPanel : "transparent", color: activeTab === "design" ? COLORS.textPrimary : COLORS.textMuted, cursor: "pointer", fontSize: "0.8rem", fontWeight: activeTab === "design" ? 600 : 400, transition: "color 0.15s, background 0.15s", boxShadow: activeTab === "design" ? `0 0 0 1px ${COLORS.border}` : "none" }}
                >
                  Design
                </button>
                {showDiff && diffFiles.length > 0 && (
                  <button
                    className="zivo-tab"
                    onClick={() => setActiveTab("diff")}
                    style={{ padding: "0.25rem 0.7rem", borderRadius: "6px", border: "none", background: activeTab === "diff" ? COLORS.bgPanel : "transparent", color: activeTab === "diff" ? COLORS.textPrimary : COLORS.textMuted, cursor: "pointer", fontSize: "0.8rem", fontWeight: activeTab === "diff" ? 600 : 400, transition: "color 0.15s, background 0.15s", boxShadow: activeTab === "diff" ? `0 0 0 1px ${COLORS.border}` : "none" }}
                  >
                    Diff
                  </button>
                )}
              </div>

              {/* URL bar */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.2rem 0.65rem", maxWidth: "260px", marginLeft: "0.25rem" }}>
                {loading ? (
                  <span style={{ display: "inline-block", width: "9px", height: "9px", border: "2px solid rgba(99,102,241,0.3)", borderTop: `2px solid ${COLORS.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                ) : (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: output?.preview_html ? COLORS.success : COLORS.textMuted, flexShrink: 0 }}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                )}
                <span style={{ fontSize: "0.75rem", color: COLORS.textSecondary, fontFamily: "monospace", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {loading ? "Building…" : output?.preview_html ? "localhost:3000" : "No preview"}
                </span>
                {output?.preview_html && !loading && (
                  <span style={{ fontSize: "0.6rem", padding: "1px 5px", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "4px", color: COLORS.success, fontWeight: 700, flexShrink: 0 }}>Live</span>
                )}
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
              {output?.preview_html && (
                <button
                  className="zivo-btn"
                  onClick={() => { if (iframeRef.current) { const html = output?.preview_html ?? ""; iframeRef.current.srcdoc = html; } }}
                  title="Refresh preview"
                  style={{ width: "30px", height: "30px", borderRadius: "6px", border: "none", background: "transparent", color: COLORS.textMuted, cursor: "pointer", fontSize: "16px" }}
                >
                  ↻
                </button>
              )}

              {/* Design System button */}
              <button
                className="zivo-btn"
                onClick={() => setDesignSystemOpen(true)}
                title="Design System Generator"
                style={{ padding: "0.3rem 0.65rem", borderRadius: "6px", border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.textMuted, cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.35rem" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12.5" r="2.5"/></svg>
                <span>Design</span>
              </button>
              {/* HTML Snapshot button */}
              {(output?.preview_html || (output?.files?.length ?? 0) > 0) && (
                <button
                  className="zivo-btn"
                  onClick={() => {
                    const html = output?.preview_html ?? (output?.files?.length ? buildHTMLSnapshot(output.files) : null);
                    if (!html) return;
                    const blob = new Blob([html], { type: "text/html" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "snapshot.html";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  title="Download HTML Snapshot"
                  style={{ padding: "0.3rem 0.65rem", borderRadius: "6px", border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.textMuted, cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.35rem" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  <span>HTML Snapshot</span>
                </button>
              )}
              {/* Design Panel button (visual token editor) */}
              <button
                className="zivo-btn"
                onClick={() => setDesignPanelOpen((o) => !o)}
                title="Visual Design Panel (colors, fonts, spacing)"
                style={{ padding: "0.3rem 0.65rem", borderRadius: "6px", border: `1px solid ${designPanelOpen ? "rgba(99,102,241,0.4)" : COLORS.border}`, background: designPanelOpen ? "rgba(99,102,241,0.15)" : "transparent", color: designPanelOpen ? COLORS.accent : COLORS.textMuted, cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.35rem" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                <span>Theme</span>
              </button>

              {/* Cmd+K button */}
              <button
                className="zivo-btn"
                onClick={() => setCommandPaletteOpen(true)}
                title="Command Palette (Ctrl+K)"
                style={{ padding: "0.3rem 0.65rem", borderRadius: "6px", border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.textMuted, cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.3rem" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></svg>
                <kbd style={{ fontSize: "0.65rem", opacity: 0.6 }}>⌘K</kbd>
              </button>
              <button
                onClick={() => setAnalysisPanelOpen(!analysisPanelOpen)}
                style={{ padding: "0.375rem 0.75rem", background: analysisPanelOpen ? COLORS.accent : COLORS.bgCard, border: `1px solid ${analysisPanelOpen ? COLORS.accent : COLORS.border}`, borderRadius: "6px", color: analysisPanelOpen ? "#fff" : COLORS.textSecondary, cursor: "pointer", fontSize: "0.8125rem", fontWeight: 500 }}
              >
                Analysis
              </button>
              <button
                onClick={() => setConsolePanelOpen(!consolePanelOpen)}
                style={{ padding: "0.375rem 0.75rem", background: consolePanelOpen ? COLORS.accent : COLORS.bgCard, border: `1px solid ${consolePanelOpen ? COLORS.accent : COLORS.border}`, borderRadius: "6px", color: consolePanelOpen ? "#fff" : COLORS.textSecondary, cursor: "pointer", fontSize: "0.8125rem", fontWeight: 500 }}
              >
                Console
              </button>
            </div>
            )}

            {/* Build progress indicator — shown during loading and briefly after completion */}
            {(loading || (buildIterationCount > 0 && !loading && mode === "code")) && (
              <div style={{ padding: "0.4rem 1rem", borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, flexShrink: 0 }}>
                <BuildProgressIndicator stages={buildStages} currentStage={currentBuildStage} />
              </div>
            )}
            {loading && (
              <div style={{ height: "2px", background: COLORS.bgCard, flexShrink: 0 }}>
                <div style={{ height: "100%", background: COLORS.accentGradient, width: loadingStep === 0 ? "20%" : loadingStep === 1 ? "45%" : loadingStep === 2 ? "75%" : "95%", transition: "width 0.8s ease" }} />
              </div>
            )}

            {/* ── Collapsible Build Output Bar ── */}
            {mode === "code" && (loading || consoleLogs.length > 0) && (
              <div style={{ flexShrink: 0, borderBottom: `1px solid ${COLORS.border}` }}>
                {/* Header / toggle */}
                <button
                  className="zivo-btn"
                  onClick={() => setBuildOutputOpen((o) => !o)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 1rem", background: COLORS.bgPanel, border: "none", borderBottom: buildOutputOpen ? `1px solid ${COLORS.border}` : "none", cursor: "pointer", textAlign: "left" }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: buildOutputOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}><polyline points="9 18 15 12 9 6"/></svg>
                  <span style={{ fontSize: "0.7rem", fontWeight: 600, color: COLORS.textSecondary, letterSpacing: "0.04em", textTransform: "uppercase" }}>Build Output</span>
                  <div style={{ flex: 1 }} />
                  {loading ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "1px 7px", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "20px", fontSize: "0.65rem", fontWeight: 700, color: COLORS.warning }}>
                      <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: COLORS.warning, animation: "statusBlink 1.2s infinite" }} />
                      Running…
                    </span>
                  ) : consoleLogs.some((l) => l.type === "error") ? (
                    <span style={{ padding: "1px 7px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "20px", fontSize: "0.65rem", fontWeight: 700, color: COLORS.error }}>
                      Errors
                    </span>
                  ) : buildIterationCount > 0 ? (
                    <span style={{ padding: "1px 7px", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "20px", fontSize: "0.65rem", fontWeight: 700, color: COLORS.success }}>
                      Pass {buildIterationCount} ✓
                    </span>
                  ) : null}
                </button>
                {/* Scrollable log area */}
                {buildOutputOpen && (
                  <div style={{ maxHeight: "140px", overflowY: "auto", background: "#000", padding: "0.5rem 1rem" }}>
                    <div style={{ fontFamily: "'Fira Code', 'SF Mono', monospace", fontSize: "0.75rem", lineHeight: 1.7 }}>
                      {consoleLogs.slice(-60).map((log, i) => (
                        <div key={i} style={{ color: log.type === "error" ? COLORS.error : log.type === "success" ? COLORS.success : "#4ade80" }}>
                          {log.text}
                        </div>
                      ))}
                      {loading && (
                        <span style={{ display: "inline-block", width: "7px", height: "1em", background: "#4ade80", verticalAlign: "middle", animation: "cursorBlink 1s step-end infinite" }} />
                      )}
                      <div ref={consoleEndRef} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Generated App Analysis (below build output, above preview) ── */}
            {mode === "code" && !loading && (output?.files?.length ?? 0) > 0 && (
              <GeneratedAppAnalysis files={(output?.files ?? []) as Array<{ path: string; content: string; action?: "create" | "update" | "delete" }>} />
            )}

            {/* ── Code Builder Right Panel ── */}
            {mode === "code" && (
            <div style={{ flex: 1, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>

              {/* Empty State */}
              {!loading && !output && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "1.25rem", animation: "fadeIn 0.5s ease", padding: "2rem", textAlign: "center" }}>
                  {/* Logo badge */}
                  <div style={{ position: "relative" }}>
                    <div style={{ width: "72px", height: "72px", borderRadius: "18px", background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))", border: "1px solid rgba(99,102,241,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: "38px", height: "38px", background: COLORS.accentGradient, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>Z</div>
                    </div>
                    {/* Glow ring */}
                    <div style={{ position: "absolute", inset: "-4px", borderRadius: "22px", border: "1px solid rgba(99,102,241,0.15)", pointerEvents: "none" }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: "1.375rem", fontWeight: 700, margin: "0 0 0.5rem", color: COLORS.textPrimary, letterSpacing: "-0.02em" }}>Your app preview lives here</h2>
                    <p style={{ fontSize: "0.875rem", color: COLORS.textSecondary, margin: 0, lineHeight: 1.6 }}>Describe what you want to build →<br />ZIVO AI generates the full app instantly</p>
                  </div>
                  <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center" }}>
                    {[
                      { key: "preview", label: "Instant Preview", icon: <InstantPreviewIcon /> },
                      { key: "ai", label: "AI-Powered", icon: <AiPoweredIcon /> },
                      { key: "edit", label: "Fully Editable", icon: <EditableIcon /> },
                    ].map((chip) => (
                      <span key={chip.key} style={{ padding: "0.35rem 0.875rem", background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.18)", borderRadius: "20px", fontSize: "0.8125rem", color: COLORS.textSecondary, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>{chip.icon}{chip.label}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "1.5rem", padding: "2rem" }}>
                  {/* Pass counter badge */}
                  {buildIteration > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0.875rem", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "20px" }}>
                      <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: COLORS.accent, animation: "statusBlink 1.5s ease-in-out infinite" }} />
                      <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: COLORS.accent }}>Pass {buildIteration}/8</span>
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%", maxWidth: "320px" }}>
                    {[
                      "🧠 Analyzing prompt…",
                      "📐 Planning architecture…",
                      "⚡ Generating files…",
                      "✅ Build complete",
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
                  {/* Streaming file counter */}
                  {output?.files?.length ? (
                    <div style={{ fontSize: "0.75rem", color: COLORS.textSecondary, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: COLORS.success, animation: "statusBlink 1s ease-in-out infinite" }} />
                      {output.files.length} file{output.files.length !== 1 ? "s" : ""} generated…
                    </div>
                  ) : null}
                </div>
              )}

              {/* Preview Tab */}
              {!loading && output && activeTab === "preview" && (
                <div style={{ width: iframeWidth, height: "100%", position: "relative", transition: "width 0.3s ease", display: "flex", flexDirection: "column" }}>
                  {/* WebContainer fallback banner */}
                  {websiteLivePreviewError && (
                    <div style={{ padding: "0.4rem 0.75rem", background: "rgba(245,158,11,0.08)", borderBottom: "1px solid rgba(245,158,11,0.2)", fontSize: "0.75rem", color: COLORS.warning, display: "flex", alignItems: "center", gap: "0.35rem", flexShrink: 0 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                      {websiteLivePreviewError}
                    </div>
                  )}
                  <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column" }}>
                  {(() => {
                    const previewHtml = output?.preview_html ||
                      (output?.files?.length ? buildHTMLSnapshot(output.files) : null);
                    const isSnapshot = !output?.preview_html && Boolean(previewHtml);
                    return previewHtml ? (
                      <>
                        {isSnapshot && (
                          <div style={{ padding: "0.4rem 0.875rem", background: "rgba(245,158,11,0.08)", borderBottom: "1px solid rgba(245,158,11,0.2)", fontSize: "0.75rem", color: COLORS.warning, display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                            <span>This is a static snapshot preview. Use the <strong>Code</strong> tab to view and edit files.</span>
                          </div>
                        )}
                        <iframe
                          ref={iframeRef}
                          srcDoc={previewHtml}
                          title={isSnapshot ? "HTML Snapshot Preview" : "Live Preview"}
                          style={{ flex: 1, width: "100%", border: visualEdit ? "2px solid rgba(99,102,241,0.6)" : "none", boxShadow: visualEdit ? "0 0 0 3px rgba(99,102,241,0.25)" : "none", transition: "box-shadow 0.2s, border-color 0.2s" }}
                          sandbox="allow-scripts"
                          onLoad={() => { if (!isSnapshot) applyVisualEditOverlay(visualEdit); }}
                        />
                        {!isSnapshot && popover && (
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
                        No preview available for this project type.
                      </div>
                    );
                  })()}
                  </div>
                </div>
              )}

              {/* Code Tab */}
              {(loading || (!loading && output)) && activeTab === "code" && (
                <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", animation: "fadeIn 0.3s ease" }}>
                  {activeFile ? (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 1rem", borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
                        <span style={{ fontSize: "0.875rem" }}>{getFileIcon(activeFile.path)}</span>
                        <code style={{ fontSize: "0.8125rem", color: COLORS.textSecondary, fontFamily: "monospace" }}>{activeFile.path}</code>
                        <span style={{ fontSize: "0.7rem", padding: "1px 6px", borderRadius: "4px", textTransform: "uppercase", fontWeight: 600, ...getActionStyle(activeFile.action) }}>{activeFile.action}</span>
                        {loading && (
                          <span style={{ fontSize: "0.7rem", color: COLORS.accent, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <span style={{ display: "inline-block", width: "8px", height: "8px", border: `1.5px solid rgba(99,102,241,0.3)`, borderTop: `1.5px solid ${COLORS.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                            Writing…
                          </span>
                        )}
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
                          {(loading ? streamedCodeContent : activeFile.content).split("\n").map((line, i) => (
                            <div key={i} style={{ display: "flex", gap: "1rem" }}>
                              <span style={{ color: COLORS.textMuted, userSelect: "none", minWidth: "2.5rem", textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                              <span>{line}</span>
                            </div>
                          ))}
                          {loading && (
                            <span style={{ display: "inline-block", width: "2px", height: "1.1em", background: COLORS.accent, verticalAlign: "middle", marginLeft: "2px", animation: "cursorBlink 1s step-end infinite" }} />
                          )}
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
              {activeTab === "console" && (
                <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", background: "#000", animation: "fadeIn 0.3s ease" }}>
                  {/* Console header with iteration info and stop button */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {loading && (
                        <><span style={{ display: "inline-block", width: "10px", height: "10px", border: "2px solid rgba(99,241,118,0.3)", borderTop: "2px solid #4ade80", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /><span style={{ fontSize: "0.75rem", color: "#4ade80" }}>Building…</span></>
                      )}
                      {buildIteration > 0 && (
                        <span style={{ fontSize: "0.7rem", color: COLORS.textMuted }}>Validation pass {buildIteration}/8</span>
                      )}
                      {buildIterationCount > 0 && !loading && (
                        <span style={{ padding: "0.1rem 0.4rem", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "20px", fontSize: "0.65rem", fontWeight: 700, color: COLORS.accent }}>iteration {buildIterationCount}</span>
                      )}
                    </div>
                    {loading && (
                      <button
                        onClick={handleStopBuild}
                        style={{ padding: "0.2rem 0.6rem", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: "5px", color: "#ef4444", cursor: "pointer", fontSize: "0.7rem", fontWeight: 600 }}
                      >
                        ■ Stop Build
                      </button>
                    )}
                  </div>
                  <div style={{ flex: 1, overflow: "auto", padding: "0.75rem 1rem" }}>
                    <div style={{ fontFamily: "'Fira Code', 'SF Mono', 'Monaco', 'Consolas', monospace", fontSize: "0.8125rem", lineHeight: 1.8 }}>
                      {consoleLogs.map((log, i) => (
                        <div key={i} style={{ color: log.type === "error" ? COLORS.error : log.type === "success" ? COLORS.success : "#4ade80" }}>
                          {log.text}
                        </div>
                      ))}
                      {consoleLogs.length === 0 && (
                        <div style={{ color: COLORS.textMuted }}>No console output yet. Start a build to see logs.</div>
                      )}
                      <div ref={consoleEndRef} />
                    </div>
                  </div>
                </div>
              )}

              {/* Diff Tab */}
              {!loading && activeTab === "diff" && showDiff && diffFiles.length > 0 && (
                <div style={{ width: "100%", height: "100%", overflow: "hidden", animation: "fadeIn 0.3s ease" }}>
                  <DiffViewer files={diffFiles} />
                </div>
              )}

              {/* Design Tab (Upgrade 6) */}
              {activeTab === "design" && (
                <div style={{ width: "100%", height: "100%", overflow: "auto", padding: "1.5rem", animation: "fadeIn 0.3s ease" }}>
                  <h2 style={{ fontSize: "1rem", fontWeight: 600, color: COLORS.textPrimary, margin: "0 0 1rem" }}>Visual Design Settings</h2>

                  {/* Color Picker */}
                  <div style={{ marginBottom: "1.25rem" }}>
                    <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: COLORS.textSecondary, display: "block", marginBottom: "0.5rem" }}>Primary Color</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <input
                        type="color"
                        value={designPrimaryColor}
                        onChange={(e) => {
                          setDesignPrimaryColor(e.target.value);
                          try {
                            const iframe = iframeRef.current;
                            if (iframe?.contentDocument?.documentElement) {
                              iframe.contentDocument.documentElement.style.setProperty("--color-primary", e.target.value);
                            }
                          } catch { /* cross-origin */ }
                        }}
                        style={{ width: "40px", height: "40px", borderRadius: "8px", border: `1px solid ${COLORS.border}`, cursor: "pointer", padding: "2px", background: "transparent" }}
                      />
                      <span style={{ fontSize: "0.875rem", color: COLORS.textPrimary, fontFamily: "monospace" }}>{designPrimaryColor}</span>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                      {["#6366f1", "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b", "#ef4444", "#10b981", "#3b82f6"].map((color) => (
                        <button
                          key={color}
                          onClick={() => {
                            setDesignPrimaryColor(color);
                            try {
                              const iframe = iframeRef.current;
                              if (iframe?.contentDocument?.documentElement) {
                                iframe.contentDocument.documentElement.style.setProperty("--color-primary", color);
                              }
                            } catch { /* cross-origin */ }
                          }}
                          style={{ width: "24px", height: "24px", borderRadius: "6px", background: color, border: designPrimaryColor === color ? "2px solid #fff" : "2px solid transparent", cursor: "pointer" }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Font Selector */}
                  <div style={{ marginBottom: "1.25rem" }}>
                    <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: COLORS.textSecondary, display: "block", marginBottom: "0.5rem" }}>Font Family</label>
                    <select
                      value={designFontFamily}
                      onChange={(e) => {
                        setDesignFontFamily(e.target.value);
                        try {
                          const iframe = iframeRef.current;
                          if (iframe?.contentDocument?.documentElement) {
                            iframe.contentDocument.documentElement.style.setProperty("--font-family", e.target.value);
                          }
                        } catch { /* cross-origin */ }
                      }}
                      style={{ padding: "0.375rem 0.75rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "6px", color: COLORS.textPrimary, fontSize: "0.875rem", width: "100%", maxWidth: "280px" }}
                    >
                      {["Inter", "Plus Jakarta Sans", "Outfit", "DM Sans", "Geist", "Roboto", "Open Sans"].map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>

                  {/* Spacing Presets */}
                  <div style={{ marginBottom: "1.25rem" }}>
                    <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: COLORS.textSecondary, display: "block", marginBottom: "0.5rem" }}>Spacing Preset</label>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {["compact", "normal", "relaxed"].map((sp) => (
                        <button
                          key={sp}
                          onClick={() => {
                            setDesignSpacing(sp);
                            try {
                              const iframe = iframeRef.current;
                              if (iframe?.contentDocument?.documentElement) {
                                const val = sp === "compact" ? "0.75rem" : sp === "relaxed" ? "1.5rem" : "1rem";
                                iframe.contentDocument.documentElement.style.setProperty("--spacing-base", val);
                              }
                            } catch { /* cross-origin */ }
                          }}
                          style={{
                            padding: "0.375rem 0.875rem", borderRadius: "6px",
                            background: designSpacing === sp ? "rgba(99,102,241,0.15)" : COLORS.bgCard,
                            border: `1px solid ${designSpacing === sp ? "rgba(99,102,241,0.4)" : COLORS.border}`,
                            color: designSpacing === sp ? COLORS.accent : COLORS.textSecondary,
                            cursor: "pointer", fontSize: "0.8125rem", textTransform: "capitalize", fontWeight: 500,
                          }}
                        >
                          {sp}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Device Preview */}
                  <div>
                    <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: COLORS.textSecondary, display: "block", marginBottom: "0.5rem" }}>Device Preview</label>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {([["desktop", <DesktopIcon key="d" />], ["tablet", <TabletIcon key="t" />], ["mobile", <MobileIcon key="m" />]] as Array<[string, React.ReactElement]>).map(([d, icon]) => (
                        <button
                          key={d}
                          onClick={() => setDeviceMode(d as "desktop" | "tablet" | "mobile")}
                          style={{
                            padding: "0.375rem 0.875rem", borderRadius: "6px", display: "flex", alignItems: "center", gap: "0.375rem",
                            background: deviceMode === d ? "rgba(99,102,241,0.15)" : COLORS.bgCard,
                            border: `1px solid ${deviceMode === d ? "rgba(99,102,241,0.4)" : COLORS.border}`,
                            color: deviceMode === d ? COLORS.accent : COLORS.textSecondary,
                            cursor: "pointer", fontSize: "0.8125rem", textTransform: "capitalize", fontWeight: 500,
                          }}
                        >
                          {icon} {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Auto-fix status */}
                  {(autoFixing || autoFixLog) && (
                    <div style={{ marginTop: "1.25rem", padding: "0.75rem", background: "rgba(99,102,241,0.08)", border: `1px solid rgba(99,102,241,0.2)`, borderRadius: "8px" }}>
                      {autoFixing && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ display: "inline-block", width: "12px", height: "12px", border: "2px solid rgba(99,102,241,0.3)", borderTop: `2px solid ${COLORS.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                          <span style={{ fontSize: "0.8125rem", color: COLORS.accent }}>🔧 Auto-fixing errors…</span>
                        </div>
                      )}
                      {autoFixLog && !autoFixing && (
                        <p style={{ fontSize: "0.8125rem", color: COLORS.success, margin: 0 }}>✓ {autoFixLog}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            )}

            {/* ── Sticky Continue Build Bar (Code Builder mode) ── */}
            {mode === "code" && hasFiles && !loading && (
              <div style={{ borderTop: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, padding: "0.625rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0, animation: "fadeIn 0.3s ease" }}>
                <input
                  className="zivo-input"
                  value={continueInstruction}
                  onChange={(e) => setContinueInstruction(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (continueInstruction.trim()) {
                        const instruction = continueInstruction;
                        setContinueInstruction("");
                        handleBuild(instruction);
                      }
                    }
                  }}
                  placeholder="Describe what to add or change… (e.g. Add dark mode toggle)"
                  maxLength={1000}
                  style={{ flex: 1, background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.4rem 0.75rem", color: COLORS.textPrimary, fontSize: "0.8125rem", outline: "none" }}
                />
                {buildIterationCount > 0 && (
                  <span style={{ padding: "0.2rem 0.55rem", background: "rgba(99,102,241,0.15)", border: `1px solid rgba(99,102,241,0.3)`, borderRadius: "20px", fontSize: "0.7rem", fontWeight: 700, color: COLORS.accent, flexShrink: 0 }}>
                    #{buildIterationCount}
                  </span>
                )}
                <button
                  className="zivo-btn"
                  disabled={!continueInstruction.trim() || loading}
                  onClick={() => {
                    if (continueInstruction.trim()) {
                      const instruction = continueInstruction;
                      setContinueInstruction("");
                      handleBuild(instruction);
                    }
                  }}
                  style={{ padding: "0.4rem 0.875rem", background: continueInstruction.trim() ? COLORS.accentGradient : "rgba(99,102,241,0.15)", border: "none", borderRadius: "8px", color: "#fff", cursor: !continueInstruction.trim() ? "not-allowed" : "pointer", fontSize: "0.8125rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.35rem", flexShrink: 0, opacity: !continueInstruction.trim() ? 0.5 : 1 }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  Continue Build ▶
                </button>
              </div>
            )}

            {mode === "code" && (
              <BuildOutputPanel
                errors={buildErrors}
                warnings={buildWarnings}
                logs={buildLogs}
                isRunning={isBuildRunning}
                iteration={buildIteration}
                maxIterations={8}
              />
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
                    <Image
                      src={imageResult.dataUrl}
                      alt={imageResult.prompt}
                      width={1024}
                      height={1024}
                      unoptimized
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
                          {/* eslint-disable-next-line @next/next/no-img-element */}
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
                {/* Toolbar with URL bar */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0 1rem", height: "48px", borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, flexShrink: 0 }}>
                  {/* URL bar */}
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.25rem 0.75rem", maxWidth: "360px" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: COLORS.textMuted, flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    <span style={{ fontSize: "0.8rem", color: COLORS.textSecondary, fontFamily: "monospace", flex: 1 }}>
                      {websiteLivePreviewUrl ?? "preview"}
                    </span>
                  </div>
                  {/* Reload button */}
                  {(websiteLivePreviewUrl || websiteResult?.preview_html) && (
                    <button
                      className="zivo-btn"
                      title="Reload preview"
                      onClick={() => {
                        // Force re-render by toggling — use a key approach via state
                        if (websiteLivePreviewUrl) {
                          const url = websiteLivePreviewUrl;
                          setWebsiteLivePreviewUrl(null);
                          setTimeout(() => setWebsiteLivePreviewUrl(url), 50);
                        }
                      }}
                      style={{ width: "30px", height: "30px", borderRadius: "6px", border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.textMuted, cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >↻</button>
                  )}
                  {/* Live / Snapshot badge */}
                  {websiteResult && (
                    <span style={{ padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.7rem", fontWeight: 600, flexShrink: 0, background: websiteLivePreviewUrl ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", border: `1px solid ${websiteLivePreviewUrl ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`, color: websiteLivePreviewUrl ? COLORS.success : COLORS.warning }}>
                      {websiteLivePreviewUrl ? "🟢 Live" : "🟡 Snapshot"}
                    </span>
                  )}
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {/* Status with spinner */}
                    {websiteLivePreviewStatus && websiteLivePreviewRunning && (
                      <span style={{ fontSize: "0.72rem", color: COLORS.textMuted, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <span style={{ display: "inline-block", width: "8px", height: "8px", border: "1.5px solid rgba(99,102,241,0.3)", borderTop: `1.5px solid ${COLORS.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                        {websiteLivePreviewStatus}
                      </span>
                    )}
                    {websiteResult?.files && websiteResult.files.length > 0 && (
                      <button
                        onClick={() => void startWebsiteLivePreview(websiteResult.files)}
                        disabled={websiteLivePreviewRunning}
                        style={{ padding: "0.25rem 0.55rem", fontSize: "0.72rem", borderRadius: "6px", border: `1px solid ${COLORS.border}`, background: COLORS.bgCard, color: COLORS.textPrimary, cursor: websiteLivePreviewRunning ? "not-allowed" : "pointer", opacity: websiteLivePreviewRunning ? 0.6 : 1 }}
                      >
                        {websiteLivePreviewRunning ? "Starting…" : websiteLivePreviewUrl ? "Restart Live" : "Start Live"}
                      </button>
                    )}
                  </div>
                </div>
                {/* Error banner with snapshot fallback message */}
                {websiteLivePreviewError && (
                  <div style={{ margin: "0.75rem 1rem 0", padding: "0.6rem 0.75rem", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "8px", color: COLORS.warning, fontSize: "0.8125rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                    <span>{websiteLivePreviewError}</span>
                    {websiteResult && (
                      <button
                        className="zivo-btn"
                        onClick={() => void startWebsiteLivePreview(websiteResult.files)}
                        style={{ padding: "0.2rem 0.6rem", background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.4)", borderRadius: "6px", color: COLORS.warning, cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, flexShrink: 0 }}
                      >
                        Try Again
                      </button>
                    )}
                  </div>
                )}
                {!websiteResult && !websiteLoading && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "1rem", color: COLORS.textMuted, textAlign: "center", padding: "2rem" }}>
                    <div style={{ width: "80px", height: "80px", borderRadius: "20px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366f1" }}>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    </div>
                    <p style={{ fontSize: "0.875rem" }}>Your generated website will appear here</p>
                  </div>
                )}
                {/* Loading shimmer */}
                {websiteLoading && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "1.5rem", padding: "2rem" }}>
                    <span style={{ display: "inline-block", width: "40px", height: "40px", border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    <p style={{ color: COLORS.textSecondary, fontSize: "0.875rem" }}>Building website…</p>
                    <div style={{ width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {[75, 55, 85].map((w, i) => (
                        <div key={i} style={{ height: "14px", borderRadius: "8px", background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", width: `${w}%` }} />
                      ))}
                    </div>
                  </div>
                )}
                {/* WebContainer booting status */}
                {websiteResult && websiteLivePreviewRunning && !websiteLivePreviewUrl && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "1rem", padding: "2rem" }}>
                    <span style={{ display: "inline-block", width: "32px", height: "32px", border: "2px solid rgba(99,102,241,0.2)", borderTop: "2px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    <p style={{ color: COLORS.textSecondary, fontSize: "0.875rem" }}>{websiteLivePreviewStatus ?? "Starting live preview…"}</p>
                    <div style={{ width: "100%", maxWidth: "380px", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {[70, 50, 80].map((w, i) => (
                        <div key={i} style={{ height: "12px", borderRadius: "6px", background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", width: `${w}%` }} />
                      ))}
                    </div>
                  </div>
                )}
                {websiteResult && websiteLivePreviewUrl && (
                  <iframe
                    title="Website Live Runtime Preview"
                    src={websiteLivePreviewUrl}
                    style={{ flex: 1, width: "100%", border: "none" }}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  />
                )}
                {websiteResult?.preview_html && !websiteLivePreviewUrl && !websiteLivePreviewRunning && (
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

            {/* ── Security Right Panel ── */}
            {mode === "security" && (
              <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", padding: "1.5rem", gap: "1rem" }}>
                {/* Sub-tabs */}
                {securityScanResult && (
                  <div style={{ display: "flex", gap: "4px", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "3px", flexShrink: 0 }}>
                    {(["scan", "fixed"] as const).map((t) => (
                      <button
                        key={t}
                        className="zivo-btn"
                        onClick={() => setSecurityActiveTab(t)}
                        style={{ flex: 1, padding: "0.35rem 0.5rem", borderRadius: "6px", border: "none", background: securityActiveTab === t ? "linear-gradient(135deg,#f97316,#ef4444)" : "transparent", color: securityActiveTab === t ? "#fff" : COLORS.textSecondary, cursor: "pointer", fontSize: "0.8125rem", fontWeight: securityActiveTab === t ? 600 : 400, transition: "background 0.2s, color 0.2s" }}
                      >
                        {t === "scan" ? "Scan Report" : "Fixed Code"}
                      </button>
                    ))}
                  </div>
                )}

                {/* Empty state */}
                {!securityScanResult && !securityScanning && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "1rem", color: COLORS.textMuted, textAlign: "center" }}>
                    <div style={{ width: "80px", height: "80px", borderRadius: "20px", background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    <p style={{ fontSize: "0.875rem" }}>Paste code on the left and click scan to see the security report</p>
                  </div>
                )}

                {/* Scanning state */}
                {securityScanning && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "1rem" }}>
                    <span style={{ display: "inline-block", width: "40px", height: "40px", border: "3px solid rgba(249,115,22,0.2)", borderTop: "3px solid #f97316", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    <p style={{ color: COLORS.textSecondary, fontSize: "0.875rem" }}>Analyzing code for vulnerabilities…</p>
                  </div>
                )}

                {/* Scan Report */}
                {securityScanResult && securityActiveTab === "scan" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", animation: "fadeIn 0.3s ease" }}>
                    <div style={{ padding: "0.75rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "10px" }}>
                      <p style={{ margin: "0 0 0.35rem", fontSize: "0.8125rem", fontWeight: 600, color: COLORS.textPrimary }}>Summary</p>
                      <p style={{ margin: 0, fontSize: "0.8125rem", color: COLORS.textSecondary, lineHeight: 1.6 }}>{securityScanResult.summary}</p>
                      <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: COLORS.textMuted }}>Detected language: {securityScanResult.language}</div>
                    </div>
                    {securityScanResult.issues.length === 0 ? (
                      <div style={{ padding: "1rem", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "8px", textAlign: "center", color: COLORS.success, fontSize: "0.875rem" }}>
                        ✓ No vulnerabilities found!
                      </div>
                    ) : securityScanResult.issues.map((issue) => {
                      const sevColors: Record<string,string> = { critical:"#ef4444", high:"#f97316", medium:"#f59e0b", low:"#3b82f6", info:"#94a3b8" };
                      const c = sevColors[issue.severity] ?? "#94a3b8";
                      return (
                        <div key={issue.id} style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "10px", overflow: "hidden" }}>
                          <div style={{ height: "3px", background: c }} />
                          <div style={{ padding: "0.75rem 1rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                              <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: `${c}22`, color: c, textTransform: "uppercase" }}>{issue.severity}</span>
                              <span style={{ fontSize: "0.875rem", fontWeight: 600, color: COLORS.textPrimary, flex: 1 }}>{issue.title}</span>
                              {issue.cwe && <span style={{ fontSize: "0.7rem", color: COLORS.textMuted, background: COLORS.bgPanel, padding: "1px 6px", borderRadius: "4px" }}>{issue.cwe}</span>}
                            </div>
                            <p style={{ margin: "0 0 0.4rem", fontSize: "0.8125rem", color: COLORS.textSecondary, lineHeight: 1.6 }}>{issue.description}</p>
                            {issue.line && <div style={{ fontSize: "0.75rem", color: COLORS.textMuted, marginBottom: "0.35rem" }}>Line: {issue.line}</div>}
                            <div style={{ padding: "0.5rem 0.65rem", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: "6px", fontSize: "0.8125rem", color: COLORS.textSecondary }}>
                              <span style={{ color: COLORS.success, marginRight: "0.35rem" }}>💡</span>{issue.recommendation}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Fixed Code */}
                {securityActiveTab === "fixed" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", animation: "fadeIn 0.3s ease", flex: 1 }}>
                    {securityFixing && (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "1rem" }}>
                        <span style={{ display: "inline-block", width: "40px", height: "40px", border: "3px solid rgba(16,185,129,0.2)", borderTop: "3px solid #10b981", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                        <p style={{ color: COLORS.textSecondary, fontSize: "0.875rem" }}>Generating fixed code…</p>
                      </div>
                    )}
                    {securityFixedCode !== null && !securityFixing && (
                      <>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: COLORS.success }}>✓ All vulnerabilities fixed</span>
                          <button
                            className="zivo-btn"
                            onClick={() => navigator.clipboard.writeText(securityFixedCode).then(() => { setSecurityCopyLabel("copied"); setTimeout(() => setSecurityCopyLabel("copy"), 2000); }).catch(() => {})}
                            style={{ padding: "0.3rem 0.65rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "6px", color: COLORS.textSecondary, cursor: "pointer", fontSize: "0.75rem" }}
                          >
                            {securityCopyLabel === "copied" ? "✓ Copied!" : "Copy"}
                          </button>
                        </div>
                        <pre style={{ background: "#000", borderRadius: "10px", padding: "1rem", fontSize: "0.8125rem", color: COLORS.textPrimary, overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, fontFamily: "'JetBrains Mono','Fira Code',monospace", border: `1px solid ${COLORS.border}`, flex: 1 }}>{securityFixedCode}</pre>
                      </>
                    )}
                    {!securityFixedCode && !securityFixing && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: COLORS.textMuted, fontSize: "0.875rem", textAlign: "center" }}>
                        Click &ldquo;Auto-Fix All Issues&rdquo; to generate the fixed code.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Right Panel — Files / Code / Diff (Code Builder only) */}
          {mode === "code" && (
            <div style={{ width: "280px", flexShrink: 0, display: "flex", flexDirection: "column", borderLeft: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, overflow: "hidden" }}>
              {/* Tab bar */}
              <div style={{ display: "flex", alignItems: "center", gap: "2px", padding: "0 0.75rem", height: "48px", borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
                {(["files", "code", "diff"] as const).map((tab) => (
                  <button
                    key={tab}
                    className="zivo-tab"
                    onClick={() => setActiveRightTab(tab)}
                    style={{ padding: "0.3rem 0.75rem", borderRadius: "6px", border: "none", background: activeRightTab === tab ? "rgba(99,102,241,0.15)" : "transparent", color: activeRightTab === tab ? COLORS.accent : COLORS.textMuted, cursor: "pointer", fontSize: "0.8125rem", fontWeight: 500, textTransform: "capitalize", transition: "color 0.15s", display: "flex", alignItems: "center", gap: "0.3rem" }}
                  >
                    {tab === "files" && output?.files?.length ? (
                      <>{tab.charAt(0).toUpperCase() + tab.slice(1)}<span style={{ background: loading ? "rgba(245,158,11,0.25)" : "rgba(99,102,241,0.25)", borderRadius: "10px", padding: "0px 5px", fontSize: "0.65rem", fontWeight: 700, color: loading ? COLORS.warning : COLORS.accent }}>{output.files.length}</span></>
                    ) : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Files tab */}
              {activeRightTab === "files" && (
                <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", animation: "fadeIn 0.3s ease" }}>
                  <FileTree
                    files={(output?.files ?? []) as Array<{ path: string; content: string; action?: "create" | "update" | "delete" }>}
                    activeFile={activeFile?.path ?? null}
                    onFileSelect={(f) => { setActiveFile(f as { path: string; content: string; action: "create" | "update" | "delete" }); setEditedContent(f.content); setSaveStatus("idle"); setActiveRightTab("code"); }}
                  />
                </div>
              )}

              {/* Code tab */}
              {activeRightTab === "code" && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", animation: "fadeIn 0.3s ease" }}>
                  {activeFile ? (
                    <>
                      {/* File header: path + action badge + Save/Copy buttons */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.75rem", borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
                        <span style={{ fontSize: "0.875rem" }}>{getFileIcon(activeFile.path)}</span>
                        <code style={{ flex: 1, fontSize: "0.75rem", color: COLORS.textSecondary, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={activeFile.path}>{activeFile.path}</code>
                        {/* Save button */}
                        <button
                          className="zivo-btn"
                          onClick={handleFileSave}
                          disabled={isSaving || loading || editedContent === activeFile.content}
                          title={loading ? "Build in progress — editing disabled" : "Save file"}
                          style={{
                            padding: "0.2rem 0.55rem",
                            background: saveStatus === "saved" ? "rgba(16,185,129,0.15)" : saveStatus === "error" ? "rgba(239,68,68,0.15)" : "rgba(99,102,241,0.15)",
                            border: `1px solid ${saveStatus === "saved" ? "rgba(16,185,129,0.4)" : saveStatus === "error" ? "rgba(239,68,68,0.4)" : "rgba(99,102,241,0.3)"}`,
                            borderRadius: "5px",
                            color: saveStatus === "saved" ? COLORS.success : saveStatus === "error" ? COLORS.error : COLORS.accent,
                            cursor: isSaving || loading || editedContent === activeFile.content ? "not-allowed" : "pointer",
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            opacity: editedContent === activeFile.content ? 0.5 : 1,
                          }}
                        >
                          {isSaving ? (
                            <><span style={{ display: "inline-block", width: "10px", height: "10px", border: "2px solid rgba(99,102,241,0.3)", borderTop: "2px solid currentColor", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Saving…</>
                          ) : saveStatus === "saved" ? (
                            <>✓ Saved</>
                          ) : saveStatus === "error" ? (
                            <>✕ Error</>
                          ) : (
                            <>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                              Save
                            </>
                          )}
                        </button>
                        {/* Copy button */}
                        <button
                          className="zivo-btn"
                          onClick={() => navigator.clipboard.writeText(editedContent ?? activeFile.content).then(() => {
                            setCopyFileLabel("copied");
                            setTimeout(() => setCopyFileLabel("copy"), 2000);
                          }).catch(() => {})}
                          style={{ padding: "0.2rem 0.5rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "5px", color: COLORS.textSecondary, cursor: "pointer", fontSize: "0.7rem", flexShrink: 0 }}
                        >
                          {copyFileLabel === "copied" ? "✓" : "Copy"}
                        </button>
                      </div>
                      {/* Editable textarea */}
                      <textarea
                        className="zivo-textarea"
                        value={editedContent ?? activeFile.content}
                        onChange={(e) => { setEditedContent(e.target.value); setSaveStatus("idle"); }}
                        readOnly={loading}
                        spellCheck={false}
                        onKeyDown={(e) => {
                          // Ctrl/Cmd+S to save
                          if ((e.metaKey || e.ctrlKey) && e.key === "s") {
                            e.preventDefault();
                            void handleFileSave();
                          }
                          // Tab key inserts spaces instead of leaving the field
                          if (e.key === "Tab") {
                            e.preventDefault();
                            const el = e.currentTarget;
                            const start = el.selectionStart;
                            const end = el.selectionEnd;
                            const val = el.value;
                            const newVal = val.slice(0, start) + "  " + val.slice(end);
                            setEditedContent(newVal);
                            // Restore cursor position after React re-render
                            requestAnimationFrame(() => {
                              el.selectionStart = start + 2;
                              el.selectionEnd = start + 2;
                            });
                          }
                        }}
                        style={{
                          flex: 1,
                          resize: "none",
                          width: "100%",
                          padding: "0.75rem",
                          background: "transparent",
                          border: "none",
                          color: loading ? COLORS.textMuted : COLORS.textPrimary,
                          fontSize: "0.75rem",
                          lineHeight: 1.7,
                          fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                          outline: "none",
                          boxSizing: "border-box",
                          cursor: loading ? "not-allowed" : "text",
                        }}
                        title={loading ? "Build in progress — editing will resume when build completes" : undefined}
                      />
                      {/* Unsaved changes indicator */}
                      {editedContent !== null && editedContent !== activeFile.content && saveStatus === "idle" && (
                        <div style={{ padding: "0.3rem 0.75rem", borderTop: `1px solid ${COLORS.border}`, flexShrink: 0, display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.7rem", color: COLORS.warning }}>
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: COLORS.warning, flexShrink: 0 }} />
                          Unsaved changes — press <kbd style={{ padding: "0 4px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", fontSize: "0.65rem" }}>⌘S</kbd> or click Save
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: COLORS.textMuted, fontSize: "0.8125rem", textAlign: "center", padding: "2rem" }}>
                      Select a file from the Files tab to view and edit its code.
                    </div>
                  )}
                </div>
              )}

              {/* Diff tab */}
              {activeRightTab === "diff" && (
                <div style={{ flex: 1, overflow: "hidden", animation: "fadeIn 0.3s ease" }}>
                  {showDiff && diffFiles.length > 0 ? (
                    <DiffViewer files={diffFiles} />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: COLORS.textMuted, fontSize: "0.8125rem", textAlign: "center", padding: "2rem" }}>
                      No diff available. Build a project to see changes.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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

        {/* Analysis Panel */}
        {analysisPanelOpen && (
          <div style={{ borderTop: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, padding: "1rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", borderBottom: `1px solid ${COLORS.border}`, paddingBottom: "0.5rem" }}>
              {(["seo", "a11y", "perf", "docs", "agents"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setAnalysisTab(tab)}
                  style={{ padding: "0.25rem 0.75rem", borderRadius: 6, border: "none", background: analysisTab === tab ? COLORS.accent : "transparent", color: analysisTab === tab ? "#fff" : COLORS.textSecondary, cursor: "pointer", fontSize: "0.8125rem", fontWeight: 500 }}
                >
                  {tab === "seo" ? "SEO" : tab === "a11y" ? "A11y" : tab === "perf" ? "Performance" : tab === "docs" ? "Docs" : "Agents"}
                </button>
              ))}
              <button onClick={() => setAnalysisPanelOpen(false)} style={{ marginLeft: "auto", background: "transparent", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: "1.125rem" }}>×</button>
            </div>
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {analysisTab === "seo" && <SEOAnalyzer files={output?.files ?? []} />}
              {analysisTab === "a11y" && <AccessibilityScanner files={output?.files ?? []} />}
              {analysisTab === "perf" && <PerformanceAnalyzer files={output?.files ?? []} />}
              {analysisTab === "docs" && <DocGenerator files={output?.files ?? []} projectName="My Project" />}
              {analysisTab === "agents" && (() => {
                const typedFiles = (output?.files ?? []) as Array<{ path: string; content: string; action: "create" | "update" | "delete" }>;
                return <AgentOrchestrator projectFiles={typedFiles} onFilesUpdated={(files) => setOutput((prev) => prev ? { ...prev, files } : prev)} />;
              })()}
            </div>
          </div>
        )}

        {/* Console Panel */}
        {consolePanelOpen && (
          <ConsolePanel logs={logEntries} onClear={() => setLogEntries([])} />
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

      {/* Command Palette */}
      {commandPaletteOpen && (
        <CommandPalette
          onClose={() => setCommandPaletteOpen(false)}
          onSetPrompt={(p) => { setPrompt(p); setActiveLeftTab("prompt"); }}
          onOpenFiles={() => setActiveRightTab("files")}
          onOpenDesignSystem={() => setDesignSystemOpen(true)}
        />
      )}

      {/* Design System Panel */}
      {designSystemOpen && (
        <DesignSystemPanel
          onClose={() => setDesignSystemOpen(false)}
          onApply={(css) => {
            setConsoleLogs((prev) => [...prev, { text: `> Design system applied (${css.length} chars of CSS variables)`, type: "success" }]);
            setDesignSystemOpen(false);
          }}
        />
      )}

      {/* Visual Design Panel (token editor) */}
      {designPanelOpen && (
        <DesignPanel
          onClose={() => setDesignPanelOpen(false)}
          iframeRef={iframeRef}
        />
      )}

      {/* Full App Modal */}
      {fullAppModalOpen && (
        <FullAppModal
          onClose={() => setFullAppModalOpen(false)}
          onConfirm={handleFullAppBuild}
          isLoading={fullAppLoading}
        />
      )}

      {/* Create Page FAB */}
      <button
        onClick={() => setCreatePageModalOpen(true)}
        title="Create Page (Ctrl+T)"
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          border: "none",
          color: "#fff",
          fontSize: "1.25rem",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(99,102,241,0.5)",
          zIndex: 900,
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.1)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 28px rgba(99,102,241,0.65)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(99,102,241,0.5)";
        }}
      >
        +
      </button>

      {/* Create Page Modal */}
      {createPageModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setCreatePageModalOpen(false); }}
        >
          <div
            style={{
              background: "#0f1120",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 14,
              padding: "1.5rem",
              width: "100%",
              maxWidth: 440,
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <span style={{ fontSize: "1rem", fontWeight: 700, color: "#f1f5f9" }}>📄 Create Page</span>
              <button
                onClick={() => setCreatePageModalOpen(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1.1rem", padding: "0 0.25rem" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Page Name</span>
                <input
                  type="text"
                  value={createPageName}
                  onChange={(e) => setCreatePageName(e.target.value)}
                  placeholder="e.g. Settings, Profile, Pricing"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.6rem 0.75rem", color: "#f1f5f9", fontSize: "0.875rem", outline: "none", width: "100%", boxSizing: "border-box" }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Route</span>
                <input
                  type="text"
                  value={createPageRoute}
                  onChange={(e) => setCreatePageRoute(e.target.value)}
                  placeholder="e.g. /settings, /profile"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.6rem 0.75rem", color: "#f1f5f9", fontSize: "0.875rem", fontFamily: "monospace", outline: "none", width: "100%", boxSizing: "border-box" }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Description</span>
                <textarea
                  value={createPageDescription}
                  onChange={(e) => setCreatePageDescription(e.target.value)}
                  placeholder="Describe what this page should do and look like…"
                  rows={3}
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.6rem 0.75rem", color: "#f1f5f9", fontSize: "0.875rem", outline: "none", width: "100%", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }}
                />
              </label>
            </div>

            <div style={{ display: "flex", gap: "0.625rem", marginTop: "1.25rem" }}>
              <button
                onClick={() => setCreatePageModalOpen(false)}
                style={{ flex: 1, padding: "0.6rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#94a3b8", fontSize: "0.875rem", cursor: "pointer", fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                disabled={!createPageName.trim()}
                onClick={() => {
                  const pagePrompt = `Generate a ${createPageName} page${createPageRoute ? ` at route ${createPageRoute}` : ""}. ${createPageDescription || "Make it look polished and consistent with the rest of the app."}`;
                  setPrompt(pagePrompt);
                  setCreatePageModalOpen(false);
                  setCreatePageName("");
                  setCreatePageRoute("");
                  setCreatePageDescription("");
                  handleBuild(pagePrompt);
                }}
                style={{
                  flex: 2,
                  padding: "0.6rem",
                  background: !createPageName.trim() ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  border: "none",
                  borderRadius: 8,
                  color: "#fff",
                  fontSize: "0.875rem",
                  cursor: !createPageName.trim() ? "not-allowed" : "pointer",
                  fontWeight: 700,
                }}
              >
                Generate Page ▶
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GitHub Push Modal */}
      {githubModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1001,
            padding: "1rem",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setGithubModalOpen(false); }}
        >
          <div
            style={{
              background: "#0f1120",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 14,
              padding: "1.5rem",
              width: "100%",
              maxWidth: 460,
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              animation: "fadeIn 0.2s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill={COLORS.textPrimary}><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                <span style={{ fontSize: "1rem", fontWeight: 700, color: COLORS.textPrimary }}>Push to GitHub</span>
              </div>
              <button
                onClick={() => setGithubModalOpen(false)}
                style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: "1.1rem", padding: "0 0.25rem" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Owner</span>
                  <input
                    type="text"
                    value={githubModalOwner}
                    onChange={(e) => setGithubModalOwner(e.target.value)}
                    placeholder="your-username"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.5rem 0.65rem", color: COLORS.textPrimary, fontSize: "0.875rem", outline: "none" }}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Repository</span>
                  <input
                    type="text"
                    value={githubModalRepo}
                    onChange={(e) => setGithubModalRepo(e.target.value)}
                    placeholder="my-app"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.5rem 0.65rem", color: COLORS.textPrimary, fontSize: "0.875rem", outline: "none" }}
                  />
                </label>
              </div>

              <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Branch</span>
                <input
                  type="text"
                  value={githubModalBranch}
                  onChange={(e) => setGithubModalBranch(e.target.value)}
                  placeholder="main"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.5rem 0.65rem", color: COLORS.textPrimary, fontSize: "0.875rem", fontFamily: "monospace", outline: "none" }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  GitHub Token{" "}
                  <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" style={{ color: COLORS.accent, textTransform: "none", fontWeight: 400 }}>(generate)</a>
                </span>
                <input
                  type="password"
                  value={githubModalToken}
                  onChange={(e) => setGithubModalToken(e.target.value)}
                  placeholder="ghp_... (leave blank to use saved token)"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.5rem 0.65rem", color: COLORS.textPrimary, fontSize: "0.875rem", fontFamily: "monospace", outline: "none" }}
                />
              </label>

              <div style={{ fontSize: "0.75rem", color: COLORS.textMuted, background: "rgba(255,255,255,0.03)", border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "0.5rem 0.65rem" }}>
                Pushing <strong style={{ color: COLORS.textSecondary }}>{output?.files?.length ?? 0} files</strong> to GitHub. Token is saved locally for future pushes.
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.625rem", marginTop: "1.25rem" }}>
              <button
                onClick={() => setGithubModalOpen(false)}
                style={{ flex: 1, padding: "0.6rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: COLORS.textMuted, fontSize: "0.875rem", cursor: "pointer", fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                disabled={githubPushing}
                onClick={handleGithubModalPush}
                style={{
                  flex: 2,
                  padding: "0.6rem",
                  background: githubPushing ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  border: "none",
                  borderRadius: 8,
                  color: "#fff",
                  fontSize: "0.875rem",
                  cursor: githubPushing ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                }}
              >
                {githubPushing ? (
                  <><span style={{ display: "inline-block", width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Pushing…</>
                ) : (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" x2="12" y1="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg> Push to GitHub</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
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







