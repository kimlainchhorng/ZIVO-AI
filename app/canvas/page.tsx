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

const componentList = ['Header', 'Hero Section', 'Button', 'Card', 'Footer'];

type CanvasItem = { id: string; name: string; bgColor: string; padding: number; borderRadius: number; fontSize: number };

const initialItems: CanvasItem[] = [
  { id: 'header', name: 'Header', bgColor: 'rgba(99,102,241,0.15)', padding: 0, borderRadius: 0, fontSize: 14 },
  { id: 'button', name: 'Button', bgColor: '#6366f1', padding: 8, borderRadius: 8, fontSize: 14 },
  { id: 'card', name: 'Card Component', bgColor: 'rgba(255,255,255,0.04)', padding: 16, borderRadius: 12, fontSize: 14 },
];

export default function CanvasPage() {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [items, setItems] = useState<CanvasItem[]>(initialItems);
  const [animDuration, setAnimDuration] = useState('300');
  const [animEasing, setAnimEasing] = useState('ease');
  const [themePrimary, setThemePrimary] = useState('#6366f1');
  const [themeSecondary, setThemeSecondary] = useState('#8b5cf6');
  const [themeAccent, setThemeAccent] = useState('#22c55e');

  const selected = items.find(i => i.id === selectedItem);

  function updateItem(id: string, key: keyof CanvasItem, value: string | number) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [key]: value } : i));
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.textPrimary }}>
      <style>{fadeInCSS}</style>
      <NavBar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Canvas Builder</h1>

        {/* Three-panel layout */}
        <div style={{ display: 'flex', gap: 16, height: 560, marginBottom: 24 }}>
          {/* Left Panel */}
          <div style={{ width: 200, background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 16, flexShrink: 0 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase' }}>Components</h3>
            {componentList.map(c => (
              <div key={c} onClick={() => setSelectedLeft(c)}
                style={{ padding: '10px 12px', borderRadius: 8, marginBottom: 4, cursor: 'pointer', fontSize: 14,
                  background: selectedLeft === c ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: selectedLeft === c ? COLORS.accent : COLORS.textSecondary,
                  border: selectedLeft === c ? `1px solid ${COLORS.accent}44` : '1px solid transparent',
                }}>
                {c}
              </div>
            ))}
          </div>

          {/* Center Canvas */}
          <div style={{ flex: 1, background: '#070810', border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24, overflowY: 'auto', minHeight: 500 }}>
            {/* Header box */}
            <div onClick={() => setSelectedItem('header')}
              style={{ width: '100%', height: 60, background: items[0].bgColor, borderRadius: items[0].borderRadius, display: 'flex', alignItems: 'center', paddingLeft: 16, marginBottom: 16, cursor: 'pointer', border: selectedItem === 'header' ? `2px solid ${COLORS.accent}` : '2px solid transparent', boxSizing: 'border-box' }}>
              <span style={{ fontSize: items[0].fontSize, fontWeight: 600 }}>{items[0].name}</span>
            </div>
            {/* Button box */}
            <div onClick={() => setSelectedItem('button')}
              style={{ width: 120, height: 40, background: items[1].bgColor, borderRadius: items[1].borderRadius, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, cursor: 'pointer', border: selectedItem === 'button' ? `2px solid #fff` : '2px solid transparent' }}>
              <span style={{ fontSize: items[1].fontSize, fontWeight: 600, color: '#fff' }}>{items[1].name}</span>
            </div>
            {/* Card box */}
            <div onClick={() => setSelectedItem('card')}
              style={{ width: 300, minHeight: 120, background: items[2].bgColor, borderRadius: items[2].borderRadius, padding: items[2].padding, border: selectedItem === 'card' ? `2px solid ${COLORS.accent}` : `2px solid ${COLORS.border}`, cursor: 'pointer', boxSizing: 'border-box' }}>
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: items[2].fontSize }}>{items[2].name}</div>
              <div style={{ color: COLORS.textMuted, fontSize: 13 }}>Sample card content goes here.</div>
            </div>
          </div>

          {/* Right Panel */}
          <div style={{ width: 240, background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 16, flexShrink: 0, overflowY: 'auto' }}>
            {selected ? (
              <>
                <h3 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase' }}>Properties</h3>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 }}>Background Color</label>
                  <input type="color" value={selected.bgColor.startsWith('#') ? selected.bgColor : '#1e1e3f'} onChange={e => updateItem(selected.id, 'bgColor', e.target.value)} style={{ width: '100%', height: 36, borderRadius: 6, border: `1px solid ${COLORS.border}`, cursor: 'pointer', background: 'none' }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 }}>Padding</label>
                  <input type="number" value={selected.padding} onChange={e => updateItem(selected.id, 'padding', Number(e.target.value))} style={{ width: '100%', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 10px', color: COLORS.textPrimary, fontSize: 14, boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 }}>Border Radius</label>
                  <input type="number" value={selected.borderRadius} onChange={e => updateItem(selected.id, 'borderRadius', Number(e.target.value))} style={{ width: '100%', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 10px', color: COLORS.textPrimary, fontSize: 14, boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 }}>Font Size</label>
                  <input type="number" value={selected.fontSize} onChange={e => updateItem(selected.id, 'fontSize', Number(e.target.value))} style={{ width: '100%', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 10px', color: COLORS.textPrimary, fontSize: 14, boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['📱 Mobile', '📟 Tablet', '🖥 Desktop'].map(d => (
                    <button key={d} style={{ flex: 1, background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 4px', color: COLORS.textSecondary, cursor: 'pointer', fontSize: 11 }}>{d}</button>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ color: COLORS.textMuted, fontSize: 13, textAlign: 'center', marginTop: 40 }}>Select a component to edit</div>
            )}
          </div>
        </div>

        {/* Bottom Toolbar */}
        <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600 }}>Animation</h3>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 }}>Duration (ms)</label>
              <input type="number" value={animDuration} onChange={e => setAnimDuration(e.target.value)} style={{ width: 100, background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 10px', color: COLORS.textPrimary, fontSize: 14 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 }}>Easing</label>
              <select value={animEasing} onChange={e => setAnimEasing(e.target.value)} style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 10px', color: COLORS.textPrimary, fontSize: 14 }}>
                {['ease', 'ease-in', 'ease-out', 'linear'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Theme Builder */}
        <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600 }}>Theme Builder</h3>
          <div style={{ display: 'flex', gap: 24 }}>
            {([['Primary', themePrimary, setThemePrimary], ['Secondary', themeSecondary, setThemeSecondary], ['Accent', themeAccent, setThemeAccent]] as [string, string, (v: string) => void][]).map(([label, val, setter]) => (
              <div key={label}>
                <label style={{ display: 'block', fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 }}>{label}</label>
                <input type="color" value={val} onChange={e => setter(e.target.value)} style={{ width: 60, height: 36, borderRadius: 6, border: `1px solid ${COLORS.border}`, cursor: 'pointer', background: 'none' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
