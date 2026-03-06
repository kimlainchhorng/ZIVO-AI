'use client';
import { useState } from 'react';

type Platform = 'iOS' | 'Android' | 'Both';

interface GeneratePipelineResponse {
  yaml: string;
}

const FEATURES = [
  { id: 'code_signing', label: 'Code Signing', description: 'Automated certificate and provisioning profile management' },
  { id: 'push_notifications', label: 'Push Notifications', description: 'APNs / FCM configuration and testing' },
  { id: 'app_store_deploy', label: 'App Store Deploy', description: 'Automated submission to App Store / Google Play' },
  { id: 'testflight', label: 'TestFlight / Internal Track', description: 'Upload to TestFlight or Play internal testing' },
];

const PLACEHOLDER_YAML = `# Generated pipeline will appear here
# Configure platform, app name, and features then click Generate`;

export default function MobilePipelinePage() {
  const [platform, setPlatform] = useState<Platform>('iOS');
  const [appName, setAppName] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set(['code_signing']));
  const [generatedYaml, setGeneratedYaml] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const toggleFeature = (id: string) => {
    setSelectedFeatures(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (!appName.trim()) return;
    setLoading(true);
    setError('');
    setGeneratedYaml('');
    try {
      const res = await fetch('/api/mobile-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, appName, features: Array.from(selectedFeatures) }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json() as GeneratePipelineResponse;
      setGeneratedYaml(data.yaml);
    } catch {
      setError('Failed to generate pipeline. Check the API endpoint or try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedYaml).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedYaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${appName.replace(/\s+/g, '-').toLowerCase()}-pipeline.yml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const platforms: Platform[] = ['iOS', 'Android', 'Both'];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <h1 className="text-2xl font-bold mb-2">Mobile Pipeline</h1>
      <p className="text-gray-400 text-sm mb-8">Generate CI/CD pipeline configurations for iOS and Android apps.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Config Panel */}
        <section className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Platform</label>
            <div className="flex gap-2">
              {platforms.map(p => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${platform === p ? 'bg-[#6366f1] text-white' : 'bg-[#111111] text-gray-400 hover:text-white border border-white/10'}`}
                >
                  {p === 'iOS' ? '🍎 iOS' : p === 'Android' ? '🤖 Android' : '📱 Both'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">App Name</label>
            <input
              value={appName}
              onChange={e => setAppName(e.target.value)}
              placeholder="e.g. MyAwesomeApp"
              className="w-full bg-[#111111] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#6366f1]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Features</label>
            <div className="space-y-2">
              {FEATURES.map(feature => {
                const isChecked = selectedFeatures.has(feature.id);
                return (
                  <label key={feature.id} className="flex items-start gap-3 bg-[#111111] border border-white/10 rounded-lg p-4 cursor-pointer hover:border-[#6366f1]/40 transition-colors">
                    <div className="flex-shrink-0 mt-0.5">
                      <div
                        onClick={() => toggleFeature(feature.id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${isChecked ? 'bg-[#6366f1] border-[#6366f1]' : 'border-gray-600 hover:border-gray-400'}`}
                      >
                        {isChecked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                    </div>
                    <div onClick={() => toggleFeature(feature.id)} className="flex-1">
                      <p className="text-sm font-medium">{feature.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{feature.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !appName.trim()}
            className="w-full bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Generating Pipeline…
              </>
            ) : 'Generate Pipeline'}
          </button>

          {error && <p className="text-red-400 text-sm bg-red-950/30 border border-red-700/50 rounded-lg p-3">{error}</p>}
        </section>

        {/* Output Panel */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-300">
              Generated YAML
              {generatedYaml && <span className="text-xs text-gray-500 ml-2">({platform} • {selectedFeatures.size} features)</span>}
            </label>
            {generatedYaml && (
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
            <pre className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 text-xs text-gray-300 font-mono overflow-auto min-h-[500px] max-h-[700px] leading-relaxed whitespace-pre-wrap">
              <code>{generatedYaml || <span className="text-gray-600">{PLACEHOLDER_YAML}</span>}</code>
            </pre>
            {loading && (
              <div className="absolute inset-0 bg-[#1a1a1a]/80 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <svg className="animate-spin w-8 h-8 text-[#6366f1] mx-auto mb-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <p className="text-sm text-gray-400">Building pipeline config…</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
