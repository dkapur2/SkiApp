interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/** Simple in-memory TTL cache. Thread-safe in single-threaded Node.js. */
export class Cache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();
  private readonly ttlMs: number;
  private readonly now: () => number;

  constructor(ttlSeconds: number, now: () => number = Date.now) {
    this.ttlMs = ttlSeconds * 1000;
    this.now = now;
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (this.now() - entry.timestamp > this.ttlMs) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: T): void {
    this.store.set(key, { data, timestamp: this.now() });
  }
}
