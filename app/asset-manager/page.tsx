'use client';
import { useState, useRef } from 'react';

interface Asset {
  id: string;
  name: string;
  url: string;
  type: string;
  size: string;
}

const MOCK_ASSETS: Asset[] = [
  { id: '1', name: 'hero-banner.jpg', url: '/assets/hero-banner.jpg', type: 'image/jpeg', size: '245 KB' },
  { id: '2', name: 'logo.svg', url: '/assets/logo.svg', type: 'image/svg+xml', size: '12 KB' },
  { id: '3', name: 'background.png', url: '/assets/background.png', type: 'image/png', size: '1.2 MB' },
  { id: '4', name: 'icon-set.svg', url: '/assets/icon-set.svg', type: 'image/svg+xml', size: '34 KB' },
  { id: '5', name: 'product-shot.jpg', url: '/assets/product-shot.jpg', type: 'image/jpeg', size: '890 KB' },
  { id: '6', name: 'banner-mobile.png', url: '/assets/banner-mobile.png', type: 'image/png', size: '320 KB' },
];

export default function AssetManagerPage() {
  const [assets, setAssets] = useState<Asset[]>(MOCK_ASSETS);
  const [query, setQuery] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [selected, setSelected] = useState<Asset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = assets.filter(a => a.name.toLowerCase().includes(query.toLowerCase()));

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/asset-manager/upload', { method: 'POST', body: formData });
      const data = await res.json() as { url?: string; name?: string; size?: string; type?: string; error?: string };
      if (data.url) {
        const newAsset: Asset = {
          id: Date.now().toString(),
          name: data.name ?? file.name,
          url: data.url,
          type: data.type ?? file.type,
          size: data.size ?? `${Math.round(file.size / 1024)} KB`,
        };
        setAssets(prev => [newAsset, ...prev]);
        setSelected(newAsset);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files.length > 0 ? e.dataTransfer.files[0] : null;
    if (file) uploadFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const typeIcon = (type: string) => {
    if (type.includes('svg')) return '🎨';
    if (type.includes('png') || type.includes('jpeg') || type.includes('jpg')) return '🖼️';
    if (type.includes('video')) return '🎬';
    return '📄';
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <h1 className="text-2xl font-bold mb-2">Asset Manager</h1>
      <p className="text-gray-500 text-sm mb-6">Upload and manage your project assets.</p>

      {/* Upload area */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 mb-6 text-center cursor-pointer transition ${
          dragOver ? 'border-[#6366f1] bg-[#6366f1]/5' : 'border-white/10 hover:border-white/20 bg-[#111]'
        }`}
      >
        <p className="text-3xl mb-2">📁</p>
        {uploading ? (
          <p className="text-sm text-[#6366f1]">Uploading…</p>
        ) : (
          <>
            <p className="text-sm text-gray-300">Drag & drop files here or <span className="text-[#6366f1] underline">browse</span></p>
            <p className="text-xs text-gray-600 mt-1">PNG, JPG, SVG, GIF supported</p>
          </>
        )}
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFileInput} className="hidden" />
      </div>

      <div className="flex gap-6">
        {/* Asset grid */}
        <div className="flex-1">
          <div className="mb-4">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search assets…"
              className="w-full max-w-sm bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#6366f1]"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filtered.map(asset => (
              <button
                key={asset.id}
                onClick={() => setSelected(asset)}
                className={`bg-[#111] rounded-xl border p-3 text-left transition hover:border-[#6366f1]/50 ${
                  selected?.id === asset.id ? 'border-[#6366f1]' : 'border-white/10'
                }`}
              >
                <div className="h-16 flex items-center justify-center text-3xl mb-2 bg-[#1a1a1a] rounded-lg">
                  {typeIcon(asset.type)}
                </div>
                <p className="text-xs text-white truncate">{asset.name}</p>
                <p className="text-xs text-gray-500">{asset.size}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <aside className="w-56 bg-[#111] border border-white/10 rounded-xl p-4 flex flex-col gap-3 h-fit">
            <p className="text-sm font-semibold text-[#6366f1] truncate">{selected.name}</p>
            <div className="h-28 bg-[#1a1a1a] rounded-lg flex items-center justify-center text-4xl">
              {typeIcon(selected.type)}
            </div>
            <div className="text-xs text-gray-400 space-y-1">
              <p><span className="text-gray-500">Type:</span> {selected.type}</p>
              <p><span className="text-gray-500">Size:</span> {selected.size}</p>
            </div>
            <button
              onClick={() => copyUrl(selected.url)}
              className="w-full px-3 py-2 bg-[#6366f1] hover:bg-[#5254cc] rounded-lg text-xs font-semibold transition"
            >
              {copiedUrl ? '✓ Copied!' : 'Copy URL'}
            </button>
            <button
              onClick={() => setSelected(null)}
              className="w-full px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs transition"
            >
              Deselect
            </button>
          </aside>
        )}
      </div>
    </main>
  );
}
