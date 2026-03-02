'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  category: string;
  url: string;
  thumbnailUrl?: string;
  prompt?: string;
  projectId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface StorageStats {
  count: number;
  types: Record<string, number>;
}

export default function MediaGallery() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [stats, setStats] = useState<StorageStats>({ count: 0, types: {} });
  const [filter, setFilter] = useState<{ type: string; category: string }>({
    type: '',
    category: '',
  });
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [error, setError] = useState('');

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filter.type) params.set('type', filter.type);
      if (filter.category) params.set('category', filter.category);
      const res = await fetch(`/api/media/library?${params.toString()}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setItems(data.items ?? []);
      setStats(data.stats ?? { count: 0, types: {} });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load media');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this media item?')) return;
    try {
      const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete media');
    }
  };

  const handleRegenerate = async (item: MediaItem) => {
    try {
      const res = await fetch('/api/media/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId: item.id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      fetchMedia();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to regenerate media');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Media Library
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              {stats.count} items &mdash;{' '}
              {Object.entries(stats.types)
                .map(([t, n]) => `${n} ${t}(s)`)
                .join(', ') || 'empty'}
            </p>
          </div>
          <button
            onClick={fetchMedia}
            className="px-4 py-2 bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <select
            value={filter.type}
            onChange={(e) => setFilter((f) => ({ ...f, type: e.target.value }))}
            className="px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 text-sm"
          >
            <option value="">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>
          <select
            value={filter.category}
            onChange={(e) => setFilter((f) => ({ ...f, category: e.target.value }))}
            className="px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 text-sm"
          >
            <option value="">All Categories</option>
            <option value="hero">Hero</option>
            <option value="logo">Logo</option>
            <option value="social">Social</option>
            <option value="marketing">Marketing</option>
            <option value="product">Product</option>
            <option value="video">Video</option>
          </select>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-48 text-zinc-400">
            Loading...
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-zinc-400 gap-2">
            <p className="text-lg">No media found</p>
            <p className="text-sm">
              Generate images or videos using the API endpoints
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="group relative bg-white dark:bg-zinc-800 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelected(item)}
              >
                {item.type === 'image' && item.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt={item.prompt ?? item.category}
                    className="w-full aspect-video object-cover"
                  />
                ) : (
                  <div className="w-full aspect-video bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center text-zinc-400 text-4xl">
                    {item.type === 'video' ? '🎬' : '🖼️'}
                  </div>
                )}
                <div className="p-3">
                  <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 mb-1 capitalize">
                    {item.category}
                  </span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    {item.prompt ?? item.id}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                  {item.type === 'image' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRegenerate(item);
                      }}
                      className="p-1.5 bg-white dark:bg-zinc-800 rounded-lg shadow text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50"
                      title="Regenerate"
                    >
                      ↻
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="p-1.5 bg-white dark:bg-zinc-800 rounded-lg shadow text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lightbox */}
        {selected && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setSelected(null)}
          >
            <div
              className="bg-white dark:bg-zinc-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 capitalize">
                  {selected.category} {selected.type}
                </h2>
                <button
                  onClick={() => setSelected(null)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  ✕
                </button>
              </div>
              {selected.type === 'image' && selected.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selected.url}
                  alt={selected.prompt ?? 'Generated image'}
                  className="w-full rounded-lg mb-4"
                />
              ) : (
                <div className="w-full h-48 bg-zinc-100 dark:bg-zinc-700 rounded-lg flex items-center justify-center text-5xl mb-4">
                  🎬
                </div>
              )}
              {selected.prompt && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                  <span className="font-medium">Prompt:</span> {selected.prompt}
                </p>
              )}
              <p className="text-xs text-zinc-400">ID: {selected.id}</p>
              <p className="text-xs text-zinc-400">
                Created: {new Date(selected.createdAt).toLocaleString()}
              </p>
              <div className="flex gap-3 mt-4">
                {selected.url && (
                  <a
                    href={selected.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center px-4 py-2 bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Download
                  </a>
                )}
                {selected.type === 'image' && (
                  <button
                    onClick={() => handleRegenerate(selected)}
                    className="flex-1 px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                  >
                    Regenerate
                  </button>
                )}
                <button
                  onClick={() => handleDelete(selected.id)}
                  className="px-4 py-2 border border-red-200 dark:border-red-800 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
