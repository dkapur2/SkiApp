import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { analyzeFreezeThaw, FREEZE_THAW_VERSION } from '../src/analysis/freezeThaw';
import type { FreezeThawInput, FreezeThawReasonCode } from '../src/analysis/freezeThaw';
import { ANCHOR_MS, HOUR_MS, scenario, thawRefreeze, rainThenFreeze } from './fixtures/freezeThaw';

function insufficient(input: FreezeThawInput, code: FreezeThawReasonCode): void {
  const result = analyzeFreezeThaw(input);
  assert.equal(result.status, 'insufficient_data');
  assert.deepEqual(result.signals, []);
  assert.ok(result.reasons.some(reason => reason.code === code), JSON.stringify(result.reasons));
}

describe('experimental freeze–thaw scenarios', () => {
  it('explains a thaw/refreeze spanning lookback and forecast without claiming observed ice', () => {
    const result = analyzeFreezeThaw(thawRefreeze());
    assert.equal(result.status, 'analyzed');
    assert.equal(result.modelVersion, FREEZE_THAW_VERSION);
    assert.equal(result.interpretation, 'experimental_weather_derived_surface_risk');
    assert.deepEqual(result.signals.map(s => s.kind), ['thaw_then_freezing']);
    assert.equal(result.signals[0].period, 'includes_forecast');
    assert.deepEqual(result.signals[0].evidence, [
      { startMs: ANCHOR_MS - HOUR_MS, endMs: ANCHOR_MS },
      { startMs: ANCHOR_MS + HOUR_MS, endMs: ANCHOR_MS + 2 * HOUR_MS },
    ]);
    assert.match(result.signals[0].reason, /not observed/);
    assert.equal(result.provenance?.modelRunAtMs, null);
    assert.ok(!('score' in result));
  });

  it('keeps completed historical sequences labeled as model estimates', () => {
    const result = analyzeFreezeThaw(scenario(i => ({ temperatureC: i === -6 || i === -5 ? 2 : i === -3 || i === -2 ? -2 : 0 })));
    assert.deepEqual(result.signals.map(s => s.period), ['lookback_model']);
    assert.match(result.limitations[0], /including lookback hours/);
  });

  it('detects rain before freezing and uses the preceding-hour accumulation interval', () => {
    const result = analyzeFreezeThaw(rainThenFreeze());
    assert.deepEqual(result.signals.map(s => s.kind), ['rain_then_freezing']);
    assert.deepEqual(result.signals[0].evidence[0], { startMs: ANCHOR_MS - HOUR_MS, endMs: ANCHOR_MS });
    assert.match(result.signals[0].reason, /wetness and ice are not observed/);
  });

  it('requires the rain interval to end strictly before the first cold sample', () => {
    for (const rainAt of [1, 2, 3]) {
      const result = analyzeFreezeThaw(scenario(i => ({
        temperatureC: i === 1 || i === 2 ? -2 : 0,
        liquidPrecipitationMm: i === rainAt ? 2 : 0,
      })));
      assert.deepEqual(result.signals, []);
    }
  });

  it('reports sustained cold as context without inventing a preceding thaw', () => {
    const result = analyzeFreezeThaw(scenario(() => ({ temperatureC: -8 })));
    assert.deepEqual(result.signals.map(s => s.kind), ['sustained_cold']);
    assert.match(result.signals[0].reason, /not evidence of fresh snow/);
    assert.match(result.limitations.join(' '), /Grooming, snowmaking, operations/);
  });

  it('requires 12 cold samples for sustained-cold context', () => {
    for (const samples of [11, 12]) {
      const result = analyzeFreezeThaw(scenario(i => ({ temperatureC: i >= 1 && i <= samples ? -1 : 0 })));
      assert.equal(result.signals.some(s => s.kind === 'sustained_cold'), samples === 12);
    }
  });

  it('does not equate freezing-point zero or zero precipitation with missing data', () => {
    const result = analyzeFreezeThaw(scenario());
    assert.equal(result.status, 'analyzed');
    assert.deepEqual(result.signals, []);
    assert.equal(result.reasons[0].code, 'no_pattern');
    assert.match(result.reasons[0].message, /surface conditions remain unknown/);
  });

  it('requires consecutive warm and cold samples and uses inclusive threshold boundaries', () => {
    for (const [warm, cold, expected] of [[1, -1, true], [0.999, -1, false], [1, -0.999, false]] as const) {
      const result = analyzeFreezeThaw(scenario(i => ({ temperatureC: i === -1 || i === 0 ? warm : i === 1 || i === 2 ? cold : 0 })));
      assert.equal(result.signals.some(s => s.kind === 'thaw_then_freezing'), expected);
    }
    for (const gapAt of [-1, 1]) {
      const input = thawRefreeze();
      assert.deepEqual(analyzeFreezeThaw({ ...input, hours: input.hours.map(h =>
        h.validAtMs === ANCHOR_MS + gapAt * HOUR_MS ? { ...h, temperatureC: 0 } : h) }).signals, []);
    }
  });

  it('expires thaw and rain evidence beyond 24 hours and excludes subthreshold drizzle', () => {
    for (const gap of [24, 25]) {
      const result = analyzeFreezeThaw(scenario(i => ({
        temperatureC: i === 1 - gap || i === -gap ? 2 : i === 1 || i === 2 ? -2 : 0,
        liquidPrecipitationMm: i === 1 - gap ? 0.5 : 0,
      })));
      assert.equal(result.signals.length, gap === 24 ? 2 : 0);
    }
    const input = rainThenFreeze();
    assert.deepEqual(analyzeFreezeThaw({ ...input, hours: input.hours.map(h => ({ ...h,
      liquidPrecipitationMm: h.liquidPrecipitationMm === 0.5 ? 0.499 : 0 })) }).signals, []);
  });

  it('records multiple cycles without repeatedly flagging a continuous freeze', () => {
    const result = analyzeFreezeThaw(scenario(i => ({
      temperatureC: [-6, -5, 3, 4].includes(i) ? 2 : [-4, -3, -2, 5, 6, 7].includes(i) ? -2 : 0,
    })));
    assert.deepEqual(result.signals.map(s => s.kind), ['thaw_then_freezing', 'thaw_then_freezing']);
  });
});

