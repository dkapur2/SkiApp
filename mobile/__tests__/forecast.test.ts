import {
  formatAge,
  formatMeasurement,
  hasEnoughForecastData,
  isClientDataStale,
  weatherIsPartial,
} from '@/utils/forecast';

import { resortConditionsFixture } from './fixtures';

describe('forecast presentation rules', () => {
  it('never formats an unknown measurement as zero', () => {
    expect(formatMeasurement(null, ' in')).toBe('Unavailable');
    expect(formatMeasurement(0, ' in')).toBe('0 in');
    expect(formatMeasurement(14_479, ' ft')).toBe('14,479 ft');
  });

  it('marks a forecast stale after thirty minutes', () => {
    const now = Date.UTC(2026, 0, 17, 12, 31);
    expect(isClientDataStale(now - 31 * 60_000, now)).toBe(true);
    expect(isClientDataStale(now - 29 * 60_000, now)).toBe(false);
    expect(formatAge(now - 31 * 60_000, now)).toBe('31 min ago');
  });

  it('distinguishes partial from insufficient data', () => {
    const partial = structuredClone(resortConditionsFixture);
    partial.forecast[0].mid.min_visibility_mi = null;
    expect(weatherIsPartial(partial, 'mid')).toBe(true);
    expect(hasEnoughForecastData(partial, 'mid')).toBe(true);

    const insufficient = structuredClone(resortConditionsFixture);
    insufficient.forecast = [];
    insufficient.next_12_hours = [];
    expect(hasEnoughForecastData(insufficient, 'mid')).toBe(false);
  });
});
