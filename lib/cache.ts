// lib/cache.ts — Generic TTL-based in-memory cache with LRU eviction

interface CacheEntry<V> {
  value: V;
  expiresAt: number | null; // null = no expiry
  lastAccessed: number;
}

/**
 * Generic TTL-based in-memory cache with LRU eviction.
 * Max size defaults to 500 entries.
 */
export class Cache<K, V> {
  private readonly store = new Map<K, CacheEntry<V>>();
  private readonly maxSize: number;
  private readonly defaultTtlMs: number | undefined;

  constructor(options: { maxSize?: number; defaultTtlMs?: number } = {}) {
    this.maxSize = options.maxSize ?? 500;
    this.defaultTtlMs = options.defaultTtlMs;
  }

  /** Returns the number of entries currently in the cache. */
  get size(): number {
    return this.store.size;
  }

  /**
   * Retrieves a value by key. Returns undefined if not found or expired.
   */
  get(key: K): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    const now = Date.now();
    if (entry.expiresAt !== null && now > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    entry.lastAccessed = now;
    return entry.value;
  }

  /**
   * Stores a value with an optional TTL in milliseconds.
   * Evicts the least recently used entry if the cache is full.
   */
  set(key: K, value: V, ttlMs?: number): void {
    // Evict LRU entry if at capacity
    if (!this.store.has(key) && this.store.size >= this.maxSize) {
      this._evictLRU();
    }
    const resolvedTtl = ttlMs ?? this.defaultTtlMs;
    this.store.set(key, {
      value,
      expiresAt: resolvedTtl != null ? Date.now() + resolvedTtl : null,
      lastAccessed: Date.now(),
    });
  }

  /** Returns true if the key exists and is not expired. */
  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  /** Removes an entry by key. Returns true if it existed. */
  delete(key: K): boolean {
    return this.store.delete(key);
  }

  /** Clears all cache entries. */
  clear(): void {
    this.store.clear();
  }

  private _evictLRU(): void {
    let lruKey: K | undefined;
    let lruTime = Infinity;
    for (const [k, v] of this.store) {
      if (v.lastAccessed < lruTime) {
        lruTime = v.lastAccessed;
        lruKey = k;
      }
    }
    if (lruKey !== undefined) {
      this.store.delete(lruKey);
    }
  }
}

export interface MemoizeOptions {
  maxSize?: number;
  ttlMs?: number;
  keyFn?: (...args: unknown[]) => string;
}

/**
 * Wraps an async function with an in-memory cache.
 * Subsequent calls with the same arguments return the cached result.
 */
export function memoize<T>(
  fn: (...args: unknown[]) => Promise<T>,
  options: MemoizeOptions = {}
): (...args: unknown[]) => Promise<T> {
  const cache = new Cache<string, T>({ maxSize: options.maxSize, defaultTtlMs: options.ttlMs });
  return async (...args: unknown[]): Promise<T> => {
    const key = options.keyFn ? options.keyFn(...args) : JSON.stringify(args);
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    const result = await fn(...args);
    cache.set(key, result);
    return result;
  };
}
