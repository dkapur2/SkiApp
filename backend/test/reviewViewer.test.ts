import assert from 'node:assert/strict';
import { once } from 'node:events';
import { request } from 'node:http';
import { test } from 'node:test';
import { example } from '../review/src/examples';
import { entryFor, identity, MAX_REPORT_BYTES, originLabel, parseReport, timeline } from '../review/src/report';
import { renderReport } from '../review/src/render';
import { createReviewServer, REVIEW_HOST } from '../review/server';
import { evaluateHourlySnapshot } from '../src/analysis/evaluateFreezeThaw';
import { hourlyFixture } from './fixtures/openMeteoHourly';

test('import validates a historical report by deterministic offline replay, independent of key order', () => {
  const report = example(0).report;
  const shuffled = Object.fromEntries(Object.entries(report).reverse());
  assert.deepEqual(parseReport(JSON.stringify(shuffled)), report);
  for (const mutate of [
    (r: typeof report) => { r.analysis!.signals = []; },
    (r: typeof report) => { r.status = 'insufficient_data'; },
    (r: typeof report) => { r.normalization.adapterVersion = 'next-version' as typeof r.normalization.adapterVersion; },
    (r: typeof report) => { r.attribution.provider = 'https://untrusted.invalid'; },
  ]) {
    const altered = structuredClone(report); mutate(altered);
    assert.throws(() => parseReport(JSON.stringify(altered)), /replay mismatch/);
  }
});

test('malformed, unsupported, oversized and deeply nested imports fail with actionable errors', () => {
  assert.throws(() => parseReport('<html>'), /Invalid JSON/);
  assert.throws(() => parseReport('{}'), /Expected freeze-thaw-evaluation/);
  assert.throws(() => parseReport(JSON.stringify(hourlyFixture())), /Raw snapshots/);
  assert.throws(() => parseReport(' '.repeat(MAX_REPORT_BYTES + 1)), /4 MiB/);
  assert.throws(() => parseReport('['.repeat(40) + '0' + ']'.repeat(40)), /deeply nested/);
  assert.throws(() => parseReport('{"large":1e400}'), /non-finite/);
});

test('examples remain separately labeled synthetic and exercise four distinct outcomes', () => {
  const results = [0, 1, 2, 3].map(example);
  assert.deepEqual(results.map(r => r.report.analysis!.signals.map(s => s.kind)), [['thaw_then_freezing'], ['rain_then_freezing'], ['sustained_cold'], []]);
  assert.equal(results[3].report.status, 'insufficient_data');
  for (const entry of results) {
    assert.match(originLabel(entry), /Synthetic/);
    assert.equal(identity(entry).location, 'Synthetic example site');
    assert.match(renderReport(entry), /timestamps are invented/);
    assert.deepEqual(parseReport(JSON.stringify(entry.report)), entry.report);
  }
  assert.throws(() => example(4), /Unknown/);
});

test('timelines retain exact UTC endpoints, preceding intervals, missing hours and null-versus-zero values', () => {
  const raw = hourlyFixture(offset => ({ temperature: offset === 1 ? null : 0, rain: offset === 2 ? null : 0 }));
  const report = evaluateHourlySnapshot(raw), rows = timeline(report);
  assert.equal(rows.length, 73);
  assert.equal(rows[0].interval, 'Outside analysis window');
  assert.equal(rows[48].temperatureC, 0);
  assert.equal(rows[49].temperatureC, null);
  assert.equal(rows[49].liquidMm, 0);
  assert.equal(rows[50].liquidMm, null);
  assert.match(rows[49].interval, /2026-03-08T06:00:00Z, 2026-03-08T07:00:00Z/);
  assert.match(rows[48].period, /Lookback model/);
  assert.match(rows[49].period, /straddles evaluation/);
  assert.equal(rows[50].period, 'Future forecast');
  for (const values of Object.values(raw.response.hourly)) values.splice(30, 1);
  const gapped = timeline(evaluateHourlySnapshot(raw));
  assert.equal(gapped.length, 73); assert.equal(gapped[29].missingHour, true);
  assert.equal(gapped[29].temperatureC, null);
});

test('rendered insufficient and no-pattern states cannot masquerade as safe conditions or zero weather', () => {
  const insufficient = renderReport(example(3), 48);
  assert.match(insufficient, /Insufficient data — analysis abstained/);
  assert.match(insufficient, /Temperature: Unavailable/);
  assert.match(insufficient, /0 mm/);
  assert.match(insufficient, /Server fetch time<\/dt><dd>Unavailable/);
  assert.match(insufficient, /Model-run time<\/dt><dd>Not provided/);
  assert.match(insufficient, /Surface conditions remain unknown/);
  const quiet = entryFor(evaluateHourlySnapshot(hourlyFixture()), 'quiet.json', 'unknown', 'unverified');
  const rendered = renderReport(quiet);
  assert.match(rendered, /No configured pattern/);
  assert.match(rendered, /never means good, safe, or ice-free/);
  assert.match(rendered, /provenance unverified/);
  assert.doesNotMatch(rendered, /September 16 pipeline check/);
});

