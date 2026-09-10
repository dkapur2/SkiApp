import { FREEZE_THAW_RULES, type FreezeThawInput } from '../analysis/freezeThaw';

export const HOURLY_ADAPTER_VERSION = 'open-meteo-hourly/0.1.0' as const;
export const HOURLY_SNAPSHOT_VERSION = 'open-meteo-hourly-snapshot/0.1.0' as const;
export const HOUR_MS = 3_600_000;
export const MAX_SNAPSHOT_BYTES = 1_048_576;
const ENDPOINT = 'https://api.open-meteo.com/v1/forecast';

export interface HourlyRequest {
  latitude: number;
  longitude: number;
  elevationM: number;
  requestedAtMs: number;
}

/** Capture metadata belongs to the caller, never to hourly valid time or generationtime_ms. */
export interface HourlySnapshot {
  schemaVersion: typeof HOURLY_SNAPSHOT_VERSION;
  request: HourlyRequest;
  asOfMs: number;
  fetchedAtMs: number | null;
  modelRunAtMs: number | null;
  response: unknown;
}

export type HourlyIssueCode = 'invalid_snapshot' | 'invalid_clock' | 'invalid_request'
  | 'invalid_provenance' | 'invalid_response' | 'invalid_units' | 'invalid_timezone'
  | 'invalid_elevation' | 'invalid_arrays' | 'invalid_time' | 'duplicate_hour' | 'invalid_value';

export type HourlyNormalization = {
  adapterVersion: typeof HOURLY_ADAPTER_VERSION;
  status: 'normalized';
  input: FreezeThawInput;
  grid: { latitude: number; longitude: number; elevationM: number };
} | {
  adapterVersion: typeof HOURLY_ADAPTER_VERSION;
  status: 'rejected';
  issue: { code: HourlyIssueCode; message: string };
};

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function instant(value: unknown): value is number {
  return finite(value) && Number.isSafeInteger(value) && Math.abs(value) < 8.64e15 - 96 * HOUR_MS;
}

function validRequest(value: unknown): value is HourlyRequest {
  return record(value) && finite(value.latitude) && Math.abs(value.latitude) <= 90 &&
    finite(value.longitude) && Math.abs(value.longitude) <= 180 &&
    finite(value.elevationM) && value.elevationM >= -500 && value.elevationM <= 9000 &&
    instant(value.requestedAtMs);
}

/** Fixed free endpoint and units; no caller URL, credentials, local-time strings or phase correction. */
export function hourlyRequestUrl(request: HourlyRequest): string {
  if (!validRequest(request)) throw new Error('Invalid hourly request coordinates, elevation or UTC clock.');
  const anchor = Math.floor(request.requestedAtMs / HOUR_MS) * HOUR_MS;
  // One extra hour either side tolerates crossing an hour while the bounded request completes.
  const hour = (offset: number): string => new Date(anchor + offset * HOUR_MS).toISOString().slice(0, 16);
  const params = new URLSearchParams({
    latitude: String(request.latitude), longitude: String(request.longitude),
    elevation: String(request.elevationM), hourly: 'temperature_2m,rain,showers',
    temperature_unit: 'celsius', precipitation_unit: 'mm', timeformat: 'unixtime',
    timezone: 'GMT', start_hour: hour(-FREEZE_THAW_RULES.lookbackHours - 1),
    end_hour: hour(FREEZE_THAW_RULES.forecastHours + 1),
  });
  return `${ENDPOINT}?${params}`;
}

