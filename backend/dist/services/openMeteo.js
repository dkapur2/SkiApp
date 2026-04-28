"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchResortConditions = fetchResortConditions;
exports.getAllResortMetadata = getAllResortMetadata;
exports.warmCache = warmCache;
const cache_1 = require("../cache");
const resorts_1 = require("../data/resorts");
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
const SNOW_WATER_RATIO = 10.0;
// Cache with 30-minute TTL
const conditionsCache = new cache_1.Cache(1800);
// ── Unit helpers ──────────────────────────────────────────────────────────────
function mToIn(v) {
    return v !== null ? Math.round(v * 39.3701 * 100) / 100 : null;
}
function mToMi(v) {
    return v !== null ? Math.round((v / 1609.34) * 10) / 10 : null;
}
function mToFt(v) {
    return v !== null ? Math.round(v * 3.28084) : null;
}
// ── Elevation adjustment ──────────────────────────────────────────────────────
/**
 * Return a shallow copy of `raw` with temperature arrays shifted for `targetElev`.
 * All non-temperature arrays are shared by reference to avoid copying megabytes.
 */
function atElevation(raw, modelElev, targetElev) {
    const offsetF = (modelElev - targetElev) * LAPSE_RATE_F_PER_M;
    if (Math.abs(offsetF) <= 0.01)
        return raw;
    const shift = (arr) => arr.map(v => (v !== null ? Math.round((v + offsetF) * 10) / 10 : null));
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
async function fetchOpenMeteo(lat, lon, dailyVars, hourlyVars) {
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
    let lastError = new Error('No attempts made');
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const res = await fetch(`${OPEN_METEO_URL}?${params}`, {
                signal: AbortSignal.timeout(30_000),
            });
            if (!res.ok) {
                throw new Error(`Open-Meteo HTTP ${res.status}: ${await res.text()}`);
            }
            return (await res.json());
        }
        catch (e) {
            lastError = e;
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
function dailyAgg(data, varName, fn) {
    const times = data.hourly.time;
    const values = data.hourly[varName] ?? [];
    const buckets = {};
    for (let i = 0; i < times.length; i++) {
        const v = values[i];
        if (v !== null && v !== undefined) {
            const date = times[i].slice(0, 10);
            (buckets[date] ??= []).push(v);
        }
    }
    const result = {};
    for (const [date, vals] of Object.entries(buckets)) {
        result[date] = fn(vals);
    }
    return result;
}
/**
 * Split total precipitation into (snowfall_in, rain_in) based on temperature.
 * Uses a linear blend across the 32–34 °F mixed-phase zone.
 * snowfall is returned as snow depth inches (precip × 10:1 ratio).
 */
function phaseCorrect(precip, tempF) {
    if (!precip || tempF === null)
        return [0.0, 0.0];
    const rainFrac = Math.max(0.0, Math.min(1.0, (tempF - 32.0) / 2.0));
    const snowFrac = 1.0 - rainFrac;
    return [
        Math.round(precip * snowFrac * SNOW_WATER_RATIO * 100) / 100,
        Math.round(precip * rainFrac * 1000) / 1000,
    ];
}
/** Build per-elevation daily rows for one elevation view of the data. */
function elevationDays(data) {
    const d = data.daily;
    const snowDepthMax = dailyAgg(data, 'snow_depth', vals => mToIn(Math.max(...vals)));
    const visibilityMin = dailyAgg(data, 'visibility', vals => mToMi(Math.min(...vals)));
    const result = {};
    for (let i = 0; i < d.time.length; i++) {
        const date = d.time[i];
        const hi = d.temperature_2m_max[i];
        const lo = d.temperature_2m_min[i];
        const meanTemp = hi !== null && lo !== null ? (hi + lo) / 2 : null;
        const [snowfall, rain] = phaseCorrect(d.precipitation_sum[i], meanTemp);
        result[date] = {
            high_f: hi,
            low_f: lo,
            apparent_high_f: d.apparent_temperature_max[i],
            apparent_low_f: d.apparent_temperature_min[i],
            max_windspeed_mph: d.windspeed_10m_max[i],
            max_windgusts_mph: d.windgusts_10m_max[i],
            snowfall_in: snowfall,
            rain_in: rain,
            precipitation_in: d.precipitation_sum[i],
            max_snow_depth_in: snowDepthMax[date] ?? null,
            min_visibility_mi: visibilityMin[date] ?? null,
        };
    }
    return result;
}
/** Extract one hour's worth of elevation-specific data. */
function hourlyElevationSnapshot(data, idx) {
    const h = data.hourly;
    const temp = h.temperature_2m[idx];
    const [snowfall, rain] = phaseCorrect(h.precipitation[idx], temp);
    return {
        temperature_f: temp,
        apparent_temperature_f: h.apparent_temperature[idx],
        windspeed_mph: h.windspeed_10m[idx],
        windgusts_mph: h.windgusts_10m[idx],
        snowfall_in: snowfall,
        rain_in: rain,
        precipitation_in: h.precipitation[idx],
        snow_depth_in: mToIn(h.snow_depth[idx]),
        visibility_mi: mToMi(h.visibility[idx]),
    };
}
/** Find the index of the current hour in the API's time array. */
function currentHourIndex(data) {
    const localNow = new Date(Date.now() + data.utc_offset_seconds * 1000);
    const year = localNow.getUTCFullYear();
    const month = String(localNow.getUTCMonth() + 1).padStart(2, '0');
    const day = String(localNow.getUTCDate()).padStart(2, '0');
    const hour = String(localNow.getUTCHours()).padStart(2, '0');
    const target = `${year}-${month}-${day}T${hour}:00`;
    const idx = data.hourly.time.indexOf(target);
    return idx >= 0 ? idx : 0;
}
// ── Main fetch ────────────────────────────────────────────────────────────────
/** Fetch weather conditions for one resort. Results are cached for 30 minutes. */
async function fetchResortConditions(resort) {
    const cached = conditionsCache.get(resort.id);
    if (cached !== null)
        return cached;
    const allHourly = [...ELEVATION_HOURLY_VARS, ...PEAK_EXTRA_HOURLY_VARS];
    const raw = await fetchOpenMeteo(resort.latitude, resort.longitude, ELEVATION_DAILY_VARS, allHourly);
    const modelElev = raw.elevation ?? resort.mid_elevation;
    const baseData = atElevation(raw, modelElev, resort.base_elevation);
    const midData = atElevation(raw, modelElev, resort.mid_elevation);
    const peakData = atElevation(raw, modelElev, resort.peak_elevation);
    const baseDays = elevationDays(baseData);
    const midDays = elevationDays(midData);
    const peakDays = elevationDays(peakData);
    const cloudCoverByDate = dailyAgg(peakData, 'cloudcover', vals => Math.round(vals.reduce((a, b) => a + b, 0) / vals.length));
    const freezingLevelByDate = dailyAgg(peakData, 'freezinglevel_height', vals => mToFt(vals.reduce((a, b) => a + b, 0) / vals.length));
    const baseElevFt = Math.round(resort.base_elevation * 3.28084);
    const midElevFt = Math.round(resort.mid_elevation * 3.28084);
    const peakElevFt = Math.round(resort.peak_elevation * 3.28084);
    const forecast = peakData.daily.time.map(date => ({
        date,
        cloud_cover_avg_pct: cloudCoverByDate[date] ?? 0,
        avg_freezing_level_ft: freezingLevelByDate[date] ?? null,
        base: { elevation_ft: baseElevFt, ...baseDays[date] },
        mid: { elevation_ft: midElevFt, ...midDays[date] },
        peak: { elevation_ft: peakElevFt, ...peakDays[date] },
    }));
    const start = currentHourIndex(peakData);
    const peakH = peakData.hourly;
    const times = peakH.time;
    const next12Hours = [];
    for (let i = 0; i < HOURLY_WINDOW; i++) {
        const idx = start + i;
        next12Hours.push({
            time: times[idx],
            cloud_cover_pct: peakH.cloudcover[idx],
            freezing_level_ft: mToFt(peakH.freezinglevel_height[idx]),
            base: { elevation_ft: baseElevFt, ...hourlyElevationSnapshot(baseData, idx) },
            mid: { elevation_ft: midElevFt, ...hourlyElevationSnapshot(midData, idx) },
            peak: { elevation_ft: peakElevFt, ...hourlyElevationSnapshot(peakData, idx) },
        });
    }
    const result = {
        resort: resort.name,
        state: resort.state,
        next_12_hours: next12Hours,
        forecast,
    };
    conditionsCache.set(resort.id, result);
    return result;
}
// ── Metadata ──────────────────────────────────────────────────────────────────
function getAllResortMetadata() {
    return resorts_1.RESORTS.map(r => ({
        id: r.id,
        name: r.name,
        state: r.state,
        latitude: r.latitude,
        longitude: r.longitude,
        base_elevation_ft: Math.round(r.base_elevation * 3.28084),
        mid_elevation_ft: Math.round(r.mid_elevation * 3.28084),
        peak_elevation_ft: Math.round(r.peak_elevation * 3.28084),
    }));
}
// ── Background cache warming ──────────────────────────────────────────────────
/**
 * Pre-fetch every resort on startup. Fires in the background; never throws.
 * Uses a 2-second delay between requests to stay under Open-Meteo rate limits.
 */
async function warmCache() {
    for (const resort of resorts_1.RESORTS) {
        try {
            await fetchResortConditions(resort);
        }
        catch {
            // Failed resorts will be retried on first user click
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}
