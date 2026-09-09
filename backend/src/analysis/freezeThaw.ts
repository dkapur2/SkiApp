/** Pure, experimental pattern detection. Not a snowpack or trail-condition model. */
export const FREEZE_THAW_VERSION = 'freeze-thaw/0.1.0' as const;
const HOUR_MS = 3_600_000;
export const FREEZE_THAW_RULES = Object.freeze({
  lookbackHours: 48,
  forecastHours: 24,
  thawC: 1,
  freezeC: -1,
  minimumSequenceSamples: 2,
  liquidPrecipitationMm: 0.5,
  maximumTransitionGapHours: 24,
  sustainedColdSamples: 12,
  maximumFetchAgeMs: 30 * 60_000,
});

export interface FreezeThawHour {
  /** UTC epoch milliseconds, on an exact hour; temperature is instantaneous. */
  readonly validAtMs: number;
  readonly temperatureC: number | null;
  /** Provider-model rain + showers over (validAtMs - 1 hour, validAtMs]. */
  readonly liquidPrecipitationMm: number | null;
}

export interface FreezeThawInput {
  /** Injected evaluation clock. Never inferred from sample dates or Date.now(). */
  readonly asOfMs: number;
  readonly source: {
    readonly provider: 'open-meteo';
    readonly product: 'forecast';
    readonly fetchedAtMs: number | null;
    readonly modelRunAtMs: number | null;
  } | null;
  /** All values must already describe the same elevation. No lapse/phase correction here. */
  readonly elevation: {
    readonly targetM: number | null;
    readonly temperatureM: number | null;
    readonly liquidPrecipitationM: number | null;
  };
  readonly hours: readonly FreezeThawHour[];
}

export type FreezeThawReasonCode =
  | 'invalid_clock' | 'missing_provenance' | 'invalid_model_run'
  | 'stale_input' | 'invalid_elevation' | 'invalid_time' | 'duplicate_hour'
  | 'missing_hour' | 'missing_temperature' | 'missing_precipitation'
  | 'no_pattern';

export interface FreezeThawReason {
  code: FreezeThawReasonCode;
  message: string;
  atMs?: number;
}

export interface FreezeThawSignal {
  kind: 'thaw_then_freezing' | 'rain_then_freezing' | 'sustained_cold';
  /** A completed lookback pattern is not a claim about the current surface. */
  period: 'lookback_model' | 'includes_forecast';
  evidence: { startMs: number; endMs: number }[];
  reason: string;
}

export interface FreezeThawResult {
  modelVersion: typeof FREEZE_THAW_VERSION;
  status: 'analyzed' | 'insufficient_data';
  interpretation: 'experimental_weather_derived_surface_risk';
  window: { startMs: number; anchorMs: number; endMs: number } | null;
  provenance: FreezeThawInput['source'];
  elevation: FreezeThawInput['elevation'];
  signals: FreezeThawSignal[];
  reasons: FreezeThawReason[];
  limitations: readonly string[];
}

const LIMITATIONS = Object.freeze([
  'All inputs are weather-model estimates, including lookback hours; no surface observations are used.',
  'Signals are conditional on a susceptible wet or snow-covered surface, whose presence is unknown.',
  'Air temperature does not establish snow temperature, melt, ice, grip, or current trail conditions.',
  'Grooming, snowmaking, operations, radiation, aspect, snowpack and traffic effects are not modeled.',
  'No detected pattern does not mean safe, soft, ice-free, open, or suitable for skiing.',
]);

function instant(value: number | null): value is number {
  // Leave room for window arithmetic within the JavaScript Date range.
  return value !== null && Number.isSafeInteger(value) && Math.abs(value) < 8.64e15 - 72 * HOUR_MS;
}

function finite(value: number | null): value is number {
  return value !== null && Number.isFinite(value);
}

/**
 * Requires 73 temperature endpoints spanning [T-48h, T+24h], T=floor(asOf, hour).
 * Rain is required at the 72 interval ends after T-48h. Extra hours are ignored.
 * Missing/invalid required data suppresses ALL signals; no filling or interpolation.
 */
