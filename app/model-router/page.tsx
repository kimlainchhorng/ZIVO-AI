'use client';

import NavBar from '../components/NavBar';
import { useState } from 'react';

const COLORS = {
  bg: "#0a0b14",
  bgPanel: "#0f1120",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
};

const fadeInCSS = '@keyframes fadeIn { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }';

interface ModelRow {
  id: string;
  name: string;
  provider: string;
  context: string;
  inputPrice: number;
  outputPrice: number;
  speed: string;
  useCase: string;
}

const MODELS: ModelRow[] = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', context: '128K', inputPrice: 2.50, outputPrice: 10.00, speed: 'Fast', useCase: 'General purpose' },
  { id: 'gpt-4.1', name: 'GPT-4.1', provider: 'OpenAI', context: '1M', inputPrice: 2.00, outputPrice: 8.00, speed: 'Fast', useCase: 'Long context' },
  { id: 'o3', name: 'o3', provider: 'OpenAI', context: '200K', inputPrice: 10.00, outputPrice: 40.00, speed: 'Medium', useCase: 'Complex reasoning' },
  { id: 'o1-mini', name: 'o1-mini', provider: 'OpenAI', context: '128K', inputPrice: 1.10, outputPrice: 4.40, speed: 'Fast', useCase: 'Logic tasks' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5-turbo', provider: 'OpenAI', context: '16K', inputPrice: 0.50, outputPrice: 1.50, speed: 'Very Fast', useCase: 'Simple tasks' },
  { id: 'claude-3.5-sonnet', name: 'Claude-3.5-Sonnet', provider: 'Anthropic', context: '200K', inputPrice: 3.00, outputPrice: 15.00, speed: 'Medium', useCase: 'Analysis' },
  { id: 'gemini-2.0-flash', name: 'Gemini-2.0-Flash', provider: 'Google', context: '1M', inputPrice: 0.10, outputPrice: 0.40, speed: 'Very Fast', useCase: 'Cost-effective' },
];

const speedColor = (speed: string) => {
  if (speed === 'Very Fast') return COLORS.success;
  if (speed === 'Fast') return COLORS.accent;
  return COLORS.warning;
};

const providerColor = (provider: string) => {
  if (provider === 'OpenAI') return '#10b981';
  if (provider === 'Anthropic') return '#f59e0b';
  return '#3b82f6';
};

interface FallbackModel {
  id: string;
  name: string;
}

interface RouteRule {
  id: number;
  taskType: string;
  model: string;
  condition: string;
}

const INITIAL_FALLBACKS: FallbackModel[] = [
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'claude-3.5-sonnet', name: 'Claude-3.5-Sonnet' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5-turbo' },
];

const INITIAL_RULES: RouteRule[] = [
  { id: 1, taskType: 'Code Generation', model: 'o3', condition: 'complexity > 0.7' },
  { id: 2, taskType: 'Simple Q&A', model: 'GPT-3.5-turbo', condition: 'token_count < 500' },
  { id: 3, taskType: 'Document Analysis', model: 'GPT-4.1', condition: 'doc_length > 50K' },
];

