/**
 * Ski API integration via RapidAPI (free/basic tier).
 *
 * Free-tier features used:
 *   • Resort location  – resort slug lookup
 *   • Snow conditions  – base/summit depth, new snow, condition label
 *   • Lift status      – open lifts and runs vs. totals
 *   • Twitter feed     – latest resort tweets
 *
 * Required env vars:
 *   RAPIDAPI_KEY          – your RapidAPI key
 *
 * Optional env vars:
 *   RAPIDAPI_SKI_HOST     – RapidAPI host header (default: ski-resort-forecast.p.rapidapi.com)
 *
 * Resilience: every public function catches all errors and returns null / []
 * so the rest of the app continues if the Ski API is unavailable or rate-limited.
 */

import { Cache } from '../cache';
import type { SkiApiData, SkiSnowConditions, SkiLiftStatus, SkiTweet } from '../types';

// ── Configuration ─────────────────────────────────────────────────────────────

const DEFAULT_HOST = 'ski-resort-forecast.p.rapidapi.com';

function getApiKey(): string | null {
  return process.env.RAPIDAPI_KEY ?? null;
}

function getHost(): string {
  return process.env.RAPIDAPI_SKI_HOST ?? DEFAULT_HOST;
}

// ── Cache (30-minute TTL matches weather cache) ───────────────────────────────

const skiCache = new Cache<SkiApiData>(1800);

// ── Resort slug mapping ───────────────────────────────────────────────────────

/**
 * Maps our internal resort IDs to the slug the Ski API uses.
 *
 * Many IDs already match the API's slug format; only overrides are listed.
 * Resorts not present here will use the internal ID as-is.
 * Add entries here when you discover the API uses a different slug.
 */
const SLUG_OVERRIDES: Record<string, string> = {
  // Vermont
  'stowe':             'stowe-mountain-resort',
  'killington':        'killington-resort',
  'sugarbush':         'sugarbush-resort',
  'stratton':          'stratton-mountain-resort',
  'mount-snow':        'mount-snow-resort',
  'okemo':             'okemo-mountain-resort',
  'bromley-mountain':  'bromley-mountain-resort',
  'jay-peak':          'jay-peak-resort',
  'mad-river-glen':    'mad-river-glen-ski-area',
  'smugglers-notch':   'smugglers-notch-resort',
  // New Hampshire
  'cannon-mountain':   'cannon-mountain-ski-area',
  'loon-mountain':     'loon-mountain-resort',
  'bretton-woods':     'bretton-woods-ski-area',
  'waterville-valley': 'waterville-valley-resort',
  'gunstock-mountain': 'gunstock-mountain-resort',
  // Maine
  'sunday-river':      'sunday-river-ski-resort',
  'sugarloaf':         'sugarloaf-ski-resort',
  'saddleback':        'saddleback-maine',
  // New York
  'hunter-mountain':   'hunter-mountain-ski-resort',
  'whiteface-mountain':'whiteface-mountain-ski-area',
  'gore-mountain':     'gore-mountain-ski-center',
  'holiday-valley':    'holiday-valley-resort',
  'belleayre-mountain':'belleayre-mountain-ski-center',
  'windham-mountain':  'windham-mountain-resort',
  // Pennsylvania
  'seven-springs':     'seven-springs-mountain-resort',
  'camelback':         'camelback-mountain-resort',
  'elk-mountain':      'elk-mountain-ski-resort',
  'blue-mountain':     'blue-mountain-ski-area',
  // West Virginia
  'snowshoe':          'snowshoe-mountain-resort',
  // North Carolina
  'sugar-mountain':    'sugar-mountain-resort',
  'beech-mountain':    'beech-mountain-resort',
  // Massachusetts
  'jiminy-peak':       'jiminy-peak-mountain-resort',
  'wachusett-mountain':'wachusett-mountain-ski-area',
};

function resortSlug(resortId: string): string {
  return SLUG_OVERRIDES[resortId] ?? resortId;
}

// ── Raw API response types ────────────────────────────────────────────────────

/** Subset of the raw snowConditions response we actually parse */
interface RawSnow {
  // Numeric block (may contain CM values)
  Numeric?: Record<string, string | number>;
  // Human-readable block
  'Top Snow Depth'?: string;
  'Base Snow Depth'?: string;
  'Fresh Snowfall'?: string;
  'Snowfall last 48 hours'?: string;
  '48 Hour Snowfall'?: string;
  'Season Total'?: string;
  'Surface Conditions'?: string;
  'Conditions'?: string;
}

/** Subset of the raw lifts response */
interface RawLifts {
  'Open/Total Lifts'?: string;
  'Open/Total Runs'?: string;
  'Status'?: string;
  'Resort Status'?: string;
  openLifts?: number | string;
  totalLifts?: number | string;
  openRuns?: number | string;
  totalRuns?: number | string;
}

/** Subset of the raw twitter response */
interface RawTwitter {
  Twitter?: string[];
  tweets?: Array<{ text: string; created_at?: string; url?: string }>;
}

// ── Parsing helpers ───────────────────────────────────────────────────────────

