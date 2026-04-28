// ── Internal resort definition ────────────────────────────────────────────────

export interface Resort {
  id: string;
  name: string;
  state: string;
  latitude: number;
  longitude: number;
  base_elevation: number; // meters
  mid_elevation: number;  // meters
  peak_elevation: number; // meters
}

// ── Public API response types ─────────────────────────────────────────────────

export interface ResortMetadata {
  id: string;
  name: string;
  state: string;
  latitude: number;
  longitude: number;
  base_elevation_ft: number;
  mid_elevation_ft: number;
  peak_elevation_ft: number;
}

export interface HourlyElevationData {
  elevation_ft: number;
  temperature_f: number | null;
  apparent_temperature_f: number | null;
  windspeed_mph: number | null;
  windgusts_mph: number | null;
  snowfall_in: number;
  rain_in: number;
  precipitation_in: number | null;
  snow_depth_in: number | null;
  visibility_mi: number | null;
}

export interface HourlySnapshot {
  time: string;
  cloud_cover_pct: number | null;
  freezing_level_ft: number | null;
  base: HourlyElevationData;
  mid: HourlyElevationData;
  peak: HourlyElevationData;
}

export interface DailyElevationData {
  elevation_ft: number;
  high_f: number | null;
  low_f: number | null;
  apparent_high_f: number | null;
  apparent_low_f: number | null;
  max_windspeed_mph: number | null;
  max_windgusts_mph: number | null;
  snowfall_in: number;
  rain_in: number;
  precipitation_in: number | null;
  max_snow_depth_in: number | null;
  min_visibility_mi: number | null;
}

export interface DailyForecast {
  date: string;
  cloud_cover_avg_pct: number;
  avg_freezing_level_ft: number | null;
  base: DailyElevationData;
  mid: DailyElevationData;
  peak: DailyElevationData;
}

// ── Ski API types (RapidAPI free tier) ────────────────────────────────────────

/** Normalized snow conditions from the Ski API */
export interface SkiSnowConditions {
  snow_depth_base_in: number | null;
  snow_depth_summit_in: number | null;
  new_snow_24h_in: number | null;
  new_snow_48h_in: number | null;
  season_total_in: number | null;
  /** Human-readable condition label, e.g. "Powder", "Packed Powder", "Groomed" */
  conditions: string | null;
}

/** Normalized lift and run counts from the Ski API */
export interface SkiLiftStatus {
  lifts_open: number | null;
  lifts_total: number | null;
  runs_open: number | null;
  runs_total: number | null;
  /** "Open", "Closed", "Scheduled to Open", etc. */
  resort_status: string | null;
}

/** A single tweet from the resort's Twitter/X feed */
export interface SkiTweet {
  text: string;
  created_at: string; // ISO timestamp or relative string from API
  url: string | null;
}

/** All data returned by the Ski API for one resort */
export interface SkiApiData {
  snow: SkiSnowConditions | null;
  lifts: SkiLiftStatus | null;
  tweets: SkiTweet[];
  fetched_at: string; // ISO timestamp
  source: 'ski-api';
}

// ── Full conditions response ───────────────────────────────────────────────────

/**
 * Weather-only conditions fetched from Open-Meteo.
 * Returned by the openMeteo service; enriched by the route handler.
 */
export interface WeatherConditions {
  resort: string;
  state: string;
  next_12_hours: HourlySnapshot[];
  forecast: DailyForecast[];
}

/** Full response shape returned to clients at GET /resorts/:id/conditions */
export interface ResortConditionsResponse extends WeatherConditions {
  ski_conditions: SkiApiData | null;
}

// ── AI recommendation ──────────────────────────────────────────────────────────

export interface RecommendRequest {
  resort_name: string;
  /** Optional: pass to let the backend enrich the prompt with Ski API data */
  resort_id?: string | null;
  snow_depth_in?: number | null;
  temperature_f?: number | null;
  wind_speed_mph?: number | null;
  crowd_level?: string | null;
}

// ── Open-Meteo raw response (typed subset we actually use) ────────────────────

export interface OpenMeteoResponse {
  elevation: number;
  utc_offset_seconds: number;
  hourly: {
    time: string[];
    temperature_2m: (number | null)[];
    apparent_temperature: (number | null)[];
    windspeed_10m: (number | null)[];
    windgusts_10m: (number | null)[];
    snowfall: (number | null)[];
    rain: (number | null)[];
    precipitation: (number | null)[];
    snow_depth: (number | null)[];
    visibility: (number | null)[];
    cloudcover: (number | null)[];
    freezinglevel_height: (number | null)[];
    [key: string]: unknown; // allow accessing by string key
  };
  daily: {
    time: string[];
    temperature_2m_max: (number | null)[];
    temperature_2m_min: (number | null)[];
    apparent_temperature_max: (number | null)[];
    apparent_temperature_min: (number | null)[];
    windspeed_10m_max: (number | null)[];
    windgusts_10m_max: (number | null)[];
    snowfall_sum: (number | null)[];
    rain_sum: (number | null)[];
    precipitation_sum: (number | null)[];
  };
}
