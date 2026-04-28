interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/** Simple in-memory TTL cache. Thread-safe in single-threaded Node.js. */
export class Cache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();
  private readonly ttlMs: number;

  constructor(ttlSeconds: number) {
    this.ttlMs = ttlSeconds * 1000;
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: T): void {
    this.store.set(key, { data, timestamp: Date.now() });
  }
}
