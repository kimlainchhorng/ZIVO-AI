'use client';
import { useState } from 'react';
import NavBar from '../../components/NavBar';

const COLORS = {
  bg: "#0a0b14", bgPanel: "#0f1120", bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)", accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  textPrimary: "#f1f5f9", textSecondary: "#94a3b8", textMuted: "#64748b",
  success: "#22c55e", warning: "#f59e0b", error: "#ef4444",
};

const fadeInCSS = '@keyframes fadeIn { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }';

const fieldTypes = ['Text Input', 'Email', 'Password', 'Number', 'Select', 'Checkbox', 'Radio', 'Textarea', 'Date', 'File Upload'];

type Field = { id: string; type: string; label: string; placeholder: string; required: boolean; validation: string };

const initialFields: Field[] = [
  { id: 'f1', type: 'Text Input', label: 'Name', placeholder: 'Enter your name', required: true, validation: 'none' },
  { id: 'f2', type: 'Email', label: 'Email', placeholder: 'your@email.com', required: true, validation: 'email' },
];

const mockSubmissions = [
  { id: 'S001', name: 'Alice Johnson', email: 'alice@example.com', date: '2026-03-01' },
  { id: 'S002', name: 'Bob Smith', email: 'bob@example.com', date: '2026-03-02' },
  { id: 'S003', name: 'Carol White', email: 'carol@example.com', date: '2026-03-03' },
];

let counter = 10;

function renderFieldPreview(field: Field) {
  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '7px 10px', color: '#94a3b8', fontSize: 13, boxSizing: 'border-box' as const, marginTop: 4 };
  if (field.type === 'Checkbox') return <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}><input type="checkbox" disabled /><span style={{ fontSize: 13, color: '#94a3b8' }}>{field.placeholder || field.label}</span></div>;
  if (field.type === 'Radio') return <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}><input type="radio" disabled /><span style={{ fontSize: 13, color: '#94a3b8' }}>Option 1</span></div>;
  if (field.type === 'Textarea') return <textarea disabled placeholder={field.placeholder} style={{ ...inputStyle, height: 60, resize: 'none' }} />;
  if (field.type === 'Select') return <select disabled style={inputStyle}><option>Choose an option</option></select>;
  return <input type={field.type === 'Email' ? 'email' : field.type === 'Password' ? 'password' : field.type === 'Number' ? 'number' : field.type === 'Date' ? 'date' : 'text'} disabled placeholder={field.placeholder} style={inputStyle} />;
}

