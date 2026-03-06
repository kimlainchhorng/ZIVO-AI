'use client';

/**
 * components/AppPreview.tsx
 * Sandboxed iframe preview for generated SaaS applications.
 *
 * Prioritizes the /app route as the primary entry point.
 * Surfaces a completeness-gate error overlay when required SaaS routes are missing.
 */

import { useState } from 'react';
import { AlertCircle, RefreshCw, ExternalLink, X, CheckCircle2 } from 'lucide-react';
import { SAAS_STANDARD_ROUTES } from '@/lib/ai/validators/completeness-gate';

/** Ordered list of route fallbacks for the preview iframe. */
const PREVIEW_ROUTE_PRIORITY = ['/app', '/', '/features', '/pricing'] as const;

export interface AppPreviewProps {
  /** Live URL (e.g. Vercel deploy). When provided the iframe uses `src` + route navigation. */
  previewUrl?: string;
  /** Static HTML string for srcDoc-based preview (offline). */
  previewHtml?: string;
  /** Generated file list used to determine completeness-gate status. */
  files?: { path: string }[];
  /** Extra CSS class names applied to the root wrapper. */
  className?: string;
  /** Called when the user clicks "Regenerate missing pages". */
  onRemediate?: (missingRoutes: string[]) => void;
}

export default function AppPreview({
  previewUrl,
  previewHtml,
  files,
  className = '',
  onRemediate,
}: AppPreviewProps) {
  const [activeRoute, setActiveRoute] = useState<string>(PREVIEW_ROUTE_PRIORITY[0]);
  const [dismissedOverlay, setDismissedOverlay] = useState(false);

  // ── Completeness check ────────────────────────────────────────────────────
  const filePaths = new Set((files ?? []).map((f) => f.path));

  const missingRoutes = SAAS_STANDARD_ROUTES.filter(
    ({ file }) => !filePaths.has(file)
  );

  const hasAppRoute = filePaths.has('app/app/page.tsx');
  const showCompletenessError =
    files !== undefined &&
    files.length > 0 &&
    missingRoutes.length > 0 &&
    !dismissedOverlay;

  // ── Active preview URL ────────────────────────────────────────────────────
  const resolvedSrc = previewUrl
    ? `${previewUrl.replace(/\/$/, '')}${activeRoute}`
    : undefined;

  const hasPreviewContent = Boolean(resolvedSrc || previewHtml);

  return (
    <div className={`relative flex flex-col h-full ${className}`}>

      {/* ── Route nav bar ─────────────────────────────────────────────────── */}
      {previewUrl && (
        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-indigo-500/15 bg-slate-950/80 flex-shrink-0 overflow-x-auto">
          {PREVIEW_ROUTE_PRIORITY.map((route) => (
            <button
              key={route}
              onClick={() => setActiveRoute(route)}
              className={`px-2.5 py-1 rounded text-xs font-mono whitespace-nowrap transition-colors ${
                activeRoute === route
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              {route === '/app' && !hasAppRoute ? (
                <span className="flex items-center gap-1">
                  <AlertCircle size={10} className="text-red-400" />
                  {route}
                </span>
              ) : route}
            </button>
          ))}
          {resolvedSrc && (
            <a
              href={resolvedSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto p-1 rounded text-slate-600 hover:text-slate-300 transition-colors flex-shrink-0"
              title="Open in new tab"
            >
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      )}

      {/* ── Preview iframe ─────────────────────────────────────────────────── */}
      <div className="relative flex-1 min-h-0">
        {hasPreviewContent ? (
          resolvedSrc ? (
            <iframe
              key={resolvedSrc}
              src={resolvedSrc}
              title={`App preview — ${activeRoute}`}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          ) : (
            <iframe
              srcDoc={previewHtml}
              title="App preview"
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-600">
            <RefreshCw size={28} className="opacity-40" />
            <p className="text-sm">No preview available yet</p>
          </div>
        )}

        {/* ── Completeness-gate error overlay ─────────────────────────────── */}
        {showCompletenessError && (
          <div className="absolute inset-0 flex items-start justify-center bg-slate-950/85 backdrop-blur-sm p-6 overflow-y-auto z-10">
            <div className="w-full max-w-sm rounded-2xl border border-red-500/30 bg-slate-950 shadow-2xl p-5 flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <h3 className="text-sm font-semibold text-slate-100">
                    Completeness Gate Failed
                  </h3>
                </div>
                <button
                  onClick={() => setDismissedOverlay(true)}
                  className="p-1 rounded hover:bg-white/10 text-slate-500 transition-colors flex-shrink-0"
                  aria-label="Dismiss"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-400 leading-relaxed">
                The generated app is missing{' '}
                <span className="text-red-300 font-medium">{missingRoutes.length}</span>{' '}
                SaaS-standard route{missingRoutes.length !== 1 ? 's' : ''}.
                A complete SaaS app requires all routes below.
              </p>

              {/* Route list */}
              <ul className="flex flex-col gap-1.5">
                {SAAS_STANDARD_ROUTES.map(({ file, label }) => {
                  const present = filePaths.has(file);
                  return (
                    <li
                      key={file}
                      className={`flex items-center gap-2 text-xs font-mono px-2.5 py-1.5 rounded-lg ${
                        present
                          ? 'bg-emerald-500/8 text-emerald-400 border border-emerald-500/15'
                          : 'bg-red-500/8 text-red-400 border border-red-500/15'
                      }`}
                    >
                      {present ? (
                        <CheckCircle2 size={11} className="flex-shrink-0" />
                      ) : (
                        <AlertCircle size={11} className="flex-shrink-0" />
                      )}
                      {label}
                    </li>
                  );
                })}
              </ul>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                {onRemediate && (
                  <button
                    onClick={() => onRemediate(missingRoutes.map((r) => r.route))}
                    className="w-full px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                  >
                    Generate Missing Pages
                  </button>
                )}
                <button
                  onClick={() => setDismissedOverlay(true)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 text-xs transition-colors"
                >
                  Dismiss and view partial preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
