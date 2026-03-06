'use client';
import { useState } from 'react';

type Provider = 'fullstory' | 'posthog' | 'hotjar';

const PROVIDERS: { id: Provider; name: string; logo: string }[] = [
  { id: 'fullstory', name: 'FullStory', logo: '🎬' },
  { id: 'posthog', name: 'PostHog', logo: '🦔' },
  { id: 'hotjar', name: 'Hotjar', logo: '🔥' },
];

export default function SessionReplay() {
  const [provider, setProvider] = useState<Provider>('posthog');
  const [siteId, setSiteId] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function generateCode() {
    if (!siteId.trim()) return;
    setLoading(true);
    const res = await fetch('/api/session-replay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, siteId }),
    });
    const data = await res.json() as { result?: string; code?: string; error?: string };
    setCode(data.code ?? data.result ?? '');
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Session Replay</h1>
      <p className="text-gray-400 mb-6">Generate integration code for session recording tools</p>

      {/* Provider selector */}
      <div className="flex gap-3 mb-6">
        {PROVIDERS.map((p) => (
          <button key={p.id} onClick={() => setProvider(p.id)}
            className={`flex-1 p-4 rounded-xl border flex flex-col items-center gap-2 transition-colors ${
              provider === p.id ? 'border-[#6366f1] bg-[#6366f1]/10' : 'border-gray-700 bg-[#111] hover:border-gray-500'
            }`}>
            <span className="text-3xl">{p.logo}</span>
            <span className="text-sm font-medium">{p.name}</span>
          </button>
        ))}
      </div>

      {/* Config form */}
      <div className="bg-[#111] border border-gray-800 rounded-xl p-4 mb-4">
        <label className="block text-sm text-gray-400 mb-1">Site / Project ID</label>
        <input
          type="text"
          value={siteId}
          onChange={(e) => setSiteId(e.target.value)}
          placeholder={provider === 'hotjar' ? 'e.g. 1234567' : provider === 'posthog' ? 'phc_xxxxxxxx' : 'your-org.fullstory.com'}
          className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#6366f1]"
        />
      </div>

      <button onClick={generateCode} disabled={loading || !siteId.trim()}
        className="px-6 py-2.5 rounded-lg bg-[#6366f1] hover:bg-[#5254cc] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-6">
        {loading ? 'Generating…' : 'Generate Integration Code'}
      </button>

      {code && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 mb-2">Integration Code</h2>
          <pre className="bg-[#111] border border-gray-800 rounded-xl p-4 text-sm text-green-400 overflow-x-auto whitespace-pre-wrap">{code}</pre>
        </div>
      )}
    </main>
  );
}
