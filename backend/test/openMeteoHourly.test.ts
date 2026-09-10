import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyzeFreezeThaw } from '../src/analysis/freezeThaw';
import { evaluateHourlySnapshot } from '../src/analysis/evaluateFreezeThaw';
import {
  fetchOpenMeteoHourly, hourlyRequestUrl, normalizeOpenMeteoHourly,
  MAX_SNAPSHOT_BYTES, type HourlyIssueCode,
} from '../src/services/openMeteoHourly';
import { ANCHOR_MS, HOUR_MS } from './fixtures/freezeThaw';
import { hourlyFixture, providerThawRefreeze } from './fixtures/openMeteoHourly';

function rejected(value: unknown, code: HourlyIssueCode) {
  const result = normalizeOpenMeteoHourly(value);
  assert.equal(result.status, 'rejected');
  if (result.status === 'rejected') assert.equal(result.issue.code, code);
  assert.equal(evaluateHourlySnapshot(value).analysis, null);
}

test('explicit UTC/SI request spans the required endpoints plus a one-hour margin', () => {
  const fixture = hourlyFixture();
  const url = new URL(hourlyRequestUrl(fixture.request));
  assert.equal(url.origin + url.pathname, 'https://api.open-meteo.com/v1/forecast');
  assert.deepEqual(Object.fromEntries(url.searchParams), {
    latitude: '43.6045', longitude: '-72.8201', elevation: '1000',
    hourly: 'temperature_2m,rain,showers', temperature_unit: 'celsius', precipitation_unit: 'mm',
    timeformat: 'unixtime', timezone: 'GMT', start_hour: '2026-03-06T05:00', end_hour: '2026-03-09T07:00',
  });
  for (const change of [{ latitude: 91 }, { longitude: -181 }, { elevationM: NaN },
    { elevationM: 9001 }, { requestedAtMs: Infinity }]) {
    assert.throws(() => hourlyRequestUrl({ ...fixture.request, ...change }));
  }
});

test('normalizes 73 endpoints, preserves preceding-hour rain and reproduces thaw/refreeze evidence', () => {
  const fixture = providerThawRefreeze();
  const original = structuredClone(fixture);
  const result = normalizeOpenMeteoHourly(fixture);
  assert.equal(result.status, 'normalized');
  if (result.status !== 'normalized') return;
  assert.equal(result.input.hours.length, 73);
  assert.equal(result.input.hours[0].validAtMs, ANCHOR_MS - 48 * HOUR_MS);
  assert.equal(result.input.hours[0].liquidPrecipitationMm, null);
  assert.equal(result.input.hours[48].liquidPrecipitationMm, 0.5);
  const report = evaluateHourlySnapshot(fixture);
  assert.equal(report.status, 'analyzed');
  assert.deepEqual(report.analysis?.signals.map(s => s.kind), ['thaw_then_freezing', 'rain_then_freezing']);
  assert.deepEqual(report.analysis?.signals[1].evidence[0], { startMs: ANCHOR_MS - HOUR_MS, endMs: ANCHOR_MS });
  assert.equal(report.analysis?.signals[0].period, 'includes_forecast');
  assert.deepEqual(fixture, original);
  assert.deepEqual(evaluateHourlySnapshot(fixture), report);
});

test('temperature zero stays zero; either missing liquid component remains null even when the other is zero', () => {
  for (const components of [{ rain: null, showers: 0 }, { rain: 0, showers: null }]) {
    const fixture = hourlyFixture(offset => offset === 0 ? components : {});
    const result = normalizeOpenMeteoHourly(fixture);
    assert.equal(result.status, 'normalized');
    if (result.status !== 'normalized') continue;
    assert.equal(result.input.hours[48].temperatureC, 0);
    assert.equal(result.input.hours[48].liquidPrecipitationMm, null);
    const analysis = analyzeFreezeThaw(result.input);
    assert.equal(analysis.status, 'insufficient_data');
    assert.deepEqual(analysis.signals, []);
    assert.ok(analysis.reasons.some(r => r.code === 'missing_precipitation'));
  }
  const zero = evaluateHourlySnapshot(hourlyFixture());
  assert.equal(zero.status, 'analyzed');
  assert.equal(zero.analysis?.reasons[0].code, 'no_pattern');
});

