import { Cache } from '../cache';
import type {
  Resort,
  OpenMeteoResponse,
  WeatherConditions,
  HourlySnapshot,
  HourlyElevationData,
  DailyForecast,
  DailyElevationData,
  ResortMetadata,
  HikingDestination,
  TrailWeatherPoint,
} from '../types';
import { RESORTS } from '../data/resorts';
import { feetToInches, feetToMiles, roundFeet } from './openMeteoUnits';
import { createWeatherMetadata, splitPrecipitationByPhase } from './openMeteoSemantics';

// ── Constants ─────────────────────────────────────────────────────────────────

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const FORECAST_DAYS = 16; // today + 15
const HOURLY_WINDOW = 12;

const ELEVATION_DAILY_VARS = [
  'temperature_2m_max',
  'temperature_2m_min',
  'apparent_temperature_max',
  'apparent_temperature_min',
  'windspeed_10m_max',
  'windgusts_10m_max',
  'snowfall_sum',
  'rain_sum',
  'precipitation_sum',
];

const ELEVATION_HOURLY_VARS = [
  'temperature_2m',
  'apparent_temperature',
  'windspeed_10m',
  'windgusts_10m',
  'snowfall',
  'rain',
  'precipitation',
  'snow_depth',
  'visibility',
];

const PEAK_EXTRA_HOURLY_VARS = [
  'cloudcover',
  'freezinglevel_height',
];

// Standard environmental lapse rate: 6.5 °C / 1000 m → °F per metre
const LAPSE_RATE_F_PER_M = (6.5 / 1000.0) * 1.8; // ≈ 0.01170 °F/m
// Cache with 30-minute TTL
const conditionsCache = new Cache<WeatherConditions>(1800);

// ── Unit helpers ──────────────────────────────────────────────────────────────

// ── Elevation adjustment ──────────────────────────────────────────────────────

/**
 * Return a shallow copy of `raw` with temperature arrays shifted for `targetElev`.
 * All non-temperature arrays are shared by reference to avoid copying megabytes.
 */
function atElevation(
  raw: OpenMeteoResponse,
  modelElev: number,
  targetElev: number,
): OpenMeteoResponse {
  const offsetF = (modelElev - targetElev) * LAPSE_RATE_F_PER_M;
  if (Math.abs(offsetF) <= 0.01) return raw;

  const shift = (arr: (number | null)[]): (number | null)[] =>
    arr.map(v => (v !== null ? Math.round((v + offsetF) * 10) / 10 : null));

  return {
    ...raw,
    hourly: {
      ...raw.hourly,
      temperature_2m: shift(raw.hourly.temperature_2m),
      apparent_temperature: shift(raw.hourly.apparent_temperature),
    },
    daily: {
      ...raw.daily,
      temperature_2m_max: shift(raw.daily.temperature_2m_max),
      temperature_2m_min: shift(raw.daily.temperature_2m_min),
      apparent_temperature_max: shift(raw.daily.apparent_temperature_max),
      apparent_temperature_min: shift(raw.daily.apparent_temperature_min),
    },
  };
}

// ── Open-Meteo fetch with retry ───────────────────────────────────────────────

