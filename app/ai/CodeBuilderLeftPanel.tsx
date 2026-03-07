'use client';

import React from "react";
import { COLORS } from "./colors";
import ModelSelector from "@/components/ModelSelector";
import PlanViewer from "@/components/PlanViewer";
import BlueprintPanel from "@/components/BlueprintPanel";
import VoiceInput from "@/components/VoiceInput";
import { Icon } from "@/components/icons/Icon";
import TemplateSelector from "@/components/TemplateSelector";

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

const MAX_CHAT_HISTORY_DISPLAY_LENGTH = 120;
const MAX_PROMPT_SUGGESTION_LENGTH = 72;

const QUICK_PROMPTS = [
  { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline-block",flexShrink:0 }}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>, label: "Landing Page", prompt: "Build a modern SaaS landing page with hero, features, pricing, and CTA sections" },
  { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline-block",flexShrink:0 }}><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>, label: "Todo App", prompt: "Build a todo app with categories, due dates, and local storage persistence" },
  { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline-block",flexShrink:0 }}><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>, label: "E-commerce", prompt: "Build an e-commerce product listing page with cart and checkout flow" },
  { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline-block",flexShrink:0 }}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, label: "Auth Flow", prompt: "Build a complete authentication flow with login, signup, and password reset pages" },
  { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display:"inline-block",flexShrink:0 }}><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>, label: "Dashboard", prompt: "Build an analytics dashboard with charts, stats cards, and data tables" },
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

interface CodeBuilderLeftPanelProps {
  model: string;
  setModel: (v: string) => void;
  activeLeftTab: "prompt" | "plan" | "templates" | "workflows" | "generate" | "blueprint" | "projects";
  setActiveLeftTab: (v: "prompt" | "plan" | "templates" | "workflows" | "generate" | "blueprint" | "projects") => void;
  leftPanelWidth: number;
  isPlanLoading: boolean;
  planLoading: boolean;
  planData: any | null;
  plan: any | null;
  loading: boolean;
  handleBuild: (prompt?: string) => void;
  prompt: string;
  setPrompt: (v: string | ((prev: string) => string)) => void;
  setFullAppModalOpen: (v: boolean) => void;
  promptRef: React.RefObject<HTMLTextAreaElement | null>;
  isEnhancing: boolean;
  handleEnhancePrompt: () => void;
  isPlanRequested: boolean;
  handlePlanGenerate: () => void;
  conversationHistory: Array<any>;
  setConversationHistory: (v: any[]) => void;
  suggestions: string[];
  handleVoiceInput: (transcript: string) => void;
  savedProjectId: string | null;
  savedProjectName: string | null;
  handleSaveProject: () => void;
  isSavingProject: boolean;
  connectedProjectId: string | null;
  connectedProjectName: string | null;
  setConnectedProjectId: (v: string | null) => void;
  setConnectedProjectName: (v: string | null) => void;
  buildSummary: any | null;
  continueInstruction: string;
  setContinueInstruction: (v: string) => void;
  notifications: Array<any>;
  dismissNotification: (id: string) => void;
  blueprintData: any | null;
  setBlueprintData: (v: any) => void;
  projects: Array<any>;
  projectsLoading: boolean;
  loadProject: (id: string) => void;
  handleGenerateFullStack: () => void;
  handleGenerateComponents: () => void;
  handleGenerateAPI: () => void;
  handleGenerateDatabase: () => void;
  handleGenerateAuth: () => void;
  buildIterationCount: number;
  isRecording: boolean;
  promptHistory: string[];
  setPromptHistory: (v: string[]) => void;
  showPromptHistory: boolean;
  setShowPromptHistory: (v: boolean | ((prev: boolean) => boolean)) => void;
  promptHistoryRef: React.RefObject<HTMLDivElement | null>;
  suggestLoading: boolean;
  planOpen: boolean;
  setPlanOpen: (v: boolean) => void;
  planResult: string | null;
  handlePlan: () => void;
  handleStartFresh: () => void;
  hasFiles: boolean;
  output: any | null;
  setActiveRightTab: (v: string) => void;
  deployResult: any | null;
  deployError: string | null;
  downloadError: string | null;
  connectedGithubRepo: string | null;
  handleGithubPush: () => void;
  githubPushing: boolean;
  githubPushResult: string | null;
  githubPushError: string | null;
  handleEnhance: () => void;
  enhancing: boolean;
  supabaseToken: string | null;
  handleShare: () => void;
  sharing: boolean;
  shareUrl: string | null;
}

export default function CodeBuilderLeftPanel({
  model,
  setModel,
  activeLeftTab,
  setActiveLeftTab,
  leftPanelWidth,
  isPlanLoading,
  planLoading,
  planData,
  plan,
  loading,
  handleBuild,
  prompt,
  setPrompt,
  setFullAppModalOpen,
  promptRef,
  isEnhancing,
  handleEnhancePrompt,
  isPlanRequested,
  handlePlanGenerate,
  conversationHistory,
  setConversationHistory,
  suggestions,
  handleVoiceInput,
  savedProjectId,
  savedProjectName,
  handleSaveProject,
  isSavingProject,
  connectedProjectId,
  connectedProjectName,
  setConnectedProjectId,
  setConnectedProjectName,
  buildSummary,
  continueInstruction,
  setContinueInstruction,
  notifications,
  dismissNotification,
  blueprintData,
  setBlueprintData,
  projects,
  projectsLoading,
  loadProject,
  handleGenerateFullStack,
  handleGenerateComponents,
  handleGenerateAPI,
  handleGenerateDatabase,
  handleGenerateAuth,
  buildIterationCount,
  isRecording,
  promptHistory,
  setPromptHistory,
  showPromptHistory,
  setShowPromptHistory,
  promptHistoryRef,
  suggestLoading,
  planOpen,
  setPlanOpen,
  planResult,
  handlePlan,
  handleStartFresh,
  hasFiles,
  output,
  setActiveRightTab,
  deployResult,
  deployError,
  downloadError,
  connectedGithubRepo,
  handleGithubPush,
  githubPushing,
  githubPushResult,
  githubPushError,
  handleEnhance,
  enhancing,
  supabaseToken,
  handleShare,
  sharing,
  shareUrl,
}: CodeBuilderLeftPanelProps) {
  return (
    <>

              {/* Header */}
              <div style={{ marginBottom: "1.25rem", textAlign: "center" }}>
                <h1 style={{ fontSize: "1.375rem", fontWeight: 700, margin: "0 0 0.25rem", letterSpacing: "-0.02em" }}>What will you build today?</h1>
                <p style={{ fontSize: "0.8125rem", color: COLORS.textSecondary, margin: "0 0 0.75rem" }}>Describe what to build — ZIVO AI generates the full code instantly</p>
                <ModelSelector task="code" value={model} onChange={setModel} />
              </div>

              {/* Left Panel Tabs */}
              <div style={{ display: "flex", gap: "3px", marginBottom: "0.875rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "3px", flexWrap: "wrap" }}>
                {([
                  ["prompt", "Prompt", <svg key="p" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>],
                  ["plan", "Plan", <svg key="pl" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>],
                  ["templates", "Templates", <svg key="t" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>],
                  ["workflows", "Workflows", <svg key="w" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>],
                  ["generate", "Generate", <svg key="g" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>],
                  ["blueprint", "Blueprint", <svg key="b" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>],
                  ["projects", "Projects", <svg key="pr" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>],
                ] as [string, string, React.ReactNode][]).map(([tab, label, icon]) => (
                  <button
                    key={tab}
                    className="zivo-btn"
                    onClick={() => setActiveLeftTab(tab as "prompt" | "plan" | "templates" | "workflows" | "generate" | "blueprint" | "projects")}
                    title={label}
                    style={{ flex: 1, minWidth: "28px", padding: "0.35rem 0.4rem", borderRadius: "6px", border: "none", background: activeLeftTab === tab ? COLORS.accentGradient : "transparent", color: activeLeftTab === tab ? "#fff" : COLORS.textSecondary, cursor: "pointer", fontSize: "0.7rem", fontWeight: activeLeftTab === tab ? 600 : 400, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem", transition: "background 0.15s, color 0.15s" }}
                  >
                    {icon}
                    <span style={{ display: leftPanelWidth > 320 ? "inline" : "none" }}>{label}</span>
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
                            {planData.techStack.map((t: any, i: number) => (
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
                            {planData.pages.map((p: any, i: number) => (
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
                          {planData.auth.methods.map((m: string) => <span key={m} style={{ padding: "0 5px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", color: COLORS.textMuted }}>{m}</span>)}
                        </div>
                      )}

                      {/* Third-party services */}
                      {planData.thirdPartyServices.length > 0 && (
                        <div>
                          <div style={{ fontSize: "0.7rem", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: "0.35rem" }}>Services</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                            {planData.thirdPartyServices.map((s: string, i: number) => (
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
              <div style={{ marginBottom: "0.875rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "14px", overflow: "visible", position: "relative" }}>
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
                {/* Char count + shortcut hint */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.1rem 0.875rem 0.3rem", pointerEvents: "none" }}>
                  <span style={{ fontSize: "0.65rem", color: prompt.length > 1800 ? COLORS.warning : COLORS.textMuted }}>{prompt.length}/2000</span>
                  <span style={{ fontSize: "0.65rem", color: COLORS.textMuted }}>
                    <kbd style={{ padding: "1px 4px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", border: `1px solid ${COLORS.border}`, fontSize: "0.6rem" }}>⌘↵</kbd>
                    {" to generate"}
                  </span>
                </div>
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
                  {/* History button */}
                  {promptHistory.length > 0 && (
                    <div style={{ position: "relative", flexShrink: 0 }} ref={promptHistoryRef}>
                      <button
                        className="zivo-btn"
                        title="Recent prompts"
                        onClick={() => setShowPromptHistory((v) => !v)}
                        style={{ width: "30px", height: "30px", borderRadius: "7px", background: showPromptHistory ? "rgba(99,102,241,0.15)" : "transparent", border: `1px solid ${showPromptHistory ? "rgba(99,102,241,0.4)" : COLORS.border}`, color: showPromptHistory ? COLORS.accent : COLORS.textMuted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                      </button>
                      {showPromptHistory && (
                        <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: 0, width: "280px", background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: "10px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 999, overflow: "hidden", animation: "fadeIn 0.15s ease" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0.75rem", borderBottom: `1px solid ${COLORS.border}` }}>
                            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Recent Prompts</span>
                            <button onClick={() => { setPromptHistory([]); setShowPromptHistory(false); }} style={{ background: "transparent", border: "none", color: COLORS.textMuted, cursor: "pointer", fontSize: "0.7rem" }}>Clear</button>
                          </div>
                          <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                            {promptHistory.map((p, i) => (
                              <button
                                key={i}
                                onClick={() => { setPrompt(p); setShowPromptHistory(false); }}
                                className="zivo-file"
                                style={{ width: "100%", padding: "0.5rem 0.75rem", background: "transparent", border: "none", borderBottom: i < promptHistory.length - 1 ? `1px solid ${COLORS.border}` : "none", color: COLORS.textSecondary, cursor: "pointer", textAlign: "left", fontSize: "0.75rem", lineHeight: 1.4, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                title={p}
                              >
                                {p.length > 70 ? p.slice(0, 70) + "…" : p}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Model selector — styled ModelBadge */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <select
                      className="zivo-select"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      style={{ appearance: "none", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: "20px", color: COLORS.accent, padding: "0.25rem 1.75rem 0.25rem 0.75rem", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                    >
                      {MODELS.map((m) => (
                        <option key={m.value} value={m.value} style={{ background: COLORS.bgPanel }}>{m.label}</option>
                      ))}
                    </select>
                    {/* Live green dot indicator */}
                    <span style={{ position: "absolute", left: "0.55rem", top: "50%", transform: "translateY(-50%)", width: "6px", height: "6px", borderRadius: "50%", background: COLORS.success, pointerEvents: "none" }} />
                    <span style={{ position: "absolute", right: "0.45rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: "0.6rem", color: COLORS.accent }}>▾</span>
                  </div>
                  {/* Voice input (Web Speech API) */}
                  <button
                    className="zivo-btn"
                    onClick={() => handleVoiceInput("")}
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
                const routeCount = buildFiles.filter((f: any) => f.path.includes("/app/") || f.path.includes("/pages/") || f.path.match(/page\.(tsx?|jsx?)$/)).length;
                const componentCount = buildFiles.filter((f: any) => f.path.includes("/components/") || (f.path.match(/\.(tsx?)$/) && !f.path.includes("/api/") && !f.path.match(/page\.(tsx?|jsx?)$/))).length;
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
              {hasFiles && !loading && (
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
    </>
  );
}