test('sustained cold is context only; missing temperatures or endpoints suppress every signal', () => {
  const fixture = hourlyFixture(() => ({ temperature: -3 }));
  assert.deepEqual(evaluateHourlySnapshot(fixture).analysis?.signals.map(s => s.kind), ['sustained_cold']);
  fixture.response.hourly.temperature_2m[20] = null;
  assert.equal(evaluateHourlySnapshot(fixture).status, 'insufficient_data');
  const missing = providerThawRefreeze();
  for (const values of Object.values(missing.response.hourly)) values.splice(30, 1);
  const report = evaluateHourlySnapshot(missing);
  assert.equal(report.status, 'insufficient_data');
  assert.ok(report.analysis?.reasons.some(r => r.code === 'missing_hour'));
  assert.deepEqual(report.analysis?.signals, []);
});

test('does not shift a rain interval ending at cold onset into the preceding endpoint', () => {
  const fixture = hourlyFixture(offset => ({ temperature: offset === 1 || offset === 2 ? -2 : 0, showers: offset === 1 ? 1 : 0 }));
  assert.deepEqual(evaluateHourlySnapshot(fixture).analysis?.signals, []);
});

test('ignores the rain interval before the window but requires the last temperature endpoint', () => {
  const fixture = hourlyFixture(offset => offset === -48 ? { rain: null, showers: null } : {});
  assert.equal(evaluateHourlySnapshot(fixture).status, 'analyzed');
  for (const values of Object.values(fixture.response.hourly)) values.splice(73, 1);
  const report = evaluateHourlySnapshot(fixture);
  assert.equal(report.status, 'insufficient_data');
  assert.ok(report.analysis?.reasons.some(r => r.code === 'missing_hour' && r.atMs === ANCHOR_MS + 24 * HOUR_MS));
});

test('unordered aligned arrays normalize deterministically; duplicate or malformed times are rejected', () => {
  const fixture = providerThawRefreeze();
  const expected = normalizeOpenMeteoHourly(fixture);
  for (const values of Object.values(fixture.response.hourly)) values.reverse();
  assert.deepEqual(normalizeOpenMeteoHourly(fixture), expected);
  fixture.response.hourly.time[1] = fixture.response.hourly.time[0];
  rejected(fixture, 'duplicate_hour');
  for (const value of ['2026-03-08T06:00', null, NaN, ANCHOR_MS / 1000 + 1]) {
    const malformed = hourlyFixture();
    const times: unknown[] = malformed.response.hourly.time;
    times[49] = value;
    rejected(malformed, 'invalid_time');
  }
});

test('UTC selection stays 73 endpoints across DST, midnight and hour boundaries', () => {
  for (const anchor of ['2026-03-08T07:00:00Z', '2026-11-01T06:00:00Z', '2026-01-01T00:00:00Z']) {
    const fixture = hourlyFixture();
    const delta = Date.parse(anchor) - ANCHOR_MS;
    fixture.request.requestedAtMs += delta;
    fixture.fetchedAtMs += delta;
    fixture.asOfMs += delta;
    fixture.response.hourly.time = fixture.response.hourly.time.map(t => t + delta / 1000);
    assert.equal(evaluateHourlySnapshot(fixture).analysis?.window?.anchorMs, Date.parse(anchor));
    assert.equal(evaluateHourlySnapshot(fixture).analysis?.status, 'analyzed');
  }
  const crossing = hourlyFixture();
  crossing.request.requestedAtMs = ANCHOR_MS + HOUR_MS - 1000;
  crossing.asOfMs = crossing.fetchedAtMs = ANCHOR_MS + HOUR_MS + 1000;
  assert.equal(evaluateHourlySnapshot(crossing).analysis?.window?.endMs, ANCHOR_MS + 25 * HOUR_MS);
  assert.equal(evaluateHourlySnapshot(crossing).status, 'analyzed');
});

test('rejects local timezone, mixed units and elevation mismatch without relabeling data', () => {
  for (const changes of [{ timezone: 'America/New_York' }, { utc_offset_seconds: -18000 }]) {
    const f = hourlyFixture(); Object.assign(f.response, changes); rejected(f, 'invalid_timezone');
  }
  for (const changes of [{ time: 'iso8601' }, { temperature_2m: '°F' }, { rain: 'inch' }, { showers: '' }]) {
    const f = hourlyFixture(); Object.assign(f.response.hourly_units, changes); rejected(f, 'invalid_units');
  }
  for (const elevation of [null, 1000.01, 0, '1000']) {
    const f = hourlyFixture(); Object.assign(f.response, { elevation }); rejected(f, 'invalid_elevation');
  }
  const sea = hourlyFixture(); sea.request.elevationM = sea.response.elevation = 0;
  assert.equal(evaluateHourlySnapshot(sea).status, 'analyzed');
});

