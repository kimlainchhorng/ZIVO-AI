'use client';
import { useState } from 'react';

interface Violation {
  id: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  fix: string;
}

const SEVERITY_COLORS: Record<Violation['severity'], string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  serious: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  moderate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  minor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export default function A11yChecker() {
  const [html, setHtml] = useState('');
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);

  async function runCheck() {
    if (!html.trim()) return;
    setLoading(true);
    setRan(false);
    try {
      const res = await fetch('/api/a11y-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html }),
      });
      const data = await res.json() as { result?: string; error?: string };
      // Try to parse JSON from result
      const raw = data.result ?? '';
      const parsed = JSON.parse(raw) as Violation[];
      setViolations(Array.isArray(parsed) ? parsed : []);
    } catch {
      setViolations([]);
    }
    setRan(true);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Accessibility Checker</h1>
      <p className="text-gray-400 mb-6">Paste HTML/JSX to detect WCAG violations</p>

      <textarea
        value={html}
        onChange={(e) => setHtml(e.target.value)}
        placeholder="Paste your HTML or JSX here…"
        rows={8}
        className="w-full bg-[#111] border border-gray-700 rounded-xl p-4 text-sm font-mono text-white placeholder-gray-600 focus:outline-none focus:border-[#6366f1] mb-4 resize-y"
      />

      <button onClick={runCheck} disabled={loading || !html.trim()}
        className="px-6 py-2.5 rounded-lg bg-[#6366f1] hover:bg-[#5254cc] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-6">
        {loading ? 'Checking…' : 'Run Accessibility Check'}
      </button>

      {ran && (
        <div>
          <h2 className="text-lg font-semibold mb-3">
            {violations.length === 0 ? '✅ No violations found' : `⚠️ ${violations.length} violation(s) found`}
          </h2>
          <div className="space-y-3">
            {violations.map((v) => (
              <div key={v.id} className="bg-[#111] border border-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${SEVERITY_COLORS[v.severity]}`}>
                    {v.severity}
                  </span>
                  <span className="font-medium">{v.id}</span>
                </div>
                <p className="text-gray-300 text-sm mb-2">{v.description}</p>
                <div className="bg-[#1a1a1a] rounded-lg p-3 text-sm text-green-400">
                  <span className="text-gray-500 mr-2">Fix:</span>{v.fix}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
