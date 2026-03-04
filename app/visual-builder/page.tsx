'use client';
import { useState, useCallback } from 'react';

type ComponentType = 'Hero' | 'Features' | 'Navbar' | 'Footer' | 'Card' | 'Button' | 'Text' | 'Image';

interface CanvasComponent {
  id: string;
  type: ComponentType;
  props: Record<string, string>;
}

const COMPONENT_BLOCKS: ComponentType[] = ['Hero', 'Features', 'Navbar', 'Footer', 'Card', 'Button', 'Text', 'Image'];

const componentPreviews: Record<ComponentType, string> = {
  Hero: 'bg-gradient-to-r from-indigo-600 to-purple-600 h-24 rounded flex items-center justify-center text-white font-bold',
  Features: 'bg-[#1a1a2e] h-16 rounded border border-[#6366f1]/30 flex items-center justify-center text-gray-300 text-sm',
  Navbar: 'bg-[#111] h-10 rounded flex items-center px-4 text-white text-sm border border-white/10',
  Footer: 'bg-[#0d0d0d] h-10 rounded flex items-center px-4 text-gray-500 text-xs border border-white/10',
  Card: 'bg-[#1a1a1a] h-16 rounded-lg border border-white/10 flex items-center justify-center text-white text-sm',
  Button: 'bg-[#6366f1] h-10 rounded-lg flex items-center justify-center text-white text-sm font-semibold w-32',
  Text: 'bg-transparent h-8 flex items-center text-gray-300 text-sm px-2 border-b border-white/10',
  Image: 'bg-[#1a1a1a] h-20 rounded border-2 border-dashed border-white/20 flex items-center justify-center text-gray-500 text-xs',
};

export default function VisualBuilderPage() {
  const [canvas, setCanvas] = useState<CanvasComponent[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [history, setHistory] = useState<CanvasComponent[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportedCode, setExportedCode] = useState('');

  const selectedComponent = canvas.find(c => c.id === selected);

  const pushHistory = useCallback((newCanvas: CanvasComponent[]) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, newCanvas];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const type = e.dataTransfer.getData('text/plain') as ComponentType;
    if (!type) return;
    const newComponent: CanvasComponent = {
      id: `${type}-${Date.now()}`,
      type,
      props: { label: type },
    };
    const newCanvas = [...canvas, newComponent];
    setCanvas(newCanvas);
    pushHistory(newCanvas);
    setSelected(newComponent.id);
  };

  const undo = () => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setCanvas(history[newIndex]);
    setSelected(null);
  };

  const removeComponent = (id: string) => {
    const newCanvas = canvas.filter(c => c.id !== id);
    setCanvas(newCanvas);
    pushHistory(newCanvas);
    if (selected === id) setSelected(null);
  };

  const updateProp = (key: string, value: string) => {
    if (!selected) return;
    const newCanvas = canvas.map(c =>
      c.id === selected ? { ...c, props: { ...c.props, [key]: value } } : c
    );
    setCanvas(newCanvas);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/visual-builder/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ components: canvas }),
      });
      const data = await res.json() as { code?: string; error?: string };
      setExportedCode(data.code ?? data.error ?? 'Error exporting');
    } finally {
      setExporting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[#111]">
        <h1 className="text-lg font-bold text-[#6366f1] mr-4">Visual Builder</h1>
        <button
          onClick={undo}
          disabled={historyIndex <= 0}
          className="px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 rounded disabled:opacity-40 transition"
        >
          ↩ Undo
        </button>
        <button
          onClick={handleExport}
          disabled={exporting || canvas.length === 0}
          className="px-3 py-1.5 text-sm bg-[#6366f1] hover:bg-[#5254cc] rounded disabled:opacity-40 transition font-semibold"
        >
          {exporting ? 'Exporting…' : '⬇ Export'}
        </button>
        <span className="text-xs text-gray-500 ml-auto">{canvas.length} component{canvas.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar – component blocks */}
        <aside className="w-44 border-r border-white/10 p-3 flex flex-col gap-2 bg-[#0d0d0d]">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Components</p>
          {COMPONENT_BLOCKS.map(type => (
            <div
              key={type}
              draggable
              onDragStart={e => e.dataTransfer.setData('text/plain', type)}
              className="px-3 py-2 bg-[#1a1a1a] hover:bg-[#6366f1]/20 border border-white/10 rounded cursor-grab text-sm transition select-none"
            >
              {type}
            </div>
          ))}
        </aside>

        {/* Center canvas */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`min-h-96 rounded-xl border-2 border-dashed transition p-4 flex flex-col gap-3 ${
              dragOver ? 'border-[#6366f1] bg-[#6366f1]/5' : 'border-white/10 bg-[#111]'
            }`}
          >
            {canvas.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
                Drag components here
              </div>
            )}
            {canvas.map(comp => (
              <div
                key={comp.id}
                onClick={() => setSelected(comp.id)}
                className={`group relative cursor-pointer rounded-lg transition ${
                  selected === comp.id ? 'ring-2 ring-[#6366f1]' : 'ring-1 ring-white/5'
                }`}
              >
                <div className={componentPreviews[comp.type]}>
                  {comp.props.label || comp.type}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); removeComponent(comp.id); }}
                  className="absolute top-1 right-1 text-xs bg-red-500/80 hover:bg-red-500 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 hover:opacity-100 transition"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar – property inspector */}
        <aside className="w-56 border-l border-white/10 p-4 bg-[#0d0d0d]">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">Properties</p>
          {selectedComponent ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-[#6366f1]">{selectedComponent.type}</p>
              {Object.entries(selectedComponent.props).map(([key, value]) => (
                <label key={key} className="flex flex-col gap-1">
                  <span className="text-xs text-gray-400 capitalize">{key}</span>
                  <input
                    value={value}
                    onChange={e => updateProp(key, e.target.value)}
                    className="bg-[#1a1a1a] border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#6366f1]"
                  />
                </label>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-600">Select a component to edit properties</p>
          )}
        </aside>
      </div>

      {/* Export output */}
      {exportedCode && (
        <div className="border-t border-white/10 p-4 bg-[#0d0d0d]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Exported Code</p>
            <button
              onClick={() => navigator.clipboard.writeText(exportedCode)}
              className="text-xs text-[#6366f1] hover:underline"
            >
              Copy
            </button>
          </div>
          <pre className="bg-[#111] rounded p-3 text-xs text-green-400 overflow-x-auto max-h-48">{exportedCode}</pre>
        </div>
      )}
    </main>
  );
}
