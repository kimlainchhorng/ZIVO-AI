"use client";

import { useState } from "react";
import Link from "next/link";

export default function AiLoginPage() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  function setCookie(name: string, value: string, days = 7) {
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${encodeURIComponent(
      value
    )}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    if (!pw.trim()) {
      setErr("Please enter your password");
      return;
    }

    setLoading(true);
    setCookie("ai_pw", pw.trim());

    const params = new URLSearchParams(window.location.search);
    const next = params.get("next") || "/ai";
    window.location.href = next;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-3 shadow-lg">
              <span className="text-white font-bold text-2xl">Z</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">ZIVO AI Builder</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Enter your password to continue</p>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <input
                id="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                type="password"
                placeholder="Enter password"
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40 text-base"
                aria-describedby={err ? "login-error" : undefined}
              />
            </div>

            {err && (
              <div
                id="login-error"
                role="alert"
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
              >
                <span aria-hidden="true">⚠️</span>
                <span className="text-sm text-red-700 dark:text-red-400 font-medium">{err}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Signing in...
                </>
              ) : (
                '🔓 Sign In to Builder'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 text-center">
            <Link href="/" className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
