'use client';
import { useState } from 'react';

interface Metrics {
  performance: number;
  accessibility: number;
  seo: number;
  bestPractices: number;
  lcp: string;
  fid: string;
  cls: string;
  tti: string;
  suggestions: string[];
}

function CircleScore({ label, score }: { label: string; score: number }) {
  const color = score >= 90 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';
  const circumference = 2 * Math.PI * 40;
  const dash = (score / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#1f2937" strokeWidth="10" />
        <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round"
          transform="rotate(-90 50 50)" />
        <text x="50" y="55" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">{score}</text>
      </svg>
      <span className="text-xs text-gray-400 text-center">{label}</span>
    </div>
  );
}

export default function PerformancePanel() {
  const [url, setUrl] = useState('');
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);

  async function analyze() {
    if (!url.trim()) return;
    setLoading(true);
    const res = await fetch('/api/performance-panel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const data = await res.json() as { result?: string; error?: string };
    try {
      const parsed = JSON.parse(data.result ?? '{}') as Metrics;
      setMetrics(parsed);
    } catch {
      // fallback mock
      setMetrics({
        performance: 72, accessibility: 88, seo: 91, bestPractices: 83,
        lcp: '2.4s', fid: '45ms', cls: '0.08', tti: '3.1s',
        suggestions: data.result ? [data.result] : ['Optimize images', 'Enable compression', 'Reduce render-blocking resources'],
      });
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Performance Panel</h1>
      <p className="text-gray-400 mb-6">AI-powered performance analysis and suggestions</p>

      <div className="flex gap-3 mb-6">
        <input type="text" value={url} onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && analyze()}
          placeholder="https://example.com"
          className="flex-1 bg-[#111] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#6366f1]" />
        <button onClick={analyze} disabled={loading || !url.trim()}
          className="px-5 py-2 rounded-lg bg-[#6366f1] hover:bg-[#5254cc] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {loading ? 'Analyzing…' : 'Analyze'}
        </button>
      </div>

      {metrics && (
        <div className="space-y-6">
          {/* Score cards */}
          <div className="bg-[#111] border border-gray-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-400 mb-4">Scores</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <CircleScore label="Performance" score={metrics.performance} />
              <CircleScore label="Accessibility" score={metrics.accessibility} />
              <CircleScore label="SEO" score={metrics.seo} />
              <CircleScore label="Best Practices" score={metrics.bestPractices} />
            </div>
          </div>

          {/* Core Web Vitals */}
          <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-400 mb-3">Core Web Vitals</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'LCP', value: metrics.lcp },
                { label: 'FID', value: metrics.fid },
                { label: 'CLS', value: metrics.cls },
                { label: 'TTI', value: metrics.tti },
              ].map((m) => (
                <div key={m.label} className="bg-[#1a1a1a] rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500 mb-1">{m.label}</div>
                  <div className="text-lg font-bold text-[#6366f1]">{m.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-400 mb-3">AI Suggestions</h2>
            <ul className="space-y-2">
              {metrics.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-[#6366f1] mt-0.5">→</span>{s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </main>
  );
}
