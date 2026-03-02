export type MediaType = "image" | "video";
export type MediaCategory =
  | "hero"
  | "logo"
  | "social"
  | "marketing"
  | "product"
  | "documentation"
  | "video";

export interface MediaItem {
  id: string;
  type: MediaType;
  category: MediaCategory;
  url: string;
  thumbnailUrl?: string;
  prompt?: string;
  revisedPrompt?: string;
  projectId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  size?: number;
}

// In-memory store (replace with Supabase storage in production)
const store = new Map<string, MediaItem>();

export function addMedia(item: Omit<MediaItem, "id" | "createdAt">): MediaItem {
  const id = `media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const newItem: MediaItem = { ...item, id, createdAt: new Date().toISOString() };
  store.set(id, newItem);
  return newItem;
}

export function getMedia(id: string): MediaItem | undefined {
  return store.get(id);
}

export function deleteMedia(id: string): boolean {
  return store.delete(id);
}

export function listMedia(filters?: {
  type?: MediaType;
  category?: MediaCategory;
  projectId?: string;
}): MediaItem[] {
  const items = Array.from(store.values());
  if (!filters) return items;
  return items.filter((item) => {
    if (filters.type && item.type !== filters.type) return false;
    if (filters.category && item.category !== filters.category) return false;
    if (filters.projectId && item.projectId !== filters.projectId) return false;
    return true;
  });
}

export function getStorageStats(): { count: number; types: Record<string, number> } {
  const items = Array.from(store.values());
  const types: Record<string, number> = {};
  for (const item of items) {
    types[item.type] = (types[item.type] ?? 0) + 1;
  }
  return { count: items.length, types };
}
