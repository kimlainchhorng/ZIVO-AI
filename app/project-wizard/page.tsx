'use client';
import { useState } from 'react';

const APP_TYPES = ['SaaS', 'E-commerce', 'Portfolio', 'Dashboard', 'Blog', 'API Service'];
const STACKS = ['Next.js 15', 'React + Vite', 'Python FastAPI'];
const FEATURES = ['Auth', 'Payments', 'Database', 'Real-time', 'AI', 'Analytics'];

const STEPS = ['App Type', 'Tech Stack', 'Features', 'Review & Generate'];

export default function ProjectWizard() {
  const [step, setStep] = useState(0);
  const [appType, setAppType] = useState('');
  const [stack, setStack] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  function toggleFeature(f: string) {
    setFeatures((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  }

  async function generate() {
    setLoading(true);
    const prompt = `Generate a project scaffold for a ${appType} app using ${stack} with features: ${features.join(', ')}.`;
    const res = await fetch('/api/builder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, appType, stack, features }),
    });
    const data = await res.json() as { result?: string; error?: string };
    setResult(data.result ?? data.error ?? 'Done');
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Project Wizard</h1>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              i < step ? 'bg-[#6366f1]' : i === step ? 'bg-[#6366f1] ring-2 ring-[#6366f1]/40' : 'bg-gray-800 text-gray-500'
            }`}>{i + 1}</div>
            <span className={`text-sm hidden sm:block ${i === step ? 'text-white' : 'text-gray-500'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`h-px w-6 ${i < step ? 'bg-[#6366f1]' : 'bg-gray-700'}`} />}
          </div>
        ))}
      </div>

      {/* Step 0 */}
      {step === 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">What type of app?</h2>
          <div className="grid grid-cols-2 gap-3">
            {APP_TYPES.map((t) => (
              <button key={t} onClick={() => setAppType(t)}
                className={`p-4 rounded-xl border text-left transition-colors ${appType === t ? 'border-[#6366f1] bg-[#6366f1]/10' : 'border-gray-700 bg-[#111] hover:border-gray-500'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 1 */}
      {step === 1 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Choose your tech stack</h2>
          <div className="flex flex-col gap-3">
            {STACKS.map((s) => (
              <button key={s} onClick={() => setStack(s)}
                className={`p-4 rounded-xl border text-left transition-colors ${stack === s ? 'border-[#6366f1] bg-[#6366f1]/10' : 'border-gray-700 bg-[#111] hover:border-gray-500'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Select features</h2>
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <button key={f} onClick={() => toggleFeature(f)}
                className={`p-4 rounded-xl border text-left transition-colors flex items-center gap-3 ${features.includes(f) ? 'border-[#6366f1] bg-[#6366f1]/10' : 'border-gray-700 bg-[#111] hover:border-gray-500'}`}>
                <span className={`w-4 h-4 rounded border-2 flex items-center justify-center ${features.includes(f) ? 'border-[#6366f1] bg-[#6366f1]' : 'border-gray-600'}`}>
                  {features.includes(f) && <span className="text-white text-xs">✓</span>}
                </span>
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Review & Generate</h2>
          <div className="bg-[#111] border border-gray-800 rounded-xl p-4 mb-4 space-y-2">
            <div className="flex justify-between"><span className="text-gray-400">App Type</span><span>{appType || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Stack</span><span>{stack || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Features</span><span>{features.join(', ') || 'None'}</span></div>
          </div>
          {result && (
            <pre className="bg-[#111] border border-gray-800 rounded-xl p-4 text-sm text-green-400 whitespace-pre-wrap mb-4">{result}</pre>
          )}
          <button onClick={generate} disabled={loading}
            className="w-full py-3 rounded-xl bg-[#6366f1] hover:bg-[#5254cc] font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {loading ? 'Generating…' : 'Generate Project'}
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button onClick={() => setStep((s) => s - 1)} disabled={step === 0}
          className="px-6 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 transition-colors">
          Previous
        </button>
        {step < STEPS.length - 1 && (
          <button onClick={() => setStep((s) => s + 1)}
            className="px-6 py-2 rounded-lg bg-[#6366f1] hover:bg-[#5254cc] transition-colors">
            Next
          </button>
        )}
      </div>
    </main>
  );
}