test('provider label requires an operator assertion; September identity requires a matching fingerprint', () => {
  const report = evaluateHourlySnapshot(hourlyFixture());
  const renamed = entryFor(report, 'killington-base.json', 'different-bytes', 'unverified');
  assert.equal(renamed.septemberPipeline, false);
  assert.match(originLabel(entryFor(report, 'capture.json', 'operator-file', 'provider')), /not authenticated/);
  // This tests classification against the published manifest; the browser computes, never accepts, the digest.
  const recorded = entryFor(report, 'renamed.json', '5558a0e2e1da5feee0c499df4bf0caed787ea982888c3c74ef0b0641f376c979', 'unverified');
  assert.equal(recorded.septemberPipeline, true);
  assert.match(renderReport(recorded), /pipeline check · no qualifying events/);
});

test('real-capture resort/elevation identification uses exact request coordinates, not guessed grid centers or filenames', () => {
  const raw = hourlyFixture(); raw.request.latitude = 43.68; raw.request.longitude = -72.82; raw.request.elevationM = 822; raw.response.elevation = 822;
  const entry = entryFor(evaluateHourlySnapshot(raw), 'arbitrary.json', 'test', 'provider');
  assert.deepEqual(identity(entry), { location: 'Killington · VT', elevation: 'Mid · 822 m' });
  raw.request.latitude = 43.6801;
  assert.match(identity(entryFor(evaluateHourlySnapshot(raw), 'killington.json', 'test', 'provider')).location, /^Coordinate/);
});

test('untrusted filenames are escaped and rejected normalization shows reasons without inventing a timeline', () => {
  const raw = hourlyFixture(); raw.response.elevation = 999;
  const report = evaluateHourlySnapshot(raw);
  assert.deepEqual(parseReport(JSON.stringify(report)), report);
  const html = renderReport(entryFor(report, '<img src=x onerror=alert(1)>', 'test', 'unverified'));
  assert.match(html, /&lt;img/); assert.doesNotMatch(html, /<img/);
  assert.match(html, /invalid_elevation/); assert.match(html, /No valid timeline/);
  assert.doesNotMatch(html, /type="range"/);
});

test('plot scaling remains finite at large finite values and missing points break temperature lines', () => {
  const raw = hourlyFixture(h => ({ temperature: h === 1 ? null : h > 0 ? 1e308 : -1e308 }));
  const html = renderReport(entryFor(evaluateHourlySnapshot(raw), 'extreme.json', 'test', 'synthetic'));
  assert.doesNotMatch(html, /(?:cx|cy|x1|y1|x2|y2|height|width)="(?:NaN|Infinity|-Infinity)/);
  assert.equal((html.match(/class="temperature-line /g) ?? []).length, 70);
});

test('local server exposes only named assets, rejects uploads/origins/Host rebinding and disables network connections', async t => {
  const server = createReviewServer(); server.listen(0, REVIEW_HOST); await once(server, 'listening');
  t.after(() => new Promise<void>((resolve, reject) => { server.closeAllConnections(); server.close(e => e ? reject(e) : resolve()); }));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  const url = `http://${REVIEW_HOST}:${address.port}`;
  const page = await fetch(url); assert.equal(page.status, 200); assert.match(await page.text(), /No reports loaded/);
  assert.match(page.headers.get('content-security-policy')!, /connect-src 'none'/);
  assert.equal(page.headers.get('cache-control'), 'no-store');
  assert.equal((await fetch(url + '/observation-template.json')).status, 200);
  for (const file of ['/.env', '/.codex-log/evaluations/2026-09-16-pr12/manifest.json', '/backend/src/server.ts', '/?path=../../.env']) assert.equal((await fetch(url + file)).status, 404);
  assert.equal((await fetch(url, { method: 'POST', body: 'local file contents' })).status, 405);
  // fetch can discard a caller-supplied Host; send the raw header on this DNS-rebinding probe.
  const forgedHost = await new Promise<number | undefined>((resolve, reject) => {
    const probe = request(url, { headers: { Host: 'attacker.invalid' } }, response => { response.resume(); resolve(response.statusCode); });
    probe.on('error', reject); probe.end();
  });
  assert.equal(forgedHost, 403);
  assert.equal((await fetch(url, { headers: { Origin: 'https://attacker.invalid' } })).status, 403);
  assert.equal((await fetch(url, { headers: { 'Sec-Fetch-Site': 'cross-site' } })).status, 403);
});
