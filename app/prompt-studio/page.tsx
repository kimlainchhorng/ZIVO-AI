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

const INITIAL_PROMPT = `You are a helpful AI assistant. Your task is to {task}.

Context: {context}

Instructions:
1. Be concise and clear
2. Use examples when helpful
3. Format output as requested`;

interface Version {
  id: string;
  label: string;
  date: string;
  text: string;
  isCurrent: boolean;
}

const VERSIONS: Version[] = [
  { id: 'v1', label: 'v1', date: '2026-03-01', isCurrent: false, text: 'You are a helpful AI assistant. Answer the following: {task}' },
  { id: 'v2', label: 'v2', date: '2026-03-02', isCurrent: false, text: 'You are a helpful AI assistant. Your task is to {task}.\n\nContext: {context}' },
  { id: 'v3', label: 'v3', date: '2026-03-04', isCurrent: true, text: INITIAL_PROMPT },
];

interface TestCase {
  id: number;
  input: string;
  expected: string;
  status: 'pass' | 'fail' | 'pending';
}

const TEST_CASES: TestCase[] = [
  { id: 1, input: 'Summarize the article about climate change', expected: 'A 3-sentence summary of key points', status: 'pass' },
  { id: 2, input: 'Write a Python function to sort a list', expected: 'def sort_list(items): return sorted(items)', status: 'pass' },
  { id: 3, input: 'Translate "Hello" to Spanish', expected: 'Hola', status: 'fail' },
  { id: 4, input: 'Generate 5 blog post ideas about AI', expected: 'Numbered list of 5 unique AI blog topics', status: 'pending' },
];

