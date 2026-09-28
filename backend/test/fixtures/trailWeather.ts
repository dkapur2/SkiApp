import type { OpenMeteoResponse } from '../../src/types';

/** Synthetic provider response, with the requested point elevation and explicit units. */
export function trailWeatherFixture(elevation: number): OpenMeteoResponse {
  const start = Math.floor(Date.now() / 3_600_000) * 3_600_000;
  const hours = Array.from({ length: 24 }, (_, i) => new Date(start + i * 3_600_000).toISOString().slice(0, 16));
  const days = Array.from({ length: 16 }, (_, i) => new Date(start + i * 86_400_000).toISOString().slice(0, 10));
  const hourly = (first: number | null, rest = 0) => hours.map((_, i) => i === 0 ? first : rest);
  const daily = (first: number | null, rest = 0) => days.map((_, i) => i === 0 ? first : rest);
  return {
    elevation, utc_offset_seconds: 0,
    hourly_units: {
      time: 'iso8601', temperature_2m: '°F', apparent_temperature: '°F',
      windspeed_10m: 'mp/h', windgusts_10m: 'mp/h', snowfall: 'inch', rain: 'inch',
      precipitation: 'inch', snow_depth: 'ft', visibility: 'ft', cloudcover: '%', freezinglevel_height: 'ft',
    },
    daily_units: {
      time: 'iso8601', temperature_2m_max: '°F', temperature_2m_min: '°F',
      apparent_temperature_max: '°F', apparent_temperature_min: '°F',
      windspeed_10m_max: 'mp/h', windgusts_10m_max: 'mp/h', snowfall_sum: 'inch', rain_sum: 'inch', precipitation_sum: 'inch',
    },
    hourly: {
      time: hours, temperature_2m: hourly(null), apparent_temperature: hourly(null),
      windspeed_10m: hourly(null), windgusts_10m: hourly(null), snowfall: hourly(null),
      rain: hourly(null), precipitation: hourly(null), snow_depth: hourly(null),
      visibility: hourly(null), cloudcover: hourly(null), freezinglevel_height: hourly(null),
    },
    daily: {
      time: days, temperature_2m_max: daily(null), temperature_2m_min: daily(null),
      apparent_temperature_max: daily(null), apparent_temperature_min: daily(null),
      windspeed_10m_max: daily(null), windgusts_10m_max: daily(null), snowfall_sum: daily(null),
      rain_sum: daily(null), precipitation_sum: daily(null),
    },
  };
}
