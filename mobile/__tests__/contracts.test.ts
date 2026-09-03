import { resortConditionsSchema } from '@/api/contracts';

import { resortConditionsFixture } from './fixtures';

describe('forecast API contract', () => {
  it('accepts the current backend response', () => {
    const parsed = resortConditionsSchema.parse(resortConditionsFixture);

    expect(parsed.resort).toBe('Elk Mountain');
    expect(parsed.weather_metadata).toEqual({
      source: 'open-meteo',
      fetched_at: '2026-01-17T12:00:00.000Z',
      model_run_at: null,
    });
  });

  it('preserves unknown measurements as null', () => {
    const fixture = structuredClone(resortConditionsFixture);
    fixture.forecast[0].peak.snowfall_in = null;
    fixture.next_12_hours[0].peak.temperature_f = null;

    const parsed = resortConditionsSchema.parse(fixture);

    expect(parsed.forecast[0].peak.snowfall_in).toBeNull();
    expect(parsed.next_12_hours[0].peak.temperature_f).toBeNull();
  });

  it('rejects an unsafe response instead of guessing', () => {
    expect(() => resortConditionsSchema.parse({ resort: 'Elk Mountain' })).toThrow();
  });

  it('rejects invented or malformed weather freshness metadata', () => {
    const fixture = structuredClone(resortConditionsFixture);
    fixture.weather_metadata.fetched_at = 'recently';

    expect(() => resortConditionsSchema.parse(fixture)).toThrow();
  });
});