export default function ModelRouter() {
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');
  const [inputTokens, setInputTokens] = useState<number>(10000);
  const [outputTokens, setOutputTokens] = useState<number>(2000);
  const [fallbacks, setFallbacks] = useState<FallbackModel[]>(INITIAL_FALLBACKS);
  const [rules] = useState<RouteRule[]>(INITIAL_RULES);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const model = MODELS.find(m => m.id === selectedModel);
  const estimatedCost = model
    ? ((inputTokens / 1_000_000) * model.inputPrice + (outputTokens / 1_000_000) * model.outputPrice)
    : 0;

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setFallbacks(prev => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveDown = (idx: number) => {
    setFallbacks(prev => {
      if (idx === prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.textPrimary }}>
      <style>{fadeInCSS}</style>
      <NavBar />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px', animation: 'fadeIn 0.4s ease' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>Model Router</h1>
        <p style={{ color: COLORS.textSecondary, margin: '0 0 32px' }}>Compare models, estimate costs, and configure routing rules</p>

        {/* Model Comparison Table */}
        <div style={{ ...card, marginBottom: 28, overflowX: 'auto' }}>
          <h2 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 600 }}>Model Comparison</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Model', 'Provider', 'Context', 'Input ($/M)', 'Output ($/M)', 'Speed', 'Use Case'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '10px 14px', color: COLORS.textMuted,
                    fontWeight: 500, borderBottom: `1px solid ${COLORS.border}`, whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODELS.map(m => (
                <tr
                  key={m.id}
                  onClick={() => setSelectedModel(m.id)}
                  style={{
                    borderBottom: `1px solid ${COLORS.border}`, cursor: 'pointer',
                    background: selectedModel === m.id ? COLORS.accent + '12' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <td style={{ padding: '13px 14px' }}>
                    <span style={{ fontWeight: selectedModel === m.id ? 700 : 500 }}>{m.name}</span>
                    {selectedModel === m.id && (
                      <span style={{ marginLeft: 8, color: COLORS.accent, fontSize: 11 }}>● selected</span>
                    )}
                  </td>
                  <td style={{ padding: '13px 14px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                      background: providerColor(m.provider) + '22', color: providerColor(m.provider),
                    }}>{m.provider}</span>
                  </td>
                  <td style={{ padding: '13px 14px', color: COLORS.textSecondary }}>{m.context}</td>
                  <td style={{ padding: '13px 14px', color: COLORS.textSecondary }}>${m.inputPrice.toFixed(2)}</td>
                  <td style={{ padding: '13px 14px', color: COLORS.textSecondary }}>${m.outputPrice.toFixed(2)}</td>
                  <td style={{ padding: '13px 14px' }}>
                    <span style={{ color: speedColor(m.speed), fontWeight: 500 }}>{m.speed}</span>
                  </td>
                  <td style={{ padding: '13px 14px', color: COLORS.textMuted }}>{m.useCase}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom two columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          {/* Cost Estimator */}
          <div style={card}>
            <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 600 }}>Cost Estimator</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Selected Model</label>
                <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.accent }}>
                  {model?.name ?? 'None'}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Input Tokens</label>
                <input
                  type="number"
                  value={inputTokens}
                  onChange={e => setInputTokens(Math.max(0, Number(e.target.value)))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Output Tokens</label>
                <input
                  type="number"
                  value={outputTokens}
                  onChange={e => setOutputTokens(Math.max(0, Number(e.target.value)))}
                  style={inputStyle}
                />
              </div>
              <div style={{
                padding: '14px 16px', background: COLORS.accent + '12',
                border: `1px solid ${COLORS.accent}33`, borderRadius: 8, textAlign: 'center',
              }}>
                <div style={{ color: COLORS.textMuted, fontSize: 12, marginBottom: 4 }}>Estimated Cost</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.accent }}>
                  ${estimatedCost.toFixed(4)}
                </div>
                <div style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 4 }}>
                  per request
                </div>
              </div>
            </div>
          </div>

          {/* Fallback Chain */}
          <div style={card}>
            <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 600 }}>Fallback Chain</h3>
            <p style={{ fontSize: 12, color: COLORS.textMuted, margin: '0 0 16px', lineHeight: 1.5 }}>
              Models are tried in order when the primary fails
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {fallbacks.map((fb, idx) => (
                <div key={fb.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', background: 'rgba(0,0,0,0.2)',
                  border: `1px solid ${COLORS.border}`, borderRadius: 8,
                }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: COLORS.accent + '33', color: COLORS.accent, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {idx + 1}
                  </span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{fb.name}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <button onClick={() => moveUp(idx)} style={reorderBtn} disabled={idx === 0}>▲</button>
                    <button onClick={() => moveDown(idx)} style={reorderBtn} disabled={idx === fallbacks.length - 1}>▼</button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => showToast('Fallback chain saved')} style={{ ...btnAccent, marginTop: 14, width: '100%' }}>
              Save Chain
            </button>
          </div>

          {/* Route Rules */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Route Rules</h3>
              <button onClick={() => showToast('Add rule coming soon')} style={btnOutline}>+ Add</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rules.map(rule => (
                <div key={rule.id} style={{
                  padding: '12px 14px', background: 'rgba(0,0,0,0.2)',
                  border: `1px solid ${COLORS.border}`, borderRadius: 8,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{rule.taskType}</div>
                  <div style={{ fontSize: 12, color: COLORS.accent, marginBottom: 4 }}>→ {rule.model}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: 'monospace' }}>
                    when: {rule.condition}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, background: COLORS.accent, color: '#fff',
          padding: '12px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500, zIndex: 200,
          animation: 'fadeIn 0.3s ease',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}

const card: React.CSSProperties = {
  background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 22,
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600, color: COLORS.textMuted,
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6,
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.3)',
  border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.textPrimary,
  fontSize: 13, boxSizing: 'border-box',
};
const btnAccent: React.CSSProperties = {
  background: COLORS.accent, color: '#fff', border: 'none', borderRadius: 7,
  padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
};
const btnOutline: React.CSSProperties = {
  background: 'transparent', color: COLORS.textSecondary,
  border: `1px solid ${COLORS.border}`, borderRadius: 7,
  padding: '6px 14px', fontSize: 12, cursor: 'pointer',
};
const reorderBtn: React.CSSProperties = {
  background: 'transparent', border: `1px solid ${COLORS.border}`, color: COLORS.textMuted,
  borderRadius: 4, padding: '1px 5px', fontSize: 10, cursor: 'pointer', lineHeight: 1.4,
};