/** Parse "N cm" or "N in" → inches. Returns null if unparseable. */
function parseDepthToInches(raw: string | number | undefined | null): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return raw; // assume already in inches
  const str = String(raw).trim().toLowerCase();
  const match = str.match(/^([\d.]+)\s*(cm|in|"|inches?|centimeters?)?$/);
  if (!match) return null;
  const val = parseFloat(match[1]);
  const unit = match[2] ?? 'cm';
  if (unit.startsWith('in') || unit === '"') return Math.round(val * 10) / 10;
  return Math.round((val / 2.54) * 10) / 10; // cm → inches
}

/** Parse "12/30" style open/total string. Returns [open, total] or [null, null]. */
function parseOpenTotal(raw: string | undefined): [number | null, number | null] {
  if (!raw) return [null, null];
  const parts = raw.split('/').map(s => parseInt(s.trim(), 10));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return [parts[0], parts[1]];
  }
  return [null, null];
}

function normalizeSnow(raw: RawSnow): SkiSnowConditions {
  const num = raw.Numeric ?? {};

  // Try numeric block first (often more precise), then human-readable string
  const baseIn = parseDepthToInches(
    num['Base Snow Depth: (cm)'] ?? num['Base Snow Depth'] ?? raw['Base Snow Depth'],
  );
  const summitIn = parseDepthToInches(
    num['Top Snow Depth: (cm)'] ?? num['Top Snow Depth'] ?? raw['Top Snow Depth'],
  );
  const new24hIn = parseDepthToInches(
    num['Fresh Snowfall: (cm)'] ?? num['Fresh Snowfall'] ?? raw['Fresh Snowfall'],
  );
  const new48hIn = parseDepthToInches(
    num['48 Hour Snowfall: (cm)'] ?? num['48 Hour Snowfall'] ??
    raw['Snowfall last 48 hours'] ?? raw['48 Hour Snowfall'],
  );
  const seasonIn = parseDepthToInches(
    num['Season Total: (cm)'] ?? num['Season Total'] ?? raw['Season Total'],
  );

  return {
    snow_depth_base_in:   baseIn,
    snow_depth_summit_in: summitIn,
    new_snow_24h_in:      new24hIn,
    new_snow_48h_in:      new48hIn,
    season_total_in:      seasonIn,
    conditions:           raw['Surface Conditions'] ?? raw['Conditions'] ?? null,
  };
}

function normalizeLifts(raw: RawLifts): SkiLiftStatus {
  const [liftsOpen, liftsTotal] = parseOpenTotal(raw['Open/Total Lifts']);
  const [runsOpen, runsTotal]   = parseOpenTotal(raw['Open/Total Runs']);

  return {
    lifts_open:     liftsOpen  ?? (raw.openLifts  !== undefined ? Number(raw.openLifts)  : null),
    lifts_total:    liftsTotal ?? (raw.totalLifts  !== undefined ? Number(raw.totalLifts) : null),
    runs_open:      runsOpen   ?? (raw.openRuns    !== undefined ? Number(raw.openRuns)   : null),
    runs_total:     runsTotal  ?? (raw.totalRuns   !== undefined ? Number(raw.totalRuns)  : null),
    resort_status:  raw.Status ?? raw['Resort Status'] ?? null,
  };
}

function normalizeTweets(raw: RawTwitter): SkiTweet[] {
  if (Array.isArray(raw.tweets)) {
    return raw.tweets.slice(0, 5).map(t => ({
      text:       t.text,
      created_at: t.created_at ?? new Date().toISOString(),
      url:        t.url ?? null,
    }));
  }
  if (Array.isArray(raw.Twitter)) {
    return raw.Twitter.slice(0, 5).map(text => ({
      text,
      created_at: new Date().toISOString(),
      url:        null,
    }));
  }
  return [];
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function skiGet<T>(path: string): Promise<T | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null; // key not configured → skip silently

  const host = getHost();
  const url = `https://${host}/${path}`;

  try {
    const res = await fetch(url, {
      headers: {
        'X-RapidAPI-Key':  apiKey,
        'X-RapidAPI-Host': host,
      },
      signal: AbortSignal.timeout(10_000),
    });

    // 429 = rate limited; 404 = resort not found in Ski API — both are silently ignored
    if (res.status === 429 || res.status === 404) return null;

    if (!res.ok) {
      console.warn(`[skiApi] ${res.status} from ${url}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (e) {
    // Network errors, timeouts, etc.
    console.warn(`[skiApi] fetch error for ${path}:`, (e as Error).message);
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch all available free-tier Ski API data for a resort.
 * Returns null if the API key is not configured or the resort has no slug.
 * Never throws — all errors result in null returns.
 */
export async function fetchSkiApiData(resortId: string): Promise<SkiApiData | null> {
  if (!getApiKey()) return null;

  const cached = skiCache.get(resortId);
  if (cached !== null) return cached;

  const slug = resortSlug(resortId);

  // Fetch all three endpoints concurrently; partial failures are acceptable
  const [rawSnow, rawLifts, rawTwitter] = await Promise.all([
    skiGet<RawSnow>(`${slug}/snowConditions`),
    skiGet<RawLifts>(`${slug}/lifts`),
    skiGet<RawTwitter>(`${slug}/twitter`),
  ]);

  // If every endpoint came back null, don't cache a useless result
  if (rawSnow === null && rawLifts === null && rawTwitter === null) return null;

  const result: SkiApiData = {
    snow:       rawSnow   ? normalizeSnow(rawSnow)     : null,
    lifts:      rawLifts  ? normalizeLifts(rawLifts)   : null,
    tweets:     rawTwitter ? normalizeTweets(rawTwitter) : [],
    fetched_at: new Date().toISOString(),
    source:     'ski-api',
  };

  skiCache.set(resortId, result);
  return result;
}
