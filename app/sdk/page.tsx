'use client';
import NavBar from '../components/NavBar';
import { useState } from 'react';

const COLORS = {
  bg: "#0a0b14", bgPanel: "#0f1120", bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)", accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  textPrimary: "#f1f5f9", textSecondary: "#94a3b8", textMuted: "#64748b",
  success: "#22c55e", warning: "#f59e0b", error: "#ef4444",
};

const fadeInCSS = '@keyframes fadeIn { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }';

const SDK_SNIPPETS: Record<string, string> = {
  TypeScript: `import { ZivoClient } from '@zivo/sdk';

class ZivoClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.zivo.ai';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateSite(prompt: string): Promise<{ html: string; css: string }> {
    const res = await fetch(\`\${this.baseUrl}/api/generate-site\`, {
      method: 'POST',
      headers: { 'Authorization': \`Bearer \${this.apiKey}\`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    return res.json();
  }

  async getEmbeddings(text: string): Promise<{ vector: number[]; model: string }> {
    const res = await fetch(\`\${this.baseUrl}/api/embeddings\`, {
      method: 'POST',
      headers: { 'Authorization': \`Bearer \${this.apiKey}\`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return res.json();
  }

  async runAgent(task: string, context?: object): Promise<{ result: string; steps: string[] }> {
    const res = await fetch(\`\${this.baseUrl}/api/agent-run\`, {
      method: 'POST',
      headers: { 'Authorization': \`Bearer \${this.apiKey}\`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, context }),
    });
    return res.json();
  }
}

export default ZivoClient;`,

  Python: `import requests

class ZivoClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.zivo.ai"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    def generate_site(self, prompt: str) -> dict:
        res = requests.post(
            f"{self.base_url}/api/generate-site",
            headers=self.headers,
            json={"prompt": prompt}
        )
        return res.json()

    def get_embeddings(self, text: str) -> dict:
        res = requests.post(
            f"{self.base_url}/api/embeddings",
            headers=self.headers,
            json={"text": text}
        )
        return res.json()

    def run_agent(self, task: str, context: dict = None) -> dict:
        res = requests.post(
            f"{self.base_url}/api/agent-run",
            headers=self.headers,
            json={"task": task, "context": context or {}}
        )
        return res.json()`,

  cURL: `# Generate Site
curl -X POST https://api.zivo.ai/api/generate-site \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "A landing page for a SaaS product"}'

# Get Embeddings
curl -X POST https://api.zivo.ai/api/embeddings \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"text": "Hello, world!", "model": "text-embedding-3-small"}'

# Run Agent
curl -X POST https://api.zivo.ai/api/agent-run \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"task": "Summarize these documents", "context": {"docs": []}}'`,

  JavaScript: `const zivoClient = {
  apiKey: 'YOUR_API_KEY',
  baseUrl: 'https://api.zivo.ai',

  async generateSite(prompt) {
    const res = await fetch(\`\${this.baseUrl}/api/generate-site\`, {
      method: 'POST',
      headers: { 'Authorization': \`Bearer \${this.apiKey}\`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    return res.json();
  },

  async getEmbeddings(text) {
    const res = await fetch(\`\${this.baseUrl}/api/embeddings\`, {
      method: 'POST',
      headers: { 'Authorization': \`Bearer \${this.apiKey}\`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return res.json();
  },

  async runAgent(task, context = {}) {
    const res = await fetch(\`\${this.baseUrl}/api/agent-run\`, {
      method: 'POST',
      headers: { 'Authorization': \`Bearer \${this.apiKey}\`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, context }),
    });
    return res.json();
  },
};`,
};

const ENDPOINTS = [
  '/api/generate-site', '/api/embeddings', '/api/agent-run',
  '/api/prompt-library', '/api/health', '/api/knowledge-base',
];

const SNIPPET_LIBRARY = [
  { title: 'Authenticate with Bearer token', lang: 'TypeScript', code: "headers: { 'Authorization': `Bearer ${apiKey}` }" },
  { title: 'Stream response with SSE', lang: 'TypeScript', code: "const stream = await client.stream('/api/generate-site', body);" },
  { title: 'Retry on 429 Rate Limit', lang: 'Python', code: "if res.status_code == 429:\n    time.sleep(2 ** attempt)\n    return self._retry(fn, attempt+1)" },
  { title: 'Batch embed documents', lang: 'cURL', code: "curl -X POST .../api/embeddings -d '{\"texts\": [\"doc1\",\"doc2\"]}'" },
];

const MOCK_PLAY_RESPONSE = { status: 'ok', endpoint: '/api/embeddings', result: { vector: [0.12, -0.34, 0.87], model: 'text-embedding-3-small', tokens: 6 } };

