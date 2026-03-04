'use client';
import { useState } from 'react';

type SpecType = 'PRD' | 'API Spec' | 'DB Schema';

interface GenerateResponse {
  spec: string;
}

const SPEC_DESCRIPTIONS: Record<SpecType, string> = {
  PRD: 'Product Requirements Document',
  'API Spec': 'OpenAPI / REST Specification',
  'DB Schema': 'Database Schema (SQL)',
};

export default function SpecGeneratorPage() {
  const [input, setInput] = useState('');
  const [specType, setSpecType] = useState<SpecType>('PRD');
  const [generatedSpec, setGeneratedSpec] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    setGeneratedSpec('');
    try {
      const res = await fetch('/api/spec-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: input, specType }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json() as GenerateResponse;
      setGeneratedSpec(data.spec);
    } catch {
      setError('Failed to generate spec. Check the API endpoint or try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedSpec).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = specType === 'API Spec' ? 'yaml' : specType === 'DB Schema' ? 'sql' : 'md';
    const blob = new Blob([generatedSpec], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spec-${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const specTypes: SpecType[] = ['PRD', 'API Spec', 'DB Schema'];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <h1 className="text-2xl font-bold mb-2">Spec Generator</h1>
      <p className="text-gray-400 text-sm mb-8">Describe your feature or system in plain English and generate structured specifications.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Panel */}
        <section className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Spec Type</label>
            <div className="flex gap-2">
              {specTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setSpecType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${specType === type ? 'bg-[#6366f1] text-white' : 'bg-[#111111] text-gray-400 hover:text-white border border-white/10'}`}
                >
                  {type}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">{SPEC_DESCRIPTIONS[specType]}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Natural Language Description</label>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              rows={12}
              placeholder={`Describe what you need in plain English…\n\nExample: "Build a user authentication system with email/password login, OAuth, JWT tokens, password reset via email, and rate limiting on login attempts."`}
              className="w-full bg-[#111111] border border-white/10 rounded-xl p-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#6366f1] resize-none leading-relaxed"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !input.trim()}
            className="w-full bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Generating…
              </>
            ) : `Generate ${specType}`}
          </button>

          {error && <p className="text-red-400 text-sm bg-red-950/30 border border-red-700/50 rounded-lg p-3">{error}</p>}
        </section>

        {/* Output Panel */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-300">Generated Spec</label>
            {generatedSpec && (
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="bg-[#1a1a1a] hover:bg-[#252525] border border-white/10 text-xs text-gray-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
                <button
                  onClick={handleDownload}
                  className="bg-[#6366f1]/20 hover:bg-[#6366f1]/30 border border-[#6366f1]/40 text-xs text-[#6366f1] px-3 py-1.5 rounded-lg transition-colors"
                >
                  Download
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <pre className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 text-xs text-gray-300 font-mono overflow-auto min-h-[400px] max-h-[600px] leading-relaxed whitespace-pre-wrap">
              <code>
                {generatedSpec || (
                  <span className="text-gray-600">
                    {`// Your generated ${specType} will appear here.\n// Fill in the description on the left and click Generate.`}
                  </span>
                )}
              </code>
            </pre>
            {loading && (
              <div className="absolute inset-0 bg-[#1a1a1a]/80 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <svg className="animate-spin w-8 h-8 text-[#6366f1] mx-auto mb-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <p className="text-sm text-gray-400">Generating your {specType}…</p>
                </div>
              </div>
            )}
          </div>

          {generatedSpec && (
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
              <span>{generatedSpec.split('\n').length} lines</span>
              <span>{generatedSpec.length} characters</span>
              <span className="text-green-400">✓ Generated</span>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
