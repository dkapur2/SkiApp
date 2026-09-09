import type { FreezeThawHour, FreezeThawInput } from '../../src/analysis/freezeThaw';

/** Synthetic scenarios, not captured forecasts or verified resort observations. */
export const HOUR_MS = 3_600_000;
export const ANCHOR_MS = Date.parse('2026-03-08T06:00:00Z');

export function scenario(
  values: (offset: number) => Partial<Omit<FreezeThawHour, 'validAtMs'>> = () => ({}),
): FreezeThawInput {
  return {
    asOfMs: ANCHOR_MS + 15 * 60_000,
    source: { provider: 'open-meteo', product: 'forecast', fetchedAtMs: ANCHOR_MS, modelRunAtMs: null },
    elevation: { targetM: 1000, temperatureM: 1000, liquidPrecipitationM: 1000 },
    hours: Array.from({ length: 73 }, (_, i) => ({
      validAtMs: ANCHOR_MS + (i - 48) * HOUR_MS,
      temperatureC: 0,
      liquidPrecipitationMm: 0,
      ...values(i - 48),
    })),
  };
}

export const thawRefreeze = (): FreezeThawInput => scenario(offset => ({
  temperatureC: offset === -1 || offset === 0 ? 2 : offset === 1 || offset === 2 ? -2 : 0,
}));

export const rainThenFreeze = (): FreezeThawInput => scenario(offset => ({
  temperatureC: offset === 1 || offset === 2 ? -2 : 0,
  liquidPrecipitationMm: offset === 0 ? 0.5 : 0,
}));
