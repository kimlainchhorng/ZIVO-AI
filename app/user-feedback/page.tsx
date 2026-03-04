'use client';
import { useState } from 'react';

interface FeedbackEntry {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

const MOCK_FEEDBACK: FeedbackEntry[] = [
  { id: '1', user: 'alice@example.com', rating: 5, comment: 'Amazing product, love the UI!', date: '2025-01-10' },
  { id: '2', user: 'bob@example.com', rating: 4, comment: 'Great but could use better docs.', date: '2025-01-09' },
  { id: '3', user: 'carol@example.com', rating: 3, comment: 'Decent, some bugs in mobile.', date: '2025-01-08' },
  { id: '4', user: 'dave@example.com', rating: 5, comment: 'Best dev tool I have used!', date: '2025-01-07' },
  { id: '5', user: 'eve@example.com', rating: 2, comment: 'Slow load times on large files.', date: '2025-01-06' },
  { id: '6', user: 'frank@example.com', rating: 4, comment: 'Solid, would recommend.', date: '2025-01-05' },
];

export default function UserFeedback() {
  const [filter, setFilter] = useState(0);
  const [widgetCode, setWidgetCode] = useState('');
  const [loading, setLoading] = useState(false);

  const filtered = filter === 0 ? MOCK_FEEDBACK : MOCK_FEEDBACK.filter((f) => f.rating === filter);
  const avg = (MOCK_FEEDBACK.reduce((s, f) => s + f.rating, 0) / MOCK_FEEDBACK.length).toFixed(1);

  async function getWidgetCode() {
    setLoading(true);
    const res = await fetch('/api/user-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get-widget-code' }),
    });
    const data = await res.json() as { code?: string; result?: string };
    setWidgetCode(data.code ?? data.result ?? '');
    setLoading(false);
  }

  function exportCSV() {
    const rows = ['User,Rating,Comment,Date', ...MOCK_FEEDBACK.map((f) => `${f.user},${f.rating},"${f.comment}",${f.date}`)];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'feedback.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Feedback Dashboard</h1>
        <button onClick={exportCSV} className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm transition-colors">
          Export CSV
        </button>
      </div>
      <p className="text-gray-400 mb-6">Average score: <span className="text-yellow-400 font-bold">{avg} ★</span></p>

      <div className="flex gap-2 mb-6">
        {[0, 5, 4, 3, 2, 1].map((r) => (
          <button key={r} onClick={() => setFilter(r)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${filter === r ? 'bg-[#6366f1] text-white' : 'bg-[#1a1a1a] text-gray-400 hover:bg-gray-800'}`}>
            {r === 0 ? 'All' : `${r}★`}
          </button>
        ))}
      </div>

      <div className="space-y-3 mb-8">
        {filtered.map((f) => (
          <div key={f.id} className="bg-[#111] border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{f.user}</span>
              <span className="text-xs text-gray-500">{f.date}</span>
            </div>
            <div className="text-yellow-400 mb-2">{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</div>
            <p className="text-gray-300 text-sm">{f.comment}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-800 pt-6">
        <button onClick={getWidgetCode} disabled={loading}
          className="px-6 py-2.5 rounded-lg bg-[#6366f1] hover:bg-[#5254cc] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4">
          {loading ? 'Loading…' : 'Get Embeddable Widget Code'}
        </button>
        {widgetCode && (
          <pre className="bg-[#111] border border-gray-800 rounded-xl p-4 text-sm text-green-400 overflow-x-auto whitespace-pre-wrap">{widgetCode}</pre>
        )}
      </div>
    </main>
  );
}
