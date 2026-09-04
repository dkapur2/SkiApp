import type { WeatherMetadata } from '../types';

const SNOW_WATER_RATIO = 10;

/**
 * Split liquid-equivalent precipitation into derived snow depth and rain.
 * Missing precipitation or temperature stays unknown; a measured zero remains zero.
 */
export function splitPrecipitationByPhase(
  precipitationIn: number | null,
  temperatureF: number | null,
): [number | null, number | null] {
  if (precipitationIn === null) return [null, null];
  if (precipitationIn === 0) return [0, 0];
  if (temperatureF === null) return [null, null];

  const rainFraction = Math.max(0, Math.min(1, (temperatureF - 32) / 2));
  const snowFraction = 1 - rainFraction;
  return [
    Math.round(precipitationIn * snowFraction * SNOW_WATER_RATIO * 100) / 100,
    Math.round(precipitationIn * rainFraction * 1000) / 1000,
  ];
}

export function createWeatherMetadata(
  fetchedAt = new Date(),
  modelRunAt: string | null = null,
): WeatherMetadata {
  return {
    source: 'open-meteo',
    fetched_at: fetchedAt.toISOString(),
    model_run_at: modelRunAt,
  };
}
