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

type NavItem = { id: string; label: string; href: string; children?: NavItem[] };

const initialNav: NavItem[] = [
  { id: 'n1', label: 'Home', href: '/' },
  { id: 'n2', label: 'Features', href: '/features', children: [
    { id: 'n2a', label: 'AI Studio', href: '/ai' },
    { id: 'n2b', label: 'Canvas', href: '/canvas' },
  ]},
  { id: 'n3', label: 'Pricing', href: '/pricing' },
  { id: 'n4', label: 'Docs', href: '/docs', children: [
    { id: 'n4a', label: 'API Reference', href: '/docs/api' },
    { id: 'n4b', label: 'Guides', href: '/docs/guides' },
  ]},
  { id: 'n5', label: 'Blog', href: '/blog' },
];

let navCounter = 20;

function generateCode(items: NavItem[]): string {
  const renderItems = (items: NavItem[], depth = 0): string => {
    return items.map(item => {
      const indent = '  '.repeat(depth + 2);
      if (item.children && item.children.length > 0) {
        return `${indent}{ label: '${item.label}', href: '${item.href}', children: [\n${renderItems(item.children, depth + 1)}\n${indent}] }`;
      }
      return `${indent}{ label: '${item.label}', href: '${item.href}' }`;
    }).join(',\n');
  };
  return `export const navItems = [\n${renderItems(items)}\n];

export function Navigation() {
  return (
    <nav>
      {navItems.map(item => (
        <a key={item.href} href={item.href}>{item.label}</a>
      ))}
    </nav>
  );
}`;
}

function NavTreeItem({ item, depth, onUpdate, onDelete, onAddChild, onMove }: {
  item: NavItem; depth: number;
  onUpdate: (id: string, label: string, href: string) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onMove: (id: string, dir: 'up' | 'down') => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(item.label);
  const [editHref, setEditHref] = useState(item.href);

  function save() {
    onUpdate(item.id, editLabel, editHref);
    setEditing(false);
  }

  return (
    <div style={{ marginLeft: depth * 20, marginBottom: 4 }}>
      {editing ? (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: 'rgba(99,102,241,0.08)', border: `1px solid ${COLORS.accent}44`, borderRadius: 8, padding: '6px 10px' }}>
          <input value={editLabel} onChange={e => setEditLabel(e.target.value)} style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 6px', color: COLORS.textPrimary, fontSize: 13, width: 100 }} />
          <input value={editHref} onChange={e => setEditHref(e.target.value)} style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 6px', color: COLORS.textSecondary, fontSize: 12, width: 120 }} />
          <button onClick={save} style={{ background: COLORS.accentGradient, color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>Save</button>
          <button onClick={() => setEditing(false)} style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', color: COLORS.textSecondary, fontSize: 12 }}>✕</button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '8px 10px' }}>
          {depth > 0 && <span style={{ color: COLORS.textMuted, fontSize: 12 }}>└</span>}
          <span onDoubleClick={() => setEditing(true)} style={{ flex: 1, cursor: 'pointer', fontSize: 14, fontWeight: depth === 0 ? 600 : 400 }} title="Double-click to edit">{item.label}</span>
          <span style={{ fontSize: 12, color: COLORS.textMuted, fontFamily: 'monospace' }}>{item.href}</span>
          <button onClick={() => onAddChild(item.id)} style={{ background: 'rgba(99,102,241,0.1)', border: `1px solid ${COLORS.accent}33`, borderRadius: 4, padding: '2px 7px', cursor: 'pointer', color: COLORS.accent, fontSize: 12 }}>+child</button>
          <button onClick={() => onMove(item.id, 'up')} style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 4, width: 22, height: 22, cursor: 'pointer', color: COLORS.textSecondary, fontSize: 11 }}>↑</button>
          <button onClick={() => onMove(item.id, 'down')} style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 4, width: 22, height: 22, cursor: 'pointer', color: COLORS.textSecondary, fontSize: 11 }}>↓</button>
          <button onClick={() => onDelete(item.id)} style={{ background: 'rgba(239,68,68,0.1)', border: `1px solid ${COLORS.error}33`, borderRadius: 4, width: 22, height: 22, cursor: 'pointer', color: COLORS.error, fontSize: 12 }}>✕</button>
        </div>
      )}
      {item.children?.map(child => (
        <NavTreeItem key={child.id} item={child} depth={depth + 1} onUpdate={onUpdate} onDelete={onDelete} onAddChild={onAddChild} onMove={onMove} />
      ))}
    </div>
  );
}