/** Validate raw JSON before constructing model input; never impute, round, interpolate or lapse-adjust. */
export function normalizeOpenMeteoHourly(snapshot: unknown): HourlyNormalization {
  const reject = (code: HourlyIssueCode, message: string): HourlyNormalization => ({
    adapterVersion: HOURLY_ADAPTER_VERSION, status: 'rejected', issue: { code, message },
  });
  if (!record(snapshot) || snapshot.schemaVersion !== HOURLY_SNAPSHOT_VERSION) {
    return reject('invalid_snapshot', 'A versioned hourly capture envelope is required.');
  }
  if (!instant(snapshot.asOfMs)) return reject('invalid_clock', 'An explicit UTC evaluation instant is required.');
  if (!validRequest(snapshot.request)) return reject('invalid_request', 'Explicit coordinates, target elevation and request time are required.');
  const request = snapshot.request;
  // Missing fetch provenance is passed as null to the model, which abstains. Do not manufacture it.
  const fetchedAtMs = snapshot.fetchedAtMs ?? null;
  const modelRunAtMs = snapshot.modelRunAtMs ?? null;
  if (request.requestedAtMs > snapshot.asOfMs ||
      (fetchedAtMs !== null && (!instant(fetchedAtMs) || fetchedAtMs < request.requestedAtMs || fetchedAtMs > snapshot.asOfMs)) ||
      (modelRunAtMs !== null && (!instant(modelRunAtMs) || fetchedAtMs === null || modelRunAtMs > fetchedAtMs))) {
    return reject('invalid_provenance', 'Require request ≤ successful fetch ≤ evaluation and supplied model run ≤ fetch.');
  }
  const raw = snapshot.response;
  if (!record(raw) || raw.error === true || !finite(raw.latitude) || Math.abs(raw.latitude) > 90 ||
      !finite(raw.longitude) || Math.abs(raw.longitude) > 180) {
    return reject('invalid_response', 'A single successful forecast object with grid coordinates is required.');
  }
  if (raw.utc_offset_seconds !== 0 || !['GMT', 'UTC', 'Etc/GMT', 'Etc/UTC'].includes(String(raw.timezone))) {
    return reject('invalid_timezone', 'Only the explicit GMT/UTC response contract is accepted.');
  }
  if (!finite(raw.elevation) || raw.elevation !== request.elevationM) {
    return reject('invalid_elevation', 'Response elevation must exactly match the explicitly requested target; no fallback.');
  }
  const units = raw.hourly_units;
  if (!record(units) || units.time !== 'unixtime' || units.temperature_2m !== '°C' ||
      units.rain !== 'mm' || units.showers !== 'mm') {
    return reject('invalid_units', 'Require Unix seconds, °C and mm for both liquid components.');
  }
  const hourly = raw.hourly;
  if (!record(hourly) || !Array.isArray(hourly.time) || hourly.time.length > 1000) {
    return reject('invalid_arrays', 'A bounded hourly time array is required.');
  }
  const times: unknown[] = hourly.time;
  const temperature = hourly.temperature_2m;
  const rain = hourly.rain;
  const showers = hourly.showers;
  if (!Array.isArray(temperature) || !Array.isArray(rain) || !Array.isArray(showers) ||
      [temperature, rain, showers].some(values => values.length !== times.length)) {
    return reject('invalid_arrays', 'Temperature, rain and showers must align one-to-one with the time array.');
  }
  const anchor = Math.floor(snapshot.asOfMs / HOUR_MS) * HOUR_MS;
  const start = anchor - FREEZE_THAW_RULES.lookbackHours * HOUR_MS;
  const end = anchor + FREEZE_THAW_RULES.forecastHours * HOUR_MS;
  const seen = new Set<number>();
  const hours: FreezeThawInput['hours'][number][] = [];
  for (let i = 0; i < times.length; i++) {
    const seconds = times[i];
    if (!finite(seconds) || !instant(seconds * 1000) || seconds % 3600 !== 0) {
      return reject('invalid_time', 'Time must be numeric Unix seconds at exact UTC hours.');
    }
    const validAtMs = seconds * 1000;
    if (seen.has(validAtMs)) return reject('duplicate_hour', 'Duplicate timestamps are ambiguous.');
    seen.add(validAtMs);
    if (validAtMs < start || validAtMs > end) continue;
    const t: unknown = temperature[i], r: unknown = rain[i], s: unknown = showers[i];
    if (t !== null && !finite(t)) return reject('invalid_value', 'Temperature must be a finite number or null.');
    // The first endpoint's preceding rain interval is outside the analysis window.
    let liquidPrecipitationMm: number | null = null;
    if (validAtMs > start) {
      if ((r !== null && (!finite(r) || r < 0)) || (s !== null && (!finite(s) || s < 0))) {
        return reject('invalid_value', 'Liquid components must be non-negative finite numbers or null.');
      }
      if (r !== null && s !== null) {
        liquidPrecipitationMm = (r as number) + (s as number);
        if (!Number.isFinite(liquidPrecipitationMm)) return reject('invalid_value', 'Liquid component sum overflowed.');
      }
    }
    hours.push({ validAtMs, temperatureC: t, liquidPrecipitationMm });
  }
  hours.sort((a, b) => a.validAtMs - b.validAtMs);
  return {
    adapterVersion: HOURLY_ADAPTER_VERSION, status: 'normalized',
    grid: { latitude: raw.latitude, longitude: raw.longitude, elevationM: raw.elevation },
    input: {
      asOfMs: snapshot.asOfMs,
      source: { provider: 'open-meteo', product: 'forecast', fetchedAtMs, modelRunAtMs },
      elevation: { targetM: request.elevationM, temperatureM: raw.elevation, liquidPrecipitationM: raw.elevation },
      hours,
    },
  };
}

export type HourlyFetchResult = { status: 'captured'; snapshot: HourlySnapshot }
  | { status: 'unavailable'; reason: string };

/** One opt-in request; no retries, cache, background work, redirects or provider error-body logging. */
export async function fetchOpenMeteoHourly(
  location: Omit<HourlyRequest, 'requestedAtMs'>,
  dependencies: { fetch: typeof fetch; now: () => number } = { fetch, now: Date.now },
): Promise<HourlyFetchResult> {
  try {
    const request = { ...location, requestedAtMs: dependencies.now() };
    const response = await dependencies.fetch(hourlyRequestUrl(request), {
      signal: AbortSignal.timeout(15_000), redirect: 'error',
    });
    if (!response.ok) {
      await response.body?.cancel();
      return { status: 'unavailable', reason: `Open-Meteo HTTP ${response.status}; no analysis was performed.` };
    }
    if (!response.body) return { status: 'unavailable', reason: 'Open-Meteo returned an empty body.' };
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        length += chunk.value.byteLength;
        if (length > MAX_SNAPSHOT_BYTES) {
          await reader.cancel();
          return { status: 'unavailable', reason: 'Open-Meteo response exceeded the 1 MiB capture limit.' };
        }
        chunks.push(chunk.value);
      }
    } finally { reader.releaseLock(); }
    const raw: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    const fetchedAtMs = dependencies.now();
    return { status: 'captured', snapshot: {
      schemaVersion: HOURLY_SNAPSHOT_VERSION, request, asOfMs: fetchedAtMs, fetchedAtMs,
      // The seamless forecast response does not reliably supply one initialization instant.
      modelRunAtMs: null, response: raw,
    } };
  } catch {
    return { status: 'unavailable', reason: 'Hourly request failed, timed out, or returned invalid JSON; no data were substituted.' };
  }
}