export default function FormBuilderPage() {
  const [fields, setFields] = useState<Field[]>(initialFields);
  const [selected, setSelected] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [tab, setTab] = useState<'builder' | 'submissions'>('builder');

  const selectedField = fields.find(f => f.id === selected);

  function addField(type: string) {
    const newField: Field = { id: `f${++counter}`, type, label: type, placeholder: `Enter ${type.toLowerCase()}`, required: false, validation: 'none' };
    setFields(prev => [...prev, newField]);
    setSelected(newField.id);
  }

  function moveField(id: string, dir: 'up' | 'down') {
    setFields(prev => {
      const idx = prev.findIndex(f => f.id === id);
      if (dir === 'up' && idx === 0) return prev;
      if (dir === 'down' && idx === prev.length - 1) return prev;
      const arr = [...prev];
      const swap = dir === 'up' ? idx - 1 : idx + 1;
      [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
      return arr;
    });
  }

  function updateField(id: string, key: keyof Field, value: string | boolean) {
    setFields(prev => prev.map(f => f.id === id ? { ...f, [key]: value } : f));
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.textPrimary }}>
      <style>{fadeInCSS}</style>
      <NavBar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Form Builder</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['builder', 'submissions'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? COLORS.accentGradient : COLORS.bgCard, color: tab === t ? '#fff' : COLORS.textSecondary, border: `1px solid ${tab === t ? 'transparent' : COLORS.border}`, borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, textTransform: 'capitalize' }}>{t}</button>
            ))}
            <button onClick={() => setPreviewMode(p => !p)} style={{ background: previewMode ? COLORS.accentGradient : COLORS.bgCard, color: previewMode ? '#fff' : COLORS.textSecondary, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>
              {previewMode ? '✎ Edit' : '👁 Preview'}
            </button>
          </div>
        </div>

        {tab === 'builder' ? (
          <div style={{ display: 'flex', gap: 16 }}>
            {/* Left palette */}
            <div style={{ width: 220, flexShrink: 0 }}>
              <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase' }}>Field Types</h3>
                {fieldTypes.map(ft => (
                  <div key={ft} onClick={() => addField(ft)} style={{ padding: '9px 12px', borderRadius: 8, marginBottom: 4, cursor: 'pointer', fontSize: 14, color: COLORS.textSecondary, border: `1px solid transparent`, transition: 'all 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(99,102,241,0.1)'; (e.currentTarget as HTMLDivElement).style.color = COLORS.accent; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; (e.currentTarget as HTMLDivElement).style.color = COLORS.textSecondary; }}>
                    + {ft}
                  </div>
                ))}
              </div>

              {/* Settings panel */}
              {selectedField && (
                <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 16 }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase' }}>Settings</h3>
                  {[{ label: 'Label', key: 'label' as keyof Field }, { label: 'Placeholder', key: 'placeholder' as keyof Field }].map(({ label, key }) => (
                    <div key={key} style={{ marginBottom: 10 }}>
                      <label style={{ display: 'block', fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 }}>{label}</label>
                      <input value={String(selectedField[key])} onChange={e => updateField(selectedField.id, key, e.target.value)} style={{ width: '100%', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 8px', color: COLORS.textPrimary, fontSize: 13, boxSizing: 'border-box' }} />
                    </div>
                  ))}
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: COLORS.textSecondary }}>
                      <input type="checkbox" checked={selectedField.required} onChange={e => updateField(selectedField.id, 'required', e.target.checked)} />
                      Required
                    </label>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 }}>Validation</label>
                    <select value={selectedField.validation} onChange={e => updateField(selectedField.id, 'validation', e.target.value)} style={{ width: '100%', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 8px', color: COLORS.textPrimary, fontSize: 13 }}>
                      {['none', 'email', 'url', 'min-length', 'max-length', 'regex'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Form canvas */}
            <div style={{ flex: 1, background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: COLORS.textMuted }}>Form Canvas</h3>
              {fields.length === 0 && <div style={{ textAlign: 'center', color: COLORS.textMuted, padding: 40 }}>Click field types to add fields</div>}
              {fields.map(f => (
                <div key={f.id} onClick={() => setSelected(f.id)}
                  style={{ background: COLORS.bgCard, border: `2px solid ${selected === f.id ? COLORS.accent : COLORS.border}`, borderRadius: 10, padding: 14, marginBottom: 10, cursor: 'pointer', animation: 'fadeIn 0.2s ease both' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                        {f.label} {f.required && <span style={{ color: COLORS.error, fontSize: 11 }}>*required</span>}
                      </div>
                      <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6 }}>{f.type}</div>
                      {renderFieldPreview(f)}
                    </div>
                    {!previewMode && (
                      <div style={{ display: 'flex', gap: 4, marginLeft: 8, flexShrink: 0 }}>
                        <button onClick={e => { e.stopPropagation(); moveField(f.id, 'up'); }} style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 4, width: 24, height: 24, cursor: 'pointer', color: COLORS.textSecondary, fontSize: 12 }}>↑</button>
                        <button onClick={e => { e.stopPropagation(); moveField(f.id, 'down'); }} style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 4, width: 24, height: 24, cursor: 'pointer', color: COLORS.textSecondary, fontSize: 12 }}>↓</button>
                        <button onClick={e => { e.stopPropagation(); setFields(prev => prev.filter(x => x.id !== f.id)); if (selected === f.id) setSelected(null); }} style={{ background: 'rgba(239,68,68,0.15)', border: `1px solid ${COLORS.error}44`, borderRadius: 4, width: 24, height: 24, cursor: 'pointer', color: COLORS.error, fontSize: 12 }}>✕</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Submissions tab */
          <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${COLORS.border}` }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Submissions ({mockSubmissions.length})</h2>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['ID', 'Name', 'Email', 'Date'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: COLORS.textMuted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockSubmissions.map(s => (
                  <tr key={s.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: COLORS.accent, fontSize: 13 }}>{s.id}</td>
                    <td style={{ padding: '12px 16px', color: COLORS.textPrimary }}>{s.name}</td>
                    <td style={{ padding: '12px 16px', color: COLORS.textSecondary }}>{s.email}</td>
                    <td style={{ padding: '12px 16px', color: COLORS.textSecondary }}>{s.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
