import { HOURLY_SNAPSHOT_VERSION, type HourlySnapshot } from '../../src/services/openMeteoHourly';
import { ANCHOR_MS, HOUR_MS } from './freezeThaw';

/** Synthetic provider-shaped values. Not captured forecasts or resort/surface observations. */
export function hourlyFixture(
  values: (offset: number) => { temperature?: number | null; rain?: number | null; showers?: number | null } = () => ({}),
) {
  const offsets = Array.from({ length: 75 }, (_, i) => i - 49);
  const cell = (value: number | null | undefined): number | null => value === undefined ? 0 : value;
  return {
    schemaVersion: HOURLY_SNAPSHOT_VERSION,
    request: { latitude: 43.6045, longitude: -72.8201, elevationM: 1000, requestedAtMs: ANCHOR_MS + 5000 },
    asOfMs: ANCHOR_MS + 15 * 60_000,
    fetchedAtMs: ANCHOR_MS + 10_000,
    modelRunAtMs: null as number | null,
    response: {
      latitude: 43.60, longitude: -72.82, elevation: 1000, utc_offset_seconds: 0, timezone: 'GMT',
      generationtime_ms: 12.34,
      hourly_units: { time: 'unixtime', temperature_2m: '°C', rain: 'mm', showers: 'mm' },
      hourly: {
        time: offsets.map(offset => (ANCHOR_MS + offset * HOUR_MS) / 1000),
        temperature_2m: offsets.map(offset => cell(values(offset).temperature)),
        rain: offsets.map(offset => cell(values(offset).rain)),
        showers: offsets.map(offset => cell(values(offset).showers)),
      },
    },
  } satisfies HourlySnapshot;
}

export const providerThawRefreeze = () => hourlyFixture(offset => ({
  temperature: offset === -1 || offset === 0 ? 2 : offset === 1 || offset === 2 ? -2 : 0,
  rain: offset === 0 ? 0.2 : 0,
  showers: offset === 0 ? 0.3 : 0,
}));