export default function SdkPage() {
  const [lang, setLang] = useState('TypeScript');
  const [endpoint, setEndpoint] = useState(ENDPOINTS[0]);
  const [param1, setParam1] = useState('');
  const [param2, setParam2] = useState('');
  const [playLoading, setPlayLoading] = useState(false);
  const [playResponse, setPlayResponse] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState<number | null>(null);
  const [sdkCopied, setSdkCopied] = useState(false);

  function copySDK() {
    navigator.clipboard.writeText(SDK_SNIPPETS[lang]).then(() => {
      setSdkCopied(true);
      setTimeout(() => setSdkCopied(false), 2000);
    });
  }

  function downloadSDK() {
    window.alert(`Downloading SDK as zivo-client.${lang === 'TypeScript' ? 'ts' : lang === 'Python' ? 'py' : lang === 'cURL' ? 'sh' : 'js'}`);
  }

  function tryIt() {
    setPlayLoading(true);
    setTimeout(() => {
      setPlayResponse(JSON.stringify({ ...MOCK_PLAY_RESPONSE, endpoint, params: { param1, param2 } }, null, 2));
      setPlayLoading(false);
    }, 500);
  }

  function copySnippet(i: number, code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedSnippet(i);
      setTimeout(() => setCopiedSnippet(null), 2000);
    });
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.textPrimary }}>
      <style>{fadeInCSS}</style>
      <NavBar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>SDK & Developer Playground</h1>
        <p style={{ color: COLORS.textSecondary, marginBottom: 28 }}>Ready-to-use SDK code and interactive API playground</p>

        {/* Language tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {Object.keys(SDK_SNIPPETS).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                padding: '8px 18px', borderRadius: 8, border: `1px solid ${lang === l ? COLORS.accent : COLORS.border}`,
                background: lang === l ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: lang === l ? COLORS.accent : COLORS.textSecondary,
                cursor: 'pointer', fontWeight: lang === l ? 600 : 400, fontSize: 14,
              }}
            >
              {l}
            </button>
          ))}
        </div>

        {/* SDK Code area */}
        <div style={{ background: '#0d0e1a', border: `1px solid ${COLORS.border}`, borderRadius: 12, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: `1px solid ${COLORS.border}` }}>
            <span style={{ fontSize: 13, color: COLORS.textMuted, fontFamily: 'monospace' }}>zivo-client.{lang === 'TypeScript' ? 'ts' : lang === 'Python' ? 'py' : lang === 'cURL' ? 'sh' : 'js'}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={copySDK} style={{ background: 'rgba(99,102,241,0.15)', border: `1px solid ${COLORS.accent}`, borderRadius: 6, color: COLORS.accent, padding: '5px 12px', cursor: 'pointer', fontSize: 12 }}>
                {sdkCopied ? '✓ Copied' : 'Copy SDK'}
              </button>
              <button onClick={downloadSDK} style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.textSecondary, padding: '5px 12px', cursor: 'pointer', fontSize: 12 }}>
                Download SDK
              </button>
            </div>
          </div>
          <pre style={{ margin: 0, padding: 20, fontSize: 12.5, color: COLORS.textPrimary, overflowX: 'auto', lineHeight: 1.6 }}>
            <code>{SDK_SNIPPETS[lang]}</code>
          </pre>
        </div>

        {/* API Playground */}
        <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>API Playground</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
            <select
              value={endpoint}
              onChange={e => setEndpoint(e.target.value)}
              style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textPrimary, padding: '8px 12px', fontSize: 13 }}
            >
              {ENDPOINTS.map(ep => <option key={ep} value={ep}>{ep}</option>)}
            </select>
            <input value={param1} onChange={e => setParam1(e.target.value)} placeholder="Parameter 1" style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textPrimary, padding: '8px 12px', fontSize: 13 }} />
            <input value={param2} onChange={e => setParam2(e.target.value)} placeholder="Parameter 2" style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textPrimary, padding: '8px 12px', fontSize: 13 }} />
            <button onClick={tryIt} disabled={playLoading} style={{ background: COLORS.accentGradient, border: 'none', borderRadius: 8, color: '#fff', padding: '8px 20px', fontWeight: 600, cursor: playLoading ? 'not-allowed' : 'pointer', opacity: playLoading ? 0.7 : 1 }}>
              {playLoading ? 'Running…' : 'Try It'}
            </button>
          </div>
          {playResponse && (
            <pre style={{ background: '#0d0e1a', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 14, fontSize: 12, color: COLORS.textPrimary, overflow: 'auto', margin: 0, animation: 'fadeIn 0.3s ease' }}>{playResponse}</pre>
          )}
        </div>

        {/* Snippet Library */}
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 14 }}>Snippet Library</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
          {SNIPPET_LIBRARY.map((snip, i) => (
            <div key={i} style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{snip.title}</div>
                  <span style={{ fontSize: 11, background: 'rgba(99,102,241,0.15)', color: COLORS.accent, borderRadius: 4, padding: '2px 8px' }}>{snip.lang}</span>
                </div>
                <button onClick={() => copySnippet(i, snip.code)} style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: copiedSnippet === i ? COLORS.success : COLORS.textSecondary, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
                  {copiedSnippet === i ? '✓' : 'Copy'}
                </button>
              </div>
              <pre style={{ margin: 0, fontSize: 11, color: COLORS.textMuted, background: '#0d0e1a', borderRadius: 6, padding: 10, overflow: 'auto' }}>{snip.code}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