export default function PromptStudio() {
  const [selectedVersion, setSelectedVersion] = useState('v3');
  const [promptText, setPromptText] = useState(INITIAL_PROMPT);
  const [versions, setVersions] = useState<Version[]>(VERSIONS);
  const [abMode, setAbMode] = useState(false);
  const [variantA, setVariantA] = useState(INITIAL_PROMPT);
  const [variantB, setVariantB] = useState('You are a precise AI assistant. Complete the following task:\n\n{task}\n\nBe brief. Use bullet points. Reference {context} when relevant.');
  const [testInput, setTestInput] = useState('Enter test input here...');
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState('');
  const [savedMsg, setSavedMsg] = useState('');

  const handleVersionChange = (vid: string) => {
    setSelectedVersion(vid);
    const v = versions.find(x => x.id === vid);
    if (v) setPromptText(v.text);
  };

  const handleSaveVersion = () => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const newId = `v${versions.length + 1}`;
    const newVersion: Version = {
      id: newId,
      label: newId,
      date: dateStr,
      isCurrent: true,
      text: promptText,
    };
    setVersions(prev => [...prev.map(v => ({ ...v, isCurrent: false })), newVersion]);
    setSelectedVersion(newId);
    setSavedMsg(`Saved as ${newId}`);
    setTimeout(() => setSavedMsg(''), 2000);
  };

  const handleEvaluate = () => {
    setEvaluating(true);
    setEvalResult('');
    setTimeout(() => {
      setEvaluating(false);
      setEvalResult('✓ Task completed successfully. Here is the result with 3 key points:\n\n1. The main concept was identified and addressed clearly\n2. Supporting context was incorporated appropriately\n3. Output format matches the requested specification');
    }, 1000);
  };

  const statusColor = (s: TestCase['status']) =>
    s === 'pass' ? COLORS.success : s === 'fail' ? COLORS.error : COLORS.warning;
  const statusLabel = (s: TestCase['status']) =>
    s === 'pass' ? '✓ Pass' : s === 'fail' ? '✗ Fail' : '⏳ Pending';

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.textPrimary }}>
      <style>{fadeInCSS}</style>
      <NavBar />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px', animation: 'fadeIn 0.4s ease' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>Prompt Studio</h1>
        <p style={{ color: COLORS.textSecondary, margin: '0 0 32px' }}>Engineer, version, and test your AI prompts</p>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 24, marginBottom: 32 }}>
          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={card}>
              <label style={labelStyle}>Version</label>
              <select
                value={selectedVersion}
                onChange={e => handleVersionChange(e.target.value)}
                style={selectStyle}
              >
                {versions.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.label} ({v.date}){v.isCurrent ? ' — current' : ''}
                  </option>
                ))}
              </select>

              <label style={{ ...labelStyle, marginTop: 16 }}>Prompt Text</label>
              <textarea
                value={promptText}
                onChange={e => setPromptText(e.target.value)}
                rows={12}
                style={{
                  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.3)',
                  border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textPrimary,
                  fontSize: 13, fontFamily: 'monospace', lineHeight: 1.6, resize: 'vertical', boxSizing: 'border-box',
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                <button onClick={handleSaveVersion} style={btnAccent}>Save Version</button>
                {savedMsg && <span style={{ color: COLORS.success, fontSize: 13 }}>{savedMsg}</span>}
              </div>
            </div>

            {/* Version History */}
            <div style={card}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: COLORS.textSecondary }}>VERSION HISTORY</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[...versions].reverse().slice(0, 3).map(v => (
                  <div key={v.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', background: 'rgba(0,0,0,0.2)', borderRadius: 8,
                    border: `1px solid ${v.isCurrent ? COLORS.accent : COLORS.border}`,
                  }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{v.label}</span>
                      <span style={{ color: COLORS.textMuted, fontSize: 12, marginLeft: 10 }}>{v.date}</span>
                      {v.isCurrent && (
                        <span style={{ marginLeft: 8, fontSize: 11, background: COLORS.accent + '33', color: COLORS.accent, padding: '2px 8px', borderRadius: 10 }}>current</span>
                      )}
                    </div>
                    <button onClick={() => handleVersionChange(v.id)} style={btnOutline}>Load</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={card}>
              {/* A/B Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>A/B Test Mode</span>
                <div
                  onClick={() => setAbMode(x => !x)}
                  style={{
                    width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
                    background: abMode ? COLORS.accent : COLORS.border,
                    position: 'relative', transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 3, left: abMode ? 22 : 2,
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    transition: 'left 0.2s',
                  }} />
                </div>
              </div>

              {abMode && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...labelStyle, color: '#6366f1' }}>Variant A</label>
                    <textarea
                      value={variantA}
                      onChange={e => setVariantA(e.target.value)}
                      rows={6}
                      style={{ ...textareaStyle, borderColor: '#6366f1' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...labelStyle, color: '#8b5cf6' }}>Variant B</label>
                    <textarea
                      value={variantB}
                      onChange={e => setVariantB(e.target.value)}
                      rows={6}
                      style={{ ...textareaStyle, borderColor: '#8b5cf6' }}
                    />
                  </div>
                </div>
              )}

              <label style={labelStyle}>Test Input</label>
              <textarea
                value={testInput}
                onChange={e => setTestInput(e.target.value)}
                rows={4}
                style={textareaStyle}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <button onClick={handleEvaluate} disabled={evaluating} style={{ ...btnAccent, opacity: evaluating ? 0.7 : 1 }}>
                  {evaluating ? 'Evaluating...' : 'Evaluate'}
                </button>
                <span style={{ color: COLORS.textMuted, fontSize: 12 }}>~245 tokens estimated</span>
              </div>

              {evalResult && (
                <pre style={{
                  marginTop: 14, padding: '12px 14px', background: 'rgba(34,197,94,0.06)',
                  border: `1px solid ${COLORS.success}33`, borderRadius: 8,
                  fontSize: 13, color: COLORS.textPrimary, whiteSpace: 'pre-wrap', lineHeight: 1.6,
                }}>
                  {evalResult}
                </pre>
              )}
            </div>
          </div>
        </div>

        {/* Dataset Table */}
        <div style={card}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Test Dataset</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['Input', 'Expected Output', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: COLORS.textMuted, fontWeight: 500, borderBottom: `1px solid ${COLORS.border}` }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TEST_CASES.map(tc => (
                  <tr key={tc.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: '12px 14px', color: COLORS.textPrimary, maxWidth: 280 }}>{tc.input}</td>
                    <td style={{ padding: '12px 14px', color: COLORS.textSecondary, maxWidth: 280 }}>{tc.expected}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        background: statusColor(tc.status) + '22', color: statusColor(tc.status),
                      }}>
                        {statusLabel(tc.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 22,
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: COLORS.textMuted,
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8,
};
const selectStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', background: 'rgba(0,0,0,0.3)',
  border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.textPrimary, fontSize: 13,
};
const textareaStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.3)',
  border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textPrimary,
  fontSize: 13, lineHeight: 1.6, resize: 'vertical', boxSizing: 'border-box',
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
