'use client';
import { useState } from 'react';

interface Device {
  id: string;
  name: string;
  width: number;
  height: number;
  emoji: string;
}

const DEVICES: Device[] = [
  { id: 'iphone15', name: 'iPhone 15', width: 390, height: 844, emoji: '📱' },
  { id: 'samsung', name: 'Samsung Galaxy S24', width: 360, height: 780, emoji: '📱' },
  { id: 'ipad', name: 'iPad', width: 768, height: 1024, emoji: '📟' },
];

export default function DevicePreview() {
  const [url, setUrl] = useState('https://example.com');
  const [device, setDevice] = useState<Device>(DEVICES[0]);
  const [rotated, setRotated] = useState(false);
  const [frameUrl, setFrameUrl] = useState('');

  const frameW = rotated ? device.height : device.width;
  const frameH = rotated ? device.width : device.height;
  const scale = Math.min(1, 500 / frameH);

  function load() {
    setFrameUrl(url.startsWith('http') ? url : `https://${url}`);
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <h1 className="text-2xl font-bold mb-2">Mobile Preview Simulator</h1>
      <p className="text-gray-400 mb-6">Preview your app in different device frames</p>

      <div className="flex flex-wrap gap-3 mb-4">
        <input type="text" value={url} onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          placeholder="https://example.com"
          className="flex-1 min-w-64 bg-[#111] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#6366f1]" />
        <button onClick={load} className="px-5 py-2 rounded-lg bg-[#6366f1] hover:bg-[#5254cc] font-medium transition-colors">Load</button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        {DEVICES.map((d) => (
          <button key={d.id} onClick={() => setDevice(d)}
            className={`px-4 py-2 rounded-xl border text-sm transition-colors ${device.id === d.id ? 'border-[#6366f1] bg-[#6366f1]/10 text-white' : 'border-gray-700 bg-[#111] text-gray-400 hover:border-gray-500'}`}>
            {d.emoji} {d.name}
          </button>
        ))}
        <button onClick={() => setRotated((r) => !r)}
          className="px-4 py-2 rounded-xl border border-gray-700 bg-[#111] text-sm text-gray-400 hover:border-gray-500 transition-colors">
          {rotated ? '⬆️ Portrait' : '➡️ Landscape'}
        </button>
      </div>

      <div className="flex justify-center">
        <div className="relative" style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
          {/* Device frame */}
          <div className="border-[12px] border-gray-600 rounded-[40px] overflow-hidden bg-black shadow-2xl"
            style={{ width: frameW, height: frameH }}>
            {frameUrl ? (
              <iframe src={frameUrl} className="w-full h-full border-0" title="Device Preview" sandbox="allow-scripts allow-same-origin allow-forms" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#1a1a1a] text-gray-500 gap-3">
                <span className="text-4xl">{device.emoji}</span>
                <span className="text-sm">Enter a URL and click Load</span>
                <span className="text-xs">{frameW} × {frameH}px</span>
              </div>
            )}
          </div>
          {/* Home indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-24 h-1 bg-gray-500 rounded-full" />
        </div>
      </div>
    </main>
  );
}
