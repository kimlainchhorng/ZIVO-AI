// AI Builder Component

'use client';

import React, { useState, useRef, useCallback } from 'react';
import Link from 'next/link';

type BuilderMode = 'website' | 'mobile';
type DevicePreview = 'desktop' | 'tablet' | 'mobile';

const TEMPLATES: Record<BuilderMode, { label: string; prompt: string }[]> = {
  website: [
    { label: '🏠 Landing Page', prompt: 'Create a modern SaaS landing page with a hero section, features grid, pricing table, and call-to-action. Use a blue and white color scheme with smooth animations.' },
    { label: '👤 Portfolio', prompt: 'Build a personal portfolio website with a hero intro, skills section, projects grid, and contact form. Use a dark theme with purple accents.' },
    { label: '🛒 E-Commerce', prompt: 'Create an e-commerce product page with a product image gallery, description, pricing, add to cart button, and customer reviews section.' },
    { label: '📊 Dashboard', prompt: 'Build an admin dashboard with a sidebar navigation, stats cards, a data table, and chart placeholders. Use a clean, professional design.' },
    { label: '📝 Blog', prompt: 'Create a blog homepage with a featured post hero, article cards grid, categories sidebar, and newsletter signup. Use a minimal, readable design.' },
    { label: '🏢 Business', prompt: 'Build a professional business website with a header, services section, team grid, testimonials carousel, and contact section.' },
  ],
  mobile: [
    { label: '🏠 App Home', prompt: 'Create a React Native mobile app home screen with a header, search bar, featured items carousel, and a list of recent items.' },
    { label: '🔐 Login Screen', prompt: 'Build a mobile app login screen with logo, email/password fields, login button, social login options, and sign-up link. Use React Native StyleSheet.' },
    { label: '👤 Profile Page', prompt: 'Create a mobile user profile screen with avatar, stats (followers/following), bio, and a grid of posts. Use React Native components.' },
    { label: '🛒 Shopping Cart', prompt: 'Build a mobile shopping cart screen with product items list, quantity controls, price summary, and checkout button. Use React Native.' },
    { label: '💬 Chat UI', prompt: 'Create a mobile chat screen with message bubbles, input field with send button, and message timestamps. Use React Native.' },
    { label: '⚙️ Settings', prompt: 'Build a mobile settings screen with grouped options, toggle switches, navigation arrows, and section headers. Use React Native.' },
  ],
};

const PROMPT_SUGGESTIONS: Record<BuilderMode, string[]> = {
  website: [
    'Add a responsive navigation header with a logo and menu items',
    'Create a pricing section with 3 tiers: Free, Pro, and Enterprise',
    'Build a contact form with name, email, and message fields',
    'Add a testimonials section with avatar, name, and quote',
  ],
  mobile: [
    'Create a bottom tab navigation with Home, Search, Cart, and Profile tabs',
    'Build a product detail screen with images, title, price, and add to cart button',
    'Add an onboarding flow with 3 swipeable intro screens',
    'Create a notification list screen with icons and timestamps',
  ],
};

