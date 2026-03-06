'use client';
import { useState } from 'react';

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

interface ReviewIssue {
  id: string;
  severity: Severity;
  category: string;
  line?: number;
  message: string;
  suggestion: string;
}

interface DiffSection {
  before: string;
  after: string;
  description: string;
}

interface ReviewResponse {
  issues: ReviewIssue[];
  diff: DiffSection[];
  summary: string;
}

const LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'Go', 'Rust', 'Java', 'C#', 'Ruby', 'PHP', 'SQL'];

const SEVERITY_STYLES: Record<Severity, string> = {
  critical: 'bg-red-900/50 text-red-300 border-red-700/50',
  high: 'bg-orange-900/50 text-orange-300 border-orange-700/50',
  medium: 'bg-amber-900/50 text-amber-300 border-amber-700/50',
  low: 'bg-blue-900/50 text-blue-300 border-blue-700/50',
  info: 'bg-gray-800/50 text-gray-300 border-gray-700/50',
};

const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];

export default function AICodeReviewPage() {
  const [language, setLanguage] = useState('TypeScript');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewResponse | null>(null);
  const [error, setError] = useState('');
  const [activeDiffIndex, setActiveDiffIndex] = useState(0);

  const handleReview = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/ai-code-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json() as ReviewResponse;
      setResult(data);
    } catch {
      setError('Failed to run code review. Check the API endpoint or try again.');
    } finally {
      setLoading(false);
    }
  };

  const issuesBySeverity = result
    ? SEVERITY_ORDER.flatMap(s => result.issues.filter(i => i.severity === s))
    : [];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <h1 className="text-2xl font-bold mb-2">AI Code Review</h1>
      <p className="text-gray-400 text-sm mb-8">Paste your code for an automated review covering bugs, security, performance, and style.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Panel */}
        <section className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#6366f1]"
            >
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Code</label>
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              rows={18}
              placeholder={`// Paste your ${language} code here…\n// The AI will review for:\n// - Bugs & logic errors\n// - Security vulnerabilities\n// - Performance issues\n// - Code style & best practices`}
              className="w-full bg-[#111111] border border-white/10 rounded-xl p-4 text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-[#6366f1] resize-none leading-relaxed"
              spellCheck={false}
            />
          </div>

          <button
            onClick={handleReview}
            disabled={loading || !code.trim()}
            className="w-full bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Reviewing Code…
              </>
            ) : '🔍 Review Code'}
          </button>

          {error && <p className="text-red-400 text-sm bg-red-950/30 border border-red-700/50 rounded-lg p-3">{error}</p>}
        </section>

        {/* Results Panel */}
        <section className="space-y-6">
          {loading && (
            <div className="bg-[#111111] border border-white/10 rounded-xl p-8 flex flex-col items-center justify-center gap-3">
              <svg className="animate-spin w-10 h-10 text-[#6366f1]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p className="text-gray-400 text-sm">AI is reviewing your code…</p>
              <p className="text-gray-600 text-xs">Checking for bugs, security issues, and improvements</p>
            </div>
          )}

          {result && !loading && (
            <>
              {/* Summary */}
              {result.summary && (
                <div className="bg-[#111111] border border-[#6366f1]/30 rounded-xl p-4">
                  <h2 className="text-sm font-semibold text-[#6366f1] mb-2">Summary</h2>
                  <p className="text-sm text-gray-300">{result.summary}</p>
                </div>
              )}

              {/* Issues */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-300">Issues Found</h2>
                  <div className="flex gap-2 text-xs">
                    {SEVERITY_ORDER.map(s => {
                      const count = result.issues.filter(i => i.severity === s).length;
                      return count > 0 ? (
                        <span key={s} className={`px-2 py-0.5 rounded border ${SEVERITY_STYLES[s]}`}>{count} {s}</span>
                      ) : null;
                    })}
                  </div>
                </div>

                {issuesBySeverity.length === 0 ? (
                  <div className="bg-green-950/20 border border-green-700/30 rounded-xl p-4 text-center">
                    <p className="text-green-400 text-sm font-medium">✓ No issues found!</p>
                    <p className="text-gray-400 text-xs mt-1">Your code looks clean.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {issuesBySeverity.map(issue => (
                      <div key={issue.id} className="bg-[#111111] border border-white/10 rounded-lg p-4">
                        <div className="flex items-start gap-2 mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded border flex-shrink-0 ${SEVERITY_STYLES[issue.severity]}`}>{issue.severity}</span>
                          <span className="text-xs text-gray-400 bg-[#1a1a1a] px-2 py-0.5 rounded">{issue.category}</span>
                          {issue.line && <span className="text-xs text-gray-500">Line {issue.line}</span>}
                        </div>
                        <p className="text-sm text-gray-200 mb-1">{issue.message}</p>
                        <p className="text-xs text-gray-400">💡 {issue.suggestion}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Diff Viewer */}
              {result.diff.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-300 mb-3">Suggested Changes</h2>

                  {result.diff.length > 1 && (
                    <div className="flex gap-1 mb-3 overflow-x-auto">
                      {result.diff.map((d, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveDiffIndex(i)}
                          className={`px-3 py-1.5 rounded text-xs flex-shrink-0 transition-colors ${activeDiffIndex === i ? 'bg-[#6366f1] text-white' : 'bg-[#111111] text-gray-400 border border-white/10 hover:text-white'}`}
                        >
                          {d.description}
                        </button>
                      ))}
                    </div>
                  )}

                  {result.diff[activeDiffIndex] && (
                    <div>
                      <p className="text-xs text-gray-400 mb-2">{result.diff[activeDiffIndex].description}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-red-400 mb-1">Before</p>
                          <pre className="bg-red-950/20 border border-red-700/30 rounded-lg p-3 text-xs font-mono text-red-200 overflow-auto max-h-48 whitespace-pre-wrap">
                            {result.diff[activeDiffIndex].before}
                          </pre>
                        </div>
                        <div>
                          <p className="text-xs text-green-400 mb-1">After</p>
                          <pre className="bg-green-950/20 border border-green-700/30 rounded-lg p-3 text-xs font-mono text-green-200 overflow-auto max-h-48 whitespace-pre-wrap">
                            {result.diff[activeDiffIndex].after}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {!result && !loading && (
            <div className="bg-[#111111] border border-white/10 rounded-xl p-8 text-center text-gray-500">
              <p className="text-2xl mb-3">🔍</p>
              <p className="text-sm">Paste code and click Review to get AI-powered feedback.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