export function analyzeFreezeThaw(input: FreezeThawInput): FreezeThawResult {
  const result: FreezeThawResult = {
    modelVersion: FREEZE_THAW_VERSION,
    status: 'insufficient_data',
    interpretation: 'experimental_weather_derived_surface_risk',
    window: null,
    provenance: input.source ? { ...input.source } : null,
    elevation: { ...input.elevation },
    signals: [],
    reasons: [],
    limitations: LIMITATIONS,
  };
  const issue = (code: FreezeThawReasonCode, message: string, atMs?: number): void => {
    result.reasons.push({ code, message, ...(atMs === undefined ? {} : { atMs }) });
  };
  if (!instant(input.asOfMs)) {
    issue('invalid_clock', 'An explicit valid UTC evaluation instant is required.');
    return result;
  }
  const anchorMs = Math.floor(input.asOfMs / HOUR_MS) * HOUR_MS;
  const startMs = anchorMs - FREEZE_THAW_RULES.lookbackHours * HOUR_MS;
  const endMs = anchorMs + FREEZE_THAW_RULES.forecastHours * HOUR_MS;
  result.window = { startMs, anchorMs, endMs };
  const source = input.source;
  if (!source || source.provider !== 'open-meteo' || source.product !== 'forecast' ||
      !instant(source.fetchedAtMs) || source.fetchedAtMs > input.asOfMs) {
    issue('missing_provenance', 'A successful Open-Meteo forecast fetch time, no later than evaluation, is required.');
  } else {
    if (input.asOfMs - source.fetchedAtMs > FREEZE_THAW_RULES.maximumFetchAgeMs) {
      issue('stale_input', 'Provider fetch is older than the experimental 30-minute freshness limit.');
    }
    if (source.modelRunAtMs !== null &&
        (!instant(source.modelRunAtMs) || source.modelRunAtMs > source.fetchedAtMs)) {
      issue('invalid_model_run', 'A supplied model-run instant must be valid and no later than fetch time.');
    }
  }
  const elevation = input.elevation;
  if (!finite(elevation.targetM) || !finite(elevation.temperatureM) ||
      !finite(elevation.liquidPrecipitationM) || elevation.targetM !== elevation.temperatureM ||
      elevation.targetM !== elevation.liquidPrecipitationM) {
    issue('invalid_elevation', 'Temperature and liquid precipitation must explicitly refer to the target elevation.');
  }

  const byTime = new Map<number, FreezeThawHour>();
  for (const hour of input.hours) {
    if (!instant(hour.validAtMs) || hour.validAtMs % HOUR_MS !== 0) {
      issue('invalid_time', 'Hourly valid times must be UTC epoch milliseconds on exact hours.');
      continue;
    }
    if (hour.validAtMs < startMs || hour.validAtMs > endMs) continue;
    if (byTime.has(hour.validAtMs)) issue('duplicate_hour', 'Duplicate required hour is ambiguous.', hour.validAtMs);
    byTime.set(hour.validAtMs, hour);
  }
  const hours: FreezeThawHour[] = [];
  for (let atMs = startMs; atMs <= endMs; atMs += HOUR_MS) {
    const hour = byTime.get(atMs);
    if (!hour) {
      issue('missing_hour', 'Required hourly endpoint is absent; sequences cannot bridge gaps.', atMs);
      continue;
    }
    if (!finite(hour.temperatureC)) issue('missing_temperature', 'Temperature is unavailable or non-finite.', atMs);
    if (atMs > startMs && (!finite(hour.liquidPrecipitationMm) || hour.liquidPrecipitationMm < 0)) {
      issue('missing_precipitation', 'Liquid precipitation is unavailable, non-finite or negative.', atMs);
    }
    hours.push(hour);
  }
  if (result.reasons.length) return result;

  type Run = { start: number; end: number };
  const runs = (matches: (temperature: number) => boolean): Run[] => {
    const found: Run[] = [];
    for (let i = 0; i < hours.length; i++) {
      if (!matches(hours[i].temperatureC!)) continue;
      const start = i;
      while (i + 1 < hours.length && matches(hours[i + 1].temperatureC!)) i++;
      found.push({ start, end: i });
    }
    return found;
  };
  const warmRuns = runs(t => t >= FREEZE_THAW_RULES.thawC)
    .filter(run => run.end - run.start + 1 >= FREEZE_THAW_RULES.minimumSequenceSamples);
  const coldRuns = runs(t => t <= FREEZE_THAW_RULES.freezeC)
    .filter(run => run.end - run.start + 1 >= FREEZE_THAW_RULES.minimumSequenceSamples);
  const evidence = (run: Run): { startMs: number; endMs: number } => ({
    startMs: hours[run.start].validAtMs, endMs: hours[run.end].validAtMs,
  });
  const addSignal = (kind: FreezeThawSignal['kind'], spans: Run[], reason: string): void => {
    const ranges = spans.map(evidence);
    result.signals.push({ kind, evidence: ranges, reason,
      period: ranges.some(range => range.endMs > anchorMs) ? 'includes_forecast' : 'lookback_model' });
  };
  for (const cold of coldRuns) {
    const onset = { start: cold.start, end: cold.start + 1 };
    const warm = warmRuns.filter(run => run.end < cold.start &&
      cold.start - run.end <= FREEZE_THAW_RULES.maximumTransitionGapHours).at(-1);
    if (warm) addSignal('thaw_then_freezing', [warm, onset],
      'At least two hourly air-temperature samples at/above +1°C precede two at/below -1°C within 24 hours. Refreezing is possible if a susceptible surface exists; thaw or ice is not observed.');

    // The first endpoint's preceding precipitation interval is outside the window.
    let rainIndex: number | undefined;
    for (let i = Math.max(1, cold.start - FREEZE_THAW_RULES.maximumTransitionGapHours); i < cold.start; i++) {
      if (hours[i].liquidPrecipitationMm! >= FREEZE_THAW_RULES.liquidPrecipitationMm) rainIndex = i;
    }
    if (rainIndex !== undefined) {
      // Rain belongs to the preceding interval; do not shift it into a future hour.
      addSignal('rain_then_freezing', [{ start: rainIndex - 1, end: rainIndex }, onset],
        'A modeled liquid-precipitation hour of at least 0.5 mm precedes two air-temperature samples at/below -1°C within 24 hours. Residual water could freeze; wetness and ice are not observed.');
    }
    if (cold.end - cold.start + 1 >= FREEZE_THAW_RULES.sustainedColdSamples) {
      addSignal('sustained_cold', [cold],
        'At least 12 consecutive hourly air-temperature samples are at/below -1°C. This is cold-weather context, not evidence of fresh snow, grip, or absence of existing ice.');
    }
  }
  result.status = 'analyzed';
  if (!result.signals.length) issue('no_pattern', 'No configured weather pattern was detected in the complete window; surface conditions remain unknown.');
  return result;
}
