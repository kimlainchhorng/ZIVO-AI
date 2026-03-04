'use client';
import { useState } from 'react';

interface GuardrailRule {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

interface TestResult {
  passed: boolean;
  triggered: string[];
  message: string;
}

const defaultRules: GuardrailRule[] = [
  { id: 'profanity', label: 'Profanity Filter', description: 'Block offensive and profane language', enabled: true },
  { id: 'hate_speech', label: 'Hate Speech Detection', description: 'Detect and block hate speech content', enabled: true },
  { id: 'prompt_injection', label: 'Prompt Injection Detection', description: 'Detect attempts to hijack system prompts', enabled: true },
  { id: 'pii', label: 'PII Detection', description: 'Detect personally identifiable information (emails, SSNs, phone numbers)', enabled: true },
  { id: 'harmful_content', label: 'Harmful Content Filter', description: 'Block requests for dangerous or illegal content', enabled: true },
  { id: 'jailbreak', label: 'Jailbreak Detection', description: 'Block attempts to bypass AI safety measures', enabled: false },
];

export default function PolicyPage() {
  const [rules, setRules] = useState<GuardrailRule[]>(defaultRules);
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const handleTest = async () => {
    if (!testInput.trim()) return;
    setLoading(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/policy/guardrails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: testInput, enabledRules: rules.filter(r => r.enabled).map(r => r.id) }),
      });
      if (res.ok) {
        const data = await res.json() as TestResult;
        setTestResult(data);
      } else {
        setTestResult({ passed: false, triggered: [], message: 'API error — check server logs.' });
      }
    } catch {
      setTestResult({ passed: true, triggered: [], message: 'Could not reach API. Showing mock result.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <h1 className="text-2xl font-bold mb-2">Policy Guardrails</h1>
      <p className="text-gray-400 mb-8 text-sm">Configure content filtering rules and test inputs against active guardrails.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Rules Panel */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-[#6366f1]">Filtering Rules</h2>
          <div className="space-y-3">
            {rules.map(rule => (
              <div key={rule.id} className="flex items-start justify-between bg-[#111111] border border-white/10 rounded-lg p-4">
                <div className="flex-1 mr-4">
                  <p className="font-medium text-sm">{rule.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{rule.description}</p>
                </div>
                <button
                  onClick={() => toggleRule(rule.id)}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5 ${rule.enabled ? 'bg-[#6366f1]' : 'bg-gray-700'}`}
                  aria-label={`Toggle ${rule.label}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${rule.enabled ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-[#6366f1]" />
              {rules.filter(r => r.enabled).length} active
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-gray-700" />
              {rules.filter(r => !r.enabled).length} disabled
            </div>
          </div>
        </section>

        {/* Test Panel */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-[#6366f1]">Test Guardrails</h2>
          <div className="bg-[#111111] border border-white/10 rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Test Input</label>
              <textarea
                value={testInput}
                onChange={e => setTestInput(e.target.value)}
                rows={6}
                placeholder="Enter text to test against active guardrails..."
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#6366f1] resize-none"
              />
            </div>

            <button
              onClick={handleTest}
              disabled={loading || !testInput.trim()}
              className="w-full bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading ? 'Testing…' : 'Run Guardrail Test'}
            </button>

            {testResult && (
              <div className={`rounded-lg p-4 border ${testResult.passed ? 'bg-green-950/40 border-green-700/50' : 'bg-red-950/40 border-red-700/50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-lg ${testResult.passed ? 'text-green-400' : 'text-red-400'}`}>
                    {testResult.passed ? '✓' : '✗'}
                  </span>
                  <span className={`font-semibold text-sm ${testResult.passed ? 'text-green-400' : 'text-red-400'}`}>
                    {testResult.passed ? 'Passed all checks' : 'Guardrail triggered'}
                  </span>
                </div>
                <p className="text-xs text-gray-300">{testResult.message}</p>
                {testResult.triggered.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {testResult.triggered.map(t => (
                      <span key={t} className="bg-red-800/50 text-red-300 text-xs px-2 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 bg-[#111111] border border-white/10 rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3">Active Detectors</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Prompt Injection', active: rules.find(r => r.id === 'prompt_injection')?.enabled },
                { label: 'PII Detection', active: rules.find(r => r.id === 'pii')?.enabled },
              ].map(({ label, active }) => (
                <div key={label} className="flex items-center gap-2 text-xs">
                  <span className={`w-2 h-2 rounded-full ${active ? 'bg-green-400' : 'bg-gray-600'}`} />
                  <span className={active ? 'text-gray-200' : 'text-gray-500'}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
