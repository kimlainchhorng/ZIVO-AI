'use client';
import { useState } from 'react';

type HelpProvider = 'intercom' | 'crisp' | 'custom';

const PROVIDERS: { id: HelpProvider; name: string; emoji: string }[] = [
  { id: 'intercom', name: 'Intercom', emoji: '💬' },
  { id: 'crisp', name: 'Crisp', emoji: '🟢' },
  { id: 'custom', name: 'Custom Docs', emoji: '📚' },
];

export default function HelpCenter() {
  const [provider, setProvider] = useState<HelpProvider>('intercom');
  const [config, setConfig] = useState({ appId: '', websiteId: '', docsUrl: '' });
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function generateCode() {
    setLoading(true);
    const res = await fetch('/api/help-center', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, config }),
    });
    const data = await res.json() as { code?: string; result?: string };
    setCode(data.code ?? data.result ?? '');
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Help Center</h1>
      <p className="text-gray-400 mb-6">Generate integration code for customer support tools</p>

      <div className="flex gap-3 mb-6">
        {PROVIDERS.map((p) => (
          <button key={p.id} onClick={() => setProvider(p.id)}
            className={`flex-1 p-4 rounded-xl border flex flex-col items-center gap-2 transition-colors ${
              provider === p.id ? 'border-[#6366f1] bg-[#6366f1]/10' : 'border-gray-700 bg-[#111] hover:border-gray-500'
            }`}>
            <span className="text-3xl">{p.emoji}</span>
            <span className="text-sm font-medium">{p.name}</span>
          </button>
        ))}
      </div>

      <div className="bg-[#111] border border-gray-800 rounded-xl p-4 mb-4 space-y-3">
        {provider === 'intercom' && (
          <div>
            <label className="block text-sm text-gray-400 mb-1">App ID</label>
            <input value={config.appId} onChange={(e) => setConfig({ ...config, appId: e.target.value })}
              placeholder="abc12345"
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#6366f1]" />
          </div>
        )}
        {provider === 'crisp' && (
          <div>
            <label className="block text-sm text-gray-400 mb-1">Website ID</label>
            <input value={config.websiteId} onChange={(e) => setConfig({ ...config, websiteId: e.target.value })}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#6366f1]" />
          </div>
        )}
        {provider === 'custom' && (
          <div>
            <label className="block text-sm text-gray-400 mb-1">Docs URL</label>
            <input value={config.docsUrl} onChange={(e) => setConfig({ ...config, docsUrl: e.target.value })}
              placeholder="https://docs.yourapp.com"
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#6366f1]" />
          </div>
        )}
      </div>

      <button onClick={generateCode} disabled={loading}
        className="px-6 py-2.5 rounded-lg bg-[#6366f1] hover:bg-[#5254cc] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-6">
        {loading ? 'Generating…' : 'Generate Code'}
      </button>

      {code && (
        <pre className="bg-[#111] border border-gray-800 rounded-xl p-4 text-sm text-green-400 overflow-x-auto whitespace-pre-wrap">{code}</pre>
      )}
    </main>
  );
}