test('rejects malformed JSON shapes, misaligned arrays and invalid required measurements', () => {
  for (const value of [null, [], {}, { schemaVersion: 'other' }]) rejected(value, 'invalid_snapshot');
  for (const response of [null, [], { error: true }]) rejected({ ...hourlyFixture(), response }, 'invalid_response');
  const short = hourlyFixture(); short.response.hourly.rain.pop(); rejected(short, 'invalid_arrays');
  for (const value of [-1, Infinity, '0', undefined]) {
    const f = hourlyFixture(); const rain: unknown[] = f.response.hourly.rain; rain[49] = value;
    rejected(f, 'invalid_value');
  }
  const overflow = hourlyFixture(() => ({ rain: Number.MAX_VALUE, showers: Number.MAX_VALUE }));
  rejected(overflow, 'invalid_value');
});

test('fetch/run provenance never comes from generation duration or valid times; stale and missing captures abstain', () => {
  const f = hourlyFixture();
  const normalized = normalizeOpenMeteoHourly(f);
  assert.equal(normalized.status, 'normalized');
  if (normalized.status === 'normalized') assert.deepEqual(normalized.input.source, {
    provider: 'open-meteo', product: 'forecast', fetchedAtMs: f.fetchedAtMs, modelRunAtMs: null,
  });
  f.modelRunAtMs = ANCHOR_MS - 6 * HOUR_MS;
  assert.equal(evaluateHourlySnapshot(f).analysis?.provenance?.modelRunAtMs, f.modelRunAtMs);
  f.modelRunAtMs = f.fetchedAtMs + 1;
  rejected(f, 'invalid_provenance');
  rejected({ ...hourlyFixture(), fetchedAtMs: ANCHOR_MS - 1 }, 'invalid_provenance');
  rejected({ ...hourlyFixture(), fetchedAtMs: ANCHOR_MS + HOUR_MS }, 'invalid_provenance');
  rejected({ ...hourlyFixture(), fetchedAtMs: '2026-03-08T06:00:00Z' }, 'invalid_provenance');
  const missing = evaluateHourlySnapshot({ ...hourlyFixture(), fetchedAtMs: null });
  assert.equal(missing.status, 'insufficient_data');
  assert.ok(missing.analysis?.reasons.some(r => r.code === 'missing_provenance'));
  const stale = hourlyFixture(); stale.asOfMs = stale.fetchedAtMs + 30 * 60_000 + 1;
  assert.ok(evaluateHourlySnapshot(stale).analysis?.reasons.some(r => r.code === 'stale_input'));
  stale.asOfMs--;
  assert.equal(evaluateHourlySnapshot(stale).status, 'analyzed');
});

test('bounded capture makes one request, records actual completion and supplies no invented model run', async () => {
  const fixture = hourlyFixture();
  let calls = 0;
  const times = [fixture.request.requestedAtMs, fixture.fetchedAtMs];
  const result = await fetchOpenMeteoHourly(fixture.request, {
    now: () => times.shift()!,
    fetch: async (url, init) => {
      calls++;
      assert.equal(url, hourlyRequestUrl(fixture.request));
      assert.equal(init?.redirect, 'error');
      assert.ok(init?.signal instanceof AbortSignal);
      return Response.json(fixture.response);
    },
  });
  assert.equal(calls, 1);
  assert.equal(result.status, 'captured');
  if (result.status === 'captured') {
    assert.equal(result.snapshot.asOfMs, fixture.fetchedAtMs);
    assert.equal(result.snapshot.modelRunAtMs, null);
    assert.equal(evaluateHourlySnapshot(result.snapshot).status, 'analyzed');
  }
});

test('HTTP, transport, timeout, invalid JSON and oversize failures never substitute data or echo provider bodies', async () => {
  const failures: typeof fetch[] = [
    async () => new Response('sensitive provider error text', { status: 429 }),
    async () => { throw new Error('sensitive transport text'); },
    async () => { throw new DOMException('timed out', 'TimeoutError'); },
    async () => new Response('<html>not JSON</html>'),
    async () => new Response('x'.repeat(MAX_SNAPSHOT_BYTES + 1)),
  ];
  for (const fetchFailure of failures) {
    let calls = 0;
    const result = await fetchOpenMeteoHourly(hourlyFixture().request, {
      now: () => ANCHOR_MS, fetch: (...args) => { calls++; return fetchFailure(...args); },
    });
    assert.equal(calls, 1);
    assert.equal(result.status, 'unavailable');
    assert.ok(!JSON.stringify(result).includes('sensitive'));
    assert.ok(!('snapshot' in result));
  }
});