async function fetchOpenMeteo(
  lat: number,
  lon: number,
  dailyVars: string[],
  hourlyVars: string[],
  elevation?: number,
): Promise<OpenMeteoResponse> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: dailyVars.join(','),
    hourly: hourlyVars.join(','),
    temperature_unit: 'fahrenheit',
    windspeed_unit: 'mph',
    precipitation_unit: 'inch',
    forecast_days: String(FORECAST_DAYS),
    timezone: 'auto',
  });
  // Hiking points use mapped terrain elevations for provider downscaling.
  if (elevation !== undefined) params.set('elevation', String(elevation));

  let lastError: Error = new Error('No attempts made');
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${OPEN_METEO_URL}?${params}`, {
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) {
        throw new Error(`Open-Meteo HTTP ${res.status}: ${await res.text()}`);
      }
      return (await res.json()) as OpenMeteoResponse;
    } catch (e) {
      lastError = e as Error;
      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000 * 2 ** attempt));
      }
    }
  }
  throw lastError;
}

// ── Hourly → daily aggregation ────────────────────────────────────────────────

/**
 * Bucket hourly values by date, apply `fn` to each bucket.
 * Null values are skipped; dates with no non-null values are excluded.
 */
function dailyAgg<T>(
  data: OpenMeteoResponse,
  varName: string,
  fn: (vals: number[]) => T,
): Record<string, T> {
  const times = data.hourly.time;
  const values = (data.hourly as Record<string, (number | null)[]>)[varName] ?? [];
  const buckets: Record<string, number[]> = {};
  for (let i = 0; i < times.length; i++) {
    const v = values[i];
    if (v !== null && v !== undefined) {
      const date = times[i].slice(0, 10);
      (buckets[date] ??= []).push(v);
    }
  }
  const result: Record<string, T> = {};
  for (const [date, vals] of Object.entries(buckets)) {
    result[date] = fn(vals);
  }
  return result;
}

/** Build per-elevation daily rows for one elevation view of the data. */
function elevationDays(data: OpenMeteoResponse): Record<string, Omit<DailyElevationData, 'elevation_ft'>> {
  const d = data.daily;
  const snowDepthMax = dailyAgg(data, 'snow_depth', vals => feetToInches(Math.max(...vals)));
  const visibilityMin = dailyAgg(data, 'visibility', vals => feetToMiles(Math.min(...vals)));

  const result: Record<string, Omit<DailyElevationData, 'elevation_ft'>> = {};
  for (let i = 0; i < d.time.length; i++) {
    const date = d.time[i];
    const hi = d.temperature_2m_max[i];
    const lo = d.temperature_2m_min[i];
    const meanTemp = hi !== null && lo !== null ? (hi + lo) / 2 : null;
    const [snowfall, rain] = splitPrecipitationByPhase(d.precipitation_sum[i], meanTemp);
    result[date] = {
      high_f:            hi,
      low_f:             lo,
      apparent_high_f:   d.apparent_temperature_max[i],
      apparent_low_f:    d.apparent_temperature_min[i],
      max_windspeed_mph: d.windspeed_10m_max[i],
      max_windgusts_mph: d.windgusts_10m_max[i],
      snowfall_in:       snowfall,
      rain_in:           rain,
      precipitation_in:  d.precipitation_sum[i],
      max_snow_depth_in: snowDepthMax[date] ?? null,
      min_visibility_mi: visibilityMin[date] ?? null,
    };
  }
  return result;
}

/** Extract one hour's worth of elevation-specific data. */
function hourlyElevationSnapshot(
  data: OpenMeteoResponse,
  idx: number,
): Omit<HourlyElevationData, 'elevation_ft'> {
  const h = data.hourly;
  const temp = h.temperature_2m[idx];
  const [snowfall, rain] = splitPrecipitationByPhase(h.precipitation[idx], temp);
  return {
    temperature_f:          temp,
    apparent_temperature_f: h.apparent_temperature[idx],
    windspeed_mph:          h.windspeed_10m[idx],
    windgusts_mph:          h.windgusts_10m[idx],
    snowfall_in:            snowfall,
    rain_in:                rain,
    precipitation_in:       h.precipitation[idx],
    snow_depth_in:          feetToInches(h.snow_depth[idx]),
    visibility_mi:          feetToMiles(h.visibility[idx]),
  };
}

/** Find the index of the current hour in the API's time array. */
function currentHourIndex(data: OpenMeteoResponse, requireCurrentHour = false): number {
  const localNow = new Date(Date.now() + data.utc_offset_seconds * 1000);
  const year  = localNow.getUTCFullYear();
  const month = String(localNow.getUTCMonth() + 1).padStart(2, '0');
  const day   = String(localNow.getUTCDate()).padStart(2, '0');
  const hour  = String(localNow.getUTCHours()).padStart(2, '0');
  const target = `${year}-${month}-${day}T${hour}:00`;
  const idx = data.hourly.time.indexOf(target);
  if (requireCurrentHour && idx < 0) throw new Error('Trail weather is missing the current hour');
  return idx >= 0 ? idx : 0;
}

// ── Main fetch ────────────────────────────────────────────────────────────────

/** Fetch weather conditions for one resort. Results are cached for 30 minutes. */
export async function fetchResortConditions(resort: Resort): Promise<WeatherConditions> {
  const cached = conditionsCache.get(resort.id);
  if (cached !== null) return cached;

  const allHourly = [...ELEVATION_HOURLY_VARS, ...PEAK_EXTRA_HOURLY_VARS];
  const raw = await fetchOpenMeteo(resort.latitude, resort.longitude, ELEVATION_DAILY_VARS, allHourly);
  const providerFetchedAt = new Date();

  const modelElev = raw.elevation ?? resort.mid_elevation;
  const baseData  = atElevation(raw, modelElev, resort.base_elevation);
  const midData   = atElevation(raw, modelElev, resort.mid_elevation);
  const peakData  = atElevation(raw, modelElev, resort.peak_elevation);

  const result = buildConditions(resort, baseData, midData, peakData, providerFetchedAt);
  conditionsCache.set(resort.id, result);
  return result;
}

/** Three independent trail coordinates, each downscaled once by Open-Meteo. */
export async function fetchHikingConditions(destination: HikingDestination): Promise<WeatherConditions> {
  const cacheKey = `hiking:${destination.id}:${JSON.stringify(destination.weather_points)}`;
  const cached = conditionsCache.get(cacheKey);
  if (cached !== null) return cached;

  const responses = await Promise.all((['base', 'mid', 'peak'] as const).map(async zone => {
    const point = destination.weather_points[zone];
    const data = await fetchOpenMeteo(point.latitude, point.longitude, ELEVATION_DAILY_VARS,
      [...ELEVATION_HOURLY_VARS, ...PEAK_EXTRA_HOURLY_VARS], point.elevation);
    const fetchedAt = Date.now();
    validateTrailWeather(data, point);
    return { data, fetchedAt };
  }));
  const [base, mid, peak] = responses.map(response => response.data);
  for (const data of [base, mid]) {
    if (data.utc_offset_seconds !== peak.utc_offset_seconds ||
        JSON.stringify(data.hourly.time) !== JSON.stringify(peak.hourly.time) ||
        JSON.stringify(data.daily.time) !== JSON.stringify(peak.daily.time)) {
      throw new Error('Trail weather time windows do not match');
    }
  }
  // Use the oldest completed fetch in the cohort, never freshen an older point.
  const fetchedAt = new Date(Math.min(...responses.map(response => response.fetchedAt)));
  const result = buildConditions(destination, base, mid, peak, fetchedAt, true);
  // A partial or invalid cohort is never cached or substituted with another point.
  conditionsCache.set(cacheKey, result);
  return result;
}

function validateTrailWeather(data: OpenMeteoResponse, point: TrailWeatherPoint): void {
  if (!Number.isFinite(data.elevation) || Math.abs(data.elevation - point.elevation) > 0.1) {
    throw new Error('Trail weather elevation does not match the requested point');
  }
  const hourlyUnits: Record<string, string> = {
    temperature_2m: '°F', apparent_temperature: '°F', windspeed_10m: 'mp/h',
    windgusts_10m: 'mp/h', snowfall: 'inch', rain: 'inch', precipitation: 'inch',
    snow_depth: 'ft', visibility: 'ft', cloudcover: '%', freezinglevel_height: 'ft',
  };
  const dailyUnits: Record<string, string> = {
    temperature_2m_max: '°F', temperature_2m_min: '°F', apparent_temperature_max: '°F',
    apparent_temperature_min: '°F', windspeed_10m_max: 'mp/h', windgusts_10m_max: 'mp/h',
    snowfall_sum: 'inch', rain_sum: 'inch', precipitation_sum: 'inch',
  };
  for (const [section, expectedUnits] of [['hourly', hourlyUnits], ['daily', dailyUnits]] as const) {
    const times = data[section]?.time;
    if (!Array.isArray(times) || !times.length || new Set(times).size !== times.length ||
        times.some((time, index) => typeof time !== 'string' || (index > 0 && time <= times[index - 1]))) {
      throw new Error(`Invalid trail weather ${section} times`);
    }
    for (const [variable, unit] of Object.entries(expectedUnits)) {
      const values: unknown = data[section][variable as keyof typeof data[typeof section]];
      if (data[`${section}_units`]?.[variable] !== unit || !Array.isArray(values) ||
          values.length !== times.length || values.some(value => value !== null &&
            (typeof value !== 'number' || !Number.isFinite(value)))) {
        throw new Error(`Invalid trail weather ${section} values or units: ${variable}`);
      }
    }
  }
  if (!Number.isInteger(data.utc_offset_seconds) || data.daily.time.length !== FORECAST_DAYS ||
      data.hourly.time.length - currentHourIndex(data, true) < HOURLY_WINDOW) {
    throw new Error('Trail weather has an incomplete forecast window');
  }
}

function buildConditions(
  resort: Resort,
  baseData: OpenMeteoResponse,
  midData: OpenMeteoResponse,
  peakData: OpenMeteoResponse,
  providerFetchedAt: Date,
  requireCurrentHour = false,
): WeatherConditions {

  const baseDays = elevationDays(baseData);
  const midDays  = elevationDays(midData);
  const peakDays = elevationDays(peakData);

  const cloudCoverByDate = dailyAgg(
    peakData,
    'cloudcover',
    vals => Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
  );
  const freezingLevelByDate = dailyAgg(
    peakData,
    'freezinglevel_height',
    vals => roundFeet(vals.reduce((a, b) => a + b, 0) / vals.length),
  );

  const baseElevFt = Math.round(resort.base_elevation * 3.28084);
  const midElevFt  = Math.round(resort.mid_elevation  * 3.28084);
  const peakElevFt = Math.round(resort.peak_elevation * 3.28084);

  const forecast: DailyForecast[] = peakData.daily.time.map(date => ({
    date,
    cloud_cover_avg_pct:   cloudCoverByDate[date] ?? null,
    avg_freezing_level_ft: (freezingLevelByDate[date] as number | null) ?? null,
    base: { elevation_ft: baseElevFt, ...baseDays[date] },
    mid:  { elevation_ft: midElevFt,  ...midDays[date]  },
    peak: { elevation_ft: peakElevFt, ...peakDays[date] },
  }));

  const start  = currentHourIndex(peakData, requireCurrentHour);
  const peakH  = peakData.hourly;
  const times  = peakH.time;

  const next12Hours: HourlySnapshot[] = [];
  for (let i = 0; i < HOURLY_WINDOW; i++) {
    const idx = start + i;
    next12Hours.push({
      time:              times[idx],
      cloud_cover_pct:   peakH.cloudcover[idx],
      freezing_level_ft: roundFeet(peakH.freezinglevel_height[idx]),
      base: { elevation_ft: baseElevFt, ...hourlyElevationSnapshot(baseData, idx) },
      mid:  { elevation_ft: midElevFt,  ...hourlyElevationSnapshot(midData,  idx) },
      peak: { elevation_ft: peakElevFt, ...hourlyElevationSnapshot(peakData, idx) },
    });
  }

  return {
    resort:        resort.name,
    state:         resort.state,
    weather_metadata: createWeatherMetadata(providerFetchedAt),
    next_12_hours: next12Hours,
    forecast,
  };

}

// ── Metadata ──────────────────────────────────────────────────────────────────

export function getAllResortMetadata(): ResortMetadata[] {
  return RESORTS.map(getResortMetadata);
}

export function getResortMetadata(r: Resort): ResortMetadata {
  return {
    id:                r.id,
    name:              r.name,
    state:             r.state,
    latitude:          r.latitude,
    longitude:         r.longitude,
    base_elevation_ft: Math.round(r.base_elevation * 3.28084),
    mid_elevation_ft:  Math.round(r.mid_elevation  * 3.28084),
    peak_elevation_ft: Math.round(r.peak_elevation * 3.28084),
  };
}

// ── Background cache warming ──────────────────────────────────────────────────

/**
 * Pre-fetch every resort on startup. Fires in the background; never throws.
 * Uses a 2-second delay between requests to stay under Open-Meteo rate limits.
 */
export async function warmCache(): Promise<void> {
  for (const resort of RESORTS) {
    try {
      await fetchResortConditions(resort);
    } catch {
      // Failed resorts will be retried on first user click
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}