export default function NavBuilderPage() {
  const [navItems, setNavItems] = useState<NavItem[]>(initialNav);
  const [showExport, setShowExport] = useState(false);

  function updateItem(id: string, label: string, href: string) {
    function update(items: NavItem[]): NavItem[] {
      return items.map(item => item.id === id ? { ...item, label, href } : { ...item, children: item.children ? update(item.children) : undefined });
    }
    setNavItems(update);
  }

  function deleteItem(id: string) {
    function del(items: NavItem[]): NavItem[] {
      return items.filter(i => i.id !== id).map(i => ({ ...i, children: i.children ? del(i.children) : undefined }));
    }
    setNavItems(del);
  }

  function addChild(parentId: string) {
    const newItem: NavItem = { id: `n${++navCounter}`, label: 'New Item', href: '/new' };
    function add(items: NavItem[]): NavItem[] {
      return items.map(item => item.id === parentId ? { ...item, children: [...(item.children || []), newItem] } : { ...item, children: item.children ? add(item.children) : undefined });
    }
    setNavItems(add);
  }

  function moveItem(id: string, dir: 'up' | 'down') {
    function move(items: NavItem[]): NavItem[] {
      const idx = items.findIndex(i => i.id === id);
      if (idx !== -1) {
        const arr = [...items];
        if (dir === 'up' && idx > 0) [arr[idx], arr[idx - 1]] = [arr[idx - 1], arr[idx]];
        else if (dir === 'down' && idx < arr.length - 1) [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
        return arr.map(i => ({ ...i, children: i.children ? move(i.children) : undefined }));
      }
      return items.map(i => ({ ...i, children: i.children ? move(i.children) : undefined }));
    }
    setNavItems(move);
  }

  function addTopLevel() {
    setNavItems(prev => [...prev, { id: `n${++navCounter}`, label: 'New Page', href: '/new-page' }]);
  }

  const code = generateCode(navItems);

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.textPrimary }}>
      <style>{fadeInCSS}</style>
      <NavBar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Nav Builder</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addTopLevel} style={{ background: COLORS.bgCard, color: COLORS.textSecondary, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>+ Add Item</button>
            <button onClick={() => setShowExport(true)} style={{ background: COLORS.accentGradient, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>Export Component</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Left: Nav Tree */}
          <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Navigation Tree</h2>
            <p style={{ color: COLORS.textMuted, fontSize: 12, marginBottom: 16 }}>Double-click to edit labels</p>
            {navItems.map(item => (
              <NavTreeItem key={item.id} item={item} depth={0} onUpdate={updateItem} onDelete={deleteItem} onAddChild={addChild} onMove={moveItem} />
            ))}
          </div>

          {/* Right: Preview */}
          <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Live Preview</h2>
            <div style={{ background: '#070810', border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '12px 20px' }}>
              <nav style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ color: COLORS.accent, fontWeight: 700, marginRight: 12 }}>ZIVO</span>
                {navItems.map(item => (
                  <div key={item.id} style={{ position: 'relative', display: 'inline-block' }}>
                    <a href={item.href} style={{ color: COLORS.textSecondary, textDecoration: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 14, display: 'block' }} onClick={e => e.preventDefault()}>
                      {item.label} {item.children && item.children.length > 0 && <span style={{ fontSize: 10 }}>▾</span>}
                    </a>
                  </div>
                ))}
              </nav>
            </div>

            {/* Sub-items preview */}
            <div style={{ marginTop: 16 }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 13, color: COLORS.textMuted, fontWeight: 600 }}>Structure</h3>
              {navItems.map(item => (
                <div key={item.id} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 14, color: COLORS.textPrimary, fontWeight: 600 }}>{item.label} <span style={{ color: COLORS.textMuted, fontFamily: 'monospace', fontSize: 12 }}>{item.href}</span></div>
                  {item.children?.map(c => (
                    <div key={c.id} style={{ marginLeft: 16, fontSize: 13, color: COLORS.textSecondary, paddingTop: 2 }}>└ {c.label} <span style={{ color: COLORS.textMuted, fontFamily: 'monospace', fontSize: 11 }}>{c.href}</span></div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 32, width: 600, maxWidth: '90vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Generated TypeScript</h2>
              <button onClick={() => setShowExport(false)} style={{ background: 'none', border: 'none', color: COLORS.textMuted, fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <pre style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16, fontSize: 12, color: COLORS.textSecondary, overflowX: 'auto', maxHeight: 360, overflowY: 'auto', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{code}</pre>
            <button onClick={() => { navigator.clipboard?.writeText(code); window.alert('Copied!'); }} style={{ marginTop: 12, background: COLORS.accentGradient, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>Copy to Clipboard</button>
          </div>
        </div>
      )}
    </div>
  );
}
