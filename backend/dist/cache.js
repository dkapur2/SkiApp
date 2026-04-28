"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cache = void 0;
/** Simple in-memory TTL cache. Thread-safe in single-threaded Node.js. */
class Cache {
    store = new Map();
    ttlMs;
    constructor(ttlSeconds) {
        this.ttlMs = ttlSeconds * 1000;
    }
    get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return null;
        if (Date.now() - entry.timestamp > this.ttlMs) {
            this.store.delete(key);
            return null;
        }
        return entry.data;
    }
    set(key, data) {
        this.store.set(key, { data, timestamp: Date.now() });
    }
}
exports.Cache = Cache;
