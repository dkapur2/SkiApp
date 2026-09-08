import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { createContext, runInContext } from 'node:vm';

const html = readFileSync(resolve(__dirname, '../../frontend/index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);
const NOW = Date.parse('2026-09-08T18:00:00Z');

function fixture() {
  const elevation = {
    elevation_ft: 2000, temperature_f: null, apparent_temperature_f: null,
    windspeed_mph: null, windgusts_mph: null, snowfall_in: null, rain_in: null,
    snow_depth_in: null, visibility_mi: null, high_f: null, low_f: null,
    apparent_high_f: null, apparent_low_f: null, max_windspeed_mph: null,
    max_windgusts_mph: null, max_snow_depth_in: null, min_visibility_mi: null,
  };
  const zero = Object.fromEntries(Object.keys(elevation).map(key => [key, key === 'elevation_ft' ? 2000 : 0]));
  return {
    resort: 'Fixture Mountain', state: 'VT',
    weather_metadata: {source: 'open-meteo', fetched_at: '2026-09-08T17:55:00Z', model_run_at: null as string | null},
    ski_conditions: null as null | {source: string; fetched_at: string},
    next_12_hours: [
      {time: '2026-09-08T14:00', cloud_cover_pct: null, freezing_level_ft: null, base: elevation, mid: elevation, peak: elevation},
      {time: '2026-09-08T15:00', cloud_cover_pct: 0, freezing_level_ft: 0, base: zero, mid: zero, peak: zero},
    ],
    forecast: [
      {date: '2026-09-08', cloud_cover_avg_pct: null, avg_freezing_level_ft: null, base: elevation, mid: elevation, peak: elevation},
      {date: '2026-09-09', cloud_cover_avg_pct: 0, avg_freezing_level_ft: 0, base: zero, mid: zero, peak: zero},
    ],
  };
}

// Execute the shipped script with a small DOM sink. Assertions inspect HTML
// produced by the real selection/render functions, never source keywords.
async function page(payload: unknown) {
  const nodes = new Map<string, {innerHTML: string; value: string; style: Record<string, string>; classList: {add(): void; remove(): void}; addEventListener(): void}>();
  const node = (id: string) => {
    if (!nodes.has(id)) nodes.set(id, {innerHTML: '', value: '', style: {}, classList: {add() {}, remove() {}}, addEventListener() {}});
    return nodes.get(id)!;
  };
  const timers: (() => void)[] = [];
  const requests: string[] = [];
  let fail = false;
  const context = createContext({
    clock: NOW,
    window: {location: {hostname: 'skiapp-staging.up.railway.app', origin: 'https://skiapp-staging.up.railway.app'}},
    document: {getElementById: node, addEventListener() {}, querySelectorAll: () => []},
    setInterval: (callback: () => void) => timers.push(callback),
    fetch: async (url: string) => {
      requests.push(url);
      if (url.endsWith('/resorts/conditions')) return {ok: true, json: async () => [{id: 'fixture', name: 'Fixture Mountain', base_elevation_ft: 1000, mid_elevation_ft: 2000, peak_elevation_ft: 3000}]};
      assert.equal(url, 'https://skiapp-staging.up.railway.app/resorts/fixture/conditions');
      return {ok: !fail, status: fail ? 502 : 200, json: async () => payload};
    },
  });
  runInContext('Date.now = () => clock', context);
  runInContext(script!, context);
  await runInContext('init()', context);
  const select = () => runInContext('selectResort("fixture", "Fixture Mountain")', context) as Promise<void>;
  await select();
  return {
    node, requests, select,
    fail: () => { fail = true; },
    advance: (minutes: number) => { context.clock += minutes * 60_000; timers.forEach(callback => callback()); },
  };
}

describe('rendered web forecast', () => {
  it('renders linked attribution and the server timestamp after selecting a resort', async () => {
    const view = await page(fixture());
    const rendered = view.node('content').innerHTML;
    assert.match(rendered, /Weather source: Open-Meteo/);
    assert.match(rendered, /href="https:\/\/open-meteo.com\/"[^>]*>Weather data by Open-Meteo.com<\/a>/);
    assert.match(rendered, /href="https:\/\/creativecommons.org\/licenses\/by\/4.0\/"/);
    assert.match(rendered, /Elevation adjustments and unit conversions by SkiTheEast/);
    assert.match(rendered, /Weather server fetch: <time datetime="2026-09-08T17:55:00.000Z">/);
    assert.match(rendered, /Provider model run: Not provided/);
    assert.match(rendered, /Resort operations: Unavailable/);
    assert.ok(view.requests.every(url => url.startsWith('https://skiapp-staging.up.railway.app/')));
  });

  it('keeps supplied model and operations timestamps distinct from weather fetch time', async () => {
    const data = fixture();
    data.weather_metadata.model_run_at = '2026-09-08T12:00:00Z';
    data.ski_conditions = {source: 'ski-api', fetched_at: '2026-09-08T16:00:00Z'};
    const view = await page(data);
    const rendered = view.node('content').innerHTML;
    assert.match(rendered, /Provider model run: <time datetime="2026-09-08T12:00:00.000Z">/);
    assert.match(rendered, /Resort operations \(ski-api\): server fetch <time datetime="2026-09-08T16:00:00.000Z">/);
    assert.match(rendered, /Stale — fetched more than 30 minutes ago/);
    assert.match(rendered, /Weather server fetch:.*Fetched within the last 30 minutes/);
  });

  it('renders missing metadata as unavailable without inventing a source or timestamp', async () => {
    const data = {...fixture(), weather_metadata: undefined};
    const view = await page(data);
    const rendered = view.node('content').innerHTML;
    assert.match(rendered, /Weather source: Unavailable/);
    assert.match(rendered, /Weather server fetch: Unavailable/);
    assert.match(rendered, /Freshness unavailable/);
    assert.match(rendered, /Provider model run: Not provided/);
    assert.doesNotMatch(rendered, /<time|Weather data by|1970|Invalid Date/);
    assert.match(view.node('hourly-scroll').innerHTML, /Snow 0"/);
  });

  it('handles invalid and future timestamps without claiming fresh data or injecting markup', async () => {
    const data = fixture();
    data.weather_metadata.source = '<img src=x onerror=alert(1)>';
    data.weather_metadata.fetched_at = '';
    data.weather_metadata.model_run_at = 'invalid';
    data.ski_conditions = {source:'ski-api', fetched_at:'2026-09-09T18:00:00Z'};
    const rendered = (await page(data)).node('content').innerHTML;
    assert.match(rendered, /&lt;img/);
    assert.doesNotMatch(rendered, /<img|Fetched within|1970|Invalid Date/);
    assert.match(rendered, /ahead of this device; freshness unavailable/);
    assert.match(rendered, /Provider model run: Not provided/);
  });

  it('marks an already-open forecast stale as its actual fetch time ages', async () => {
    const view = await page(fixture());
    view.advance(26);
    const rendered = view.node('sources-freshness').innerHTML;
    assert.match(rendered, /Stale — fetched more than 30 minutes ago/);
    assert.match(rendered, /datetime="2026-09-08T17:55:00.000Z"/);
    assert.doesNotMatch(rendered, /Fetched within/);
  });

  it('renders unknown measurements as unavailable while preserving measured zeros', async () => {
    const view = await page(fixture());
    const hourly = view.node('hourly-scroll').innerHTML;
    const daily = view.node('forecast-grid').innerHTML;
    assert.match(hourly, /Snow — · Rain —/);
    assert.match(hourly, /Snow 0" · Rain 0"/);
    assert.match(hourly, /Gusts —/);
    assert.match(hourly, /Gusts 0 mph/);
    assert.match(daily, /temp-hi ">—<\/span>/);
    assert.match(daily, /temp-hi t-cold">0°<\/span>/);
    assert.match(daily, /class="day-cell wind-val">—<\/div>/);
    assert.match(daily, /class="day-cell wind-val">0 mph<\/div>/);
    assert.doesNotMatch(hourly + daily, /null°|null mph|undefined|NaN/);
  });

  it('shows a provider error instead of retaining a previous successful forecast', async () => {
    const view = await page(fixture());
    view.fail();
    await view.select();
    view.advance(60);
    const rendered = view.node('content').innerHTML;
    assert.match(rendered, /Failed to load conditions for Fixture Mountain: HTTP 502/);
    assert.doesNotMatch(rendered, /Weather server fetch|Snow 0|Sources &amp; freshness/);
  });
});
