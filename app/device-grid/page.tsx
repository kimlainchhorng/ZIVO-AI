'use client';
import { useState } from 'react';

const DEVICES = [
  { id: 'iphonese', label: 'iPhone SE', width: 375, height: 667, scale: 0.4 },
  { id: 'iphone15', label: 'iPhone 15', width: 390, height: 844, scale: 0.35 },
  { id: 'android', label: 'Android (S24)', width: 360, height: 780, scale: 0.38 },
  { id: 'ipadmini', label: 'iPad Mini', width: 744, height: 1024, scale: 0.28 },
  { id: 'ipadpro', label: 'iPad Pro', width: 1024, height: 1366, scale: 0.22 },
  { id: 'macbook', label: 'MacBook Air', width: 1280, height: 800, scale: 0.28 },
];

export default function DeviceGrid() {
  const [url, setUrl] = useState('https://example.com');
  const [frameUrl, setFrameUrl] = useState('');

  function load() {
    setFrameUrl(url.startsWith('http') ? url : `https://${url}`);
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <h1 className="text-2xl font-bold mb-2">Device Preview Grid</h1>
      <p className="text-gray-400 mb-6">Preview across multiple devices simultaneously</p>

      <div className="flex gap-3 mb-6 max-w-xl">
        <input type="text" value={url} onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          placeholder="https://example.com"
          className="flex-1 bg-[#111] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#6366f1]" />
        <button onClick={load} className="px-5 py-2 rounded-lg bg-[#6366f1] hover:bg-[#5254cc] font-medium transition-colors">Load All</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {DEVICES.map((d) => (
          <div key={d.id} className="bg-[#111] border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-sm">{d.label}</span>
              <span className="text-xs text-gray-500">{d.width}×{d.height}</span>
            </div>
            <div className="overflow-hidden rounded-lg bg-[#0a0a0a] flex items-center justify-center"
              style={{ height: Math.round(d.height * d.scale) }}>
              <div style={{ width: d.width, height: d.height, transform: `scale(${d.scale})`, transformOrigin: 'top left', flexShrink: 0 }}>
                {frameUrl ? (
                  <iframe src={frameUrl} className="border-0" style={{ width: d.width, height: d.height }} title={d.label}
                    sandbox="allow-scripts allow-same-origin allow-forms" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a] text-gray-600 text-sm">
                    Load a URL
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
