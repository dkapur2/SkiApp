import { resortConditionsSchema } from '@/api/contracts';

import { resortConditionsFixture } from './fixtures';

describe('forecast API contract', () => {
  it('accepts the current backend response', () => {
    expect(resortConditionsSchema.parse(resortConditionsFixture).resort).toBe('Elk Mountain');
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
});
