import { evaluateHourlySnapshot } from '../../src/analysis/evaluateFreezeThaw';
import { HOURLY_SNAPSHOT_VERSION, HOUR_MS } from '../../src/services/openMeteoHourly';
import type { ReviewEntry } from './report';

export const EXAMPLES = ['Thaw / refreeze', 'Rain / freezing', 'Sustained cold', 'Insufficient data'] as const;

/** Invented inputs for UI demonstration; never observations or captured provider responses. */
export function example(index: number): ReviewEntry {
  if (!Number.isInteger(index) || index < 0 || index >= EXAMPLES.length) throw new Error('Unknown synthetic example.');
  const anchor = Date.parse('2026-03-08T06:00:00Z');
  const offsets = Array.from({ length: 75 }, (_, i) => i - 49);
  const report = evaluateHourlySnapshot({
    schemaVersion: HOURLY_SNAPSHOT_VERSION,
    request: { latitude: 43, longitude: -72, elevationM: 1000, requestedAtMs: anchor },
    asOfMs: anchor + 15 * 60_000, fetchedAtMs: index === 3 ? null : anchor + 5000, modelRunAtMs: null,
    response: {
      latitude: 43, longitude: -72, elevation: 1000, utc_offset_seconds: 0, timezone: 'GMT',
      hourly_units: { time: 'unixtime', temperature_2m: '°C', rain: 'mm', showers: 'mm' },
      hourly: {
        time: offsets.map(h => (anchor + h * HOUR_MS) / 1000),
        temperature_2m: offsets.map(h => index === 3 && h === 0 ? null : index === 2 && h >= -10 && h <= 4 ? -3 :
          index < 2 && h >= 1 && h <= 3 ? -2 : index === 0 && h >= -3 && h <= 0 ? 3 : 0),
        rain: offsets.map(h => index === 3 && h === 1 ? null : index === 1 && h === 0 ? 0.8 : 0),
        showers: offsets.map(() => 0),
      },
    },
  });
  return { id: `synthetic-${index}`, name: EXAMPLES[index], origin: 'synthetic', septemberPipeline: false, report };
}
