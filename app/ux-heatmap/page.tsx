'use client';
import { useState } from 'react';

const MOCK_TOP_ELEMENTS = [
  { rank: 1, element: '#cta-button', clicks: 1842, percent: 24 },
  { rank: 2, element: '.nav-home', clicks: 1203, percent: 16 },
  { rank: 3, element: '#pricing-link', clicks: 987, percent: 13 },
  { rank: 4, element: '.feature-card-1', clicks: 743, percent: 10 },
  { rank: 5, element: '#sign-up', clicks: 612, percent: 8 },
  { rank: 6, element: '.hero-image', clicks: 534, percent: 7 },
  { rank: 7, element: '#docs-link', clicks: 421, percent: 6 },
  { rank: 8, element: '.testimonial-1', clicks: 378, percent: 5 },
  { rank: 9, element: '#blog-link', clicks: 312, percent: 4 },
  { rank: 10, element: '.footer-contact', clicks: 287, percent: 4 },
];

// Generate a 12x8 grid of random intensities
const GRID = Array.from({ length: 8 }, () =>
  Array.from({ length: 12 }, () => Math.random())
);

function intensityToColor(v: number): string {
  if (v > 0.8) return 'bg-red-500';
  if (v > 0.6) return 'bg-orange-500';
  if (v > 0.4) return 'bg-yellow-500';
  if (v > 0.2) return 'bg-green-600';
  return 'bg-blue-900';
}

const DATE_RANGES = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'All time'];

export default function UXHeatmap() {
  const [dateRange, setDateRange] = useState('Last 30 days');

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <h1 className="text-2xl font-bold mb-2">UX Heatmap Analytics</h1>
      <p className="text-gray-400 mb-6">Click density visualization across your app</p>

      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm text-gray-400">Date range:</label>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#6366f1]"
        >
          {DATE_RANGES.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap */}
        <div className="lg:col-span-2 bg-[#111] border border-gray-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-400 mb-3">Click Density Map — {dateRange}</h2>
          <div className="aspect-video bg-[#0a0a0a] rounded-lg overflow-hidden flex flex-col gap-0.5 p-1">
            {GRID.map((row, ri) => (
              <div key={ri} className="flex gap-0.5 flex-1">
                {row.map((val, ci) => (
                  <div
                    key={ci}
                    className={`flex-1 rounded-sm ${intensityToColor(val)}`}
                    style={{ opacity: 0.2 + val * 0.8 }}
                    title={`Intensity: ${(val * 100).toFixed(0)}%`}
                  />
                ))}
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
            <span>Low</span>
            {['bg-blue-900', 'bg-green-600', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500'].map((c) => (
              <div key={c} className={`w-5 h-3 rounded ${c}`} />
            ))}
            <span>High</span>
          </div>
        </div>

        {/* Top 10 */}
        <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-400 mb-3">Top 10 Clicked Elements</h2>
          <div className="space-y-2">
            {MOCK_TOP_ELEMENTS.map((el) => (
              <div key={el.rank} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-4">{el.rank}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono text-gray-300 truncate">{el.element}</div>
                  <div className="h-1.5 bg-gray-800 rounded-full mt-1">
                    <div className="h-full bg-[#6366f1] rounded-full" style={{ width: `${el.percent}%` }} />
                  </div>
                </div>
                <span className="text-xs text-gray-500 shrink-0">{el.clicks.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