describe('freeze–thaw data, clock and elevation boundaries', () => {
  it('fails closed for gaps anywhere in the required lookback or forecast', () => {
    for (const missingOffset of [-48, -12, 0, 1, 24]) {
      const input = thawRefreeze();
      insufficient({ ...input, hours: input.hours.filter(h => h.validAtMs !== ANCHOR_MS + missingOffset * HOUR_MS) }, 'missing_hour');
    }
  });

  it('does not turn missing, NaN or infinite temperature/precipitation into zero', () => {
    for (const missing of [null, NaN, Infinity]) {
      insufficient(scenario(i => i === 1 ? { temperatureC: missing } : {}), 'missing_temperature');
      insufficient(scenario(i => i === 1 ? { liquidPrecipitationMm: missing } : {}), 'missing_precipitation');
    }
    insufficient(scenario(i => i === 1 ? { liquidPrecipitationMm: -0.1 } : {}), 'missing_precipitation');
  });

  it('ignores only the first preceding-hour rain interval outside the window', () => {
    const result = analyzeFreezeThaw(scenario(i => i === -48 ? { liquidPrecipitationMm: null } : {}));
    assert.equal(result.status, 'analyzed');
    insufficient(scenario(i => i === -48 ? { temperatureC: null } : {}), 'missing_temperature');
  });

  it('rejects duplicate, fractional-hour, seconds-instead-of-ms and invalid valid times', () => {
    const input = thawRefreeze();
    insufficient({ ...input, hours: [...input.hours, input.hours[0]] }, 'duplicate_hour');
    for (const time of [ANCHOR_MS + 1, NaN, Infinity, ANCHOR_MS / 1000]) {
      insufficient({ ...input, hours: [{ ...input.hours[0], validAtMs: time }, ...input.hours.slice(1)] }, 'invalid_time');
    }
  });

  it('is deterministic with reordered input and never mutates the input', () => {
    const input = thawRefreeze();
    const before = structuredClone(input);
    input.hours.forEach(Object.freeze);
    Object.freeze(input.hours);
    Object.freeze(input);
    const first = analyzeFreezeThaw(input);
    assert.deepEqual(first, analyzeFreezeThaw({ ...input, hours: [...input.hours].reverse() }));
    assert.deepEqual(input, before);
    assert.deepEqual(first, analyzeFreezeThaw(input));
  });

  it('uses UTC elapsed hours across DST, equivalent offsets, and local midnight', () => {
    for (const iso of ['2026-03-08T01:00:00-05:00', '2026-11-01T01:00:00-04:00', '2026-01-01T00:00:00+09:00']) {
      const anchor = Date.parse(iso);
      const input = thawRefreeze();
      const delta = anchor - ANCHOR_MS;
      const result = analyzeFreezeThaw({ ...input, asOfMs: input.asOfMs + delta,
        source: { ...input.source!, fetchedAtMs: anchor },
        hours: input.hours.map(h => ({ ...h, validAtMs: h.validAtMs + delta })),
      });
      assert.equal(result.status, 'analyzed');
      assert.equal(result.window!.endMs - result.window!.startMs, 72 * HOUR_MS);
      assert.equal(result.signals[0].evidence[1].startMs, anchor + HOUR_MS);
    }
  });

  it('ignores extra provider hours rather than extending the specified horizon', () => {
    const input = scenario();
    assert.deepEqual(analyzeFreezeThaw({ ...input, hours: [...input.hours,
      { validAtMs: ANCHOR_MS + 25 * HOUR_MS, temperatureC: null, liquidPrecipitationMm: null },
    ] }), analyzeFreezeThaw(input));
  });

  it('requires fresh provenance without manufacturing model-run times', () => {
    const input = scenario();
    insufficient({ ...input, source: null }, 'missing_provenance');
    for (const fetchedAtMs of [null, NaN, input.asOfMs + 1]) {
      insufficient({ ...input, source: { ...input.source!, fetchedAtMs } }, 'missing_provenance');
    }
    insufficient({ ...input, source: { ...input.source!, fetchedAtMs: input.asOfMs - 30 * 60_000 - 1 } }, 'stale_input');
    assert.equal(analyzeFreezeThaw({ ...input, source: { ...input.source!, fetchedAtMs: input.asOfMs - 30 * 60_000 } }).status, 'analyzed');
    insufficient({ ...input, source: { ...input.source!, modelRunAtMs: input.asOfMs } }, 'invalid_model_run');
    insufficient({ ...input, source: { ...input.source!, modelRunAtMs: NaN } }, 'invalid_model_run');
    const knownRun = ANCHOR_MS - 6 * HOUR_MS;
    assert.equal(analyzeFreezeThaw({ ...input, source: { ...input.source!, modelRunAtMs: knownRun } }).provenance?.modelRunAtMs, knownRun);
    for (const asOfMs of [NaN, Infinity, 9e15]) insufficient({ ...input, asOfMs }, 'invalid_clock');
  });

  it('refuses unknown or mixed elevations instead of silently borrowing peak precipitation', () => {
    const input = thawRefreeze();
    for (const elevation of [
      { targetM: null, temperatureM: 1000, liquidPrecipitationM: 1000 },
      { targetM: 1000, temperatureM: NaN, liquidPrecipitationM: 1000 },
      { targetM: 1000, temperatureM: 800, liquidPrecipitationM: 1000 },
      { targetM: 1000, temperatureM: 1000, liquidPrecipitationM: 800 },
    ]) insufficient({ ...input, elevation }, 'invalid_elevation');
  });

  it('analyzes independently supplied base/peak estimates without applying a second lapse rate', () => {
    const base = thawRefreeze();
    const peak = scenario(() => ({ temperatureC: -4 }));
    assert.deepEqual(analyzeFreezeThaw({ ...base, elevation: { targetM: 0, temperatureM: 0, liquidPrecipitationM: 0 } }).signals.map(s => s.kind), ['thaw_then_freezing']);
    assert.deepEqual(analyzeFreezeThaw({ ...peak, elevation: { targetM: 1500, temperatureM: 1500, liquidPrecipitationM: 1500 } }).signals.map(s => s.kind), ['sustained_cold']);
  });
});