export default function AIBuilder() {
  const [mode, setMode] = useState<BuilderMode>('website');
  const [devicePreview, setDevicePreview] = useState<DevicePreview>('desktop');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [projectName, setProjectName] = useState('My Project');
  const [isEditingName, setIsEditingName] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    setLoading(true);
    setError('');
    setOutput('');

    const systemPrompt = mode === 'website'
      ? 'You generate clean, responsive website code. Return ONLY the code output (HTML/CSS/JS), no explanations.'
      : 'You generate clean React Native mobile app code. Return ONLY the code output, no explanations.';

    try {
      const response = await fetch('/api/generate-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${systemPrompt}\n\nUser request: ${input}`,
        }),
      });
      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setOutput(data.result || '');
      }
    } catch {
      setError('Failed to connect. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [output]);

  const handleTemplateSelect = (prompt: string) => {
    setInput(prompt);
    setShowTemplates(false);
    textareaRef.current?.focus();
  };

  const handleSuggestion = (suggestion: string) => {
    setInput((prev) => prev ? `${prev}\n${suggestion}` : suggestion);
    textareaRef.current?.focus();
  };

  const devicePreviewClass: Record<DevicePreview, string> = {
    desktop: 'w-full',
    tablet: 'max-w-lg mx-auto',
    mobile: 'max-w-sm mx-auto',
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">Z</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-white">ZIVO AI</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            {isEditingName ? (
              <input
                autoFocus
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                className="text-sm font-medium text-slate-700 dark:text-slate-300 bg-transparent border-b border-indigo-500 outline-none w-32"
                aria-label="Project name"
              />
            ) : (
              <button
                onClick={() => setIsEditingName(true)}
                className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                title="Click to rename project"
              >
                {projectName} ✏️
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {output && (
              <button
                onClick={handleCopy}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                aria-label="Copy code to clipboard"
              >
                {copied ? '✅ Copied!' : '📋 Copy Code'}
              </button>
            )}
            <Link
              href="/"
              className="px-3 py-1.5 text-sm rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              ← Home
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Controls */}
        <div className="flex flex-col gap-4">
          {/* Mode Toggle */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Builder Mode</p>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-xl">
              <button
                onClick={() => { setMode('website'); setOutput(''); setError(''); }}
                className={`py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                  mode === 'website'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                aria-pressed={mode === 'website'}
              >
                🌐 Website Builder
              </button>
              <button
                onClick={() => { setMode('mobile'); setOutput(''); setError(''); }}
                className={`py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                  mode === 'mobile'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                aria-pressed={mode === 'mobile'}
              >
                📱 Mobile App Builder
              </button>
            </div>
          </div>

          {/* Template Selector */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quick Start Templates</p>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                aria-expanded={showTemplates}
              >
                {showTemplates ? 'Hide ↑' : 'Show ↓'}
              </button>
            </div>
            {showTemplates && (
              <div className="grid grid-cols-2 gap-2 fade-in">
                {TEMPLATES[mode].map((t) => (
                  <button
                    key={t.label}
                    onClick={() => handleTemplateSelect(t.prompt)}
                    className="text-left px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300 dark:hover:border-indigo-500 text-slate-700 dark:text-slate-300 font-medium active:scale-95"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
            {!showTemplates && (
              <div className="flex flex-wrap gap-2">
                {TEMPLATES[mode].slice(0, 3).map((t) => (
                  <button
                    key={t.label}
                    onClick={() => handleTemplateSelect(t.prompt)}
                    className="px-2.5 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:text-indigo-700 dark:hover:text-indigo-300 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-700"
                  >
                    {t.label}
                  </button>
                ))}
                <button
                  onClick={() => setShowTemplates(true)}
                  className="px-2.5 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600"
                >
                  +{TEMPLATES[mode].length - 3} more
                </button>
              </div>
            )}
          </div>

          {/* Prompt Input */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Your Prompt
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={mode === 'website'
                  ? 'Describe the website you want to build...\n\nExample: Create a modern landing page for a fitness app with a hero section, features, pricing, and contact form. Use green and white colors.'
                  : 'Describe the mobile app screen you want to build...\n\nExample: Create a React Native home screen for a food delivery app with categories, featured restaurants, and a bottom tab bar.'}
                rows={8}
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 resize-none outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40"
                aria-label="Describe what you want to build"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    handleSubmit(e as unknown as React.FormEvent);
                  }
                }}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className={`w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] ${
                  mode === 'website'
                    ? 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-indigo-800'
                    : 'bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 dark:disabled:bg-purple-800'
                } disabled:cursor-not-allowed`}
                aria-label="Generate code"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    Generate {mode === 'website' ? 'Website' : 'Mobile App'} Code
                    <span className="text-xs opacity-70 ml-1">(Ctrl+Enter)</span>
                  </>
                )}
              </button>
            </form>

            {/* Prompt Suggestions */}
            <div className="mt-4">
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">💡 Suggestions</p>
              <div className="flex flex-col gap-1.5">
                {PROMPT_SUGGESTIONS[mode].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestion(s)}
                    className="text-left text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Output */}
        <div className="flex flex-col gap-4">
          {/* Device Preview Toggle (website mode only) */}
          {mode === 'website' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Preview Device</p>
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  {(['desktop', 'tablet', 'mobile'] as DevicePreview[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDevicePreview(d)}
                      className={`px-3 py-1 text-xs rounded-md font-medium ${
                        devicePreview === d
                          ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                      aria-pressed={devicePreview === d}
                    >
                      {d === 'desktop' ? '🖥' : d === 'tablet' ? '📱' : '📲'} {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Output Panel */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex-1 flex flex-col overflow-hidden min-h-[400px]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {mode === 'website' ? 'Generated Code' : 'React Native Code'}
                </span>
              </div>
              {output && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium"
                  aria-label="Copy code to clipboard"
                >
                  {copied ? '✅ Copied!' : '📋 Copy'}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-auto p-4">
              {/* Error State */}
              {error && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 fade-in" role="alert">
                  <span className="text-xl flex-shrink-0">⚠️</span>
                  <div>
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400">Generation Failed</p>
                    <p className="text-sm text-red-600 dark:text-red-500 mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="flex flex-col items-center justify-center h-full gap-4 py-16 fade-in">
                  <div className="w-12 h-12 rounded-full border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 spinner"></div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 pulse">
                      Generating your {mode === 'website' ? 'website' : 'mobile app'} code...
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">This may take a few seconds</p>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!loading && !output && !error && (
                <div className="flex flex-col items-center justify-center h-full gap-4 py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center text-3xl">
                    {mode === 'website' ? '🌐' : '📱'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      Your generated code will appear here
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Choose a template or write your own prompt to get started
                    </p>
                  </div>
                </div>
              )}

              {/* Output Code */}
              {output && !loading && (
                <div className={`fade-in ${devicePreviewClass[devicePreview]}`}>
                  <pre className="code-block text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words bg-slate-50 dark:bg-slate-900 rounded-xl p-4 text-xs leading-relaxed overflow-x-auto">
                    <code>{output}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
