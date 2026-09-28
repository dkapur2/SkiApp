import assert from 'node:assert/strict';
import { it } from 'node:test';
import { HIKING_DESTINATIONS } from '../src/data/hiking';
import { fetchHikingConditions } from '../src/services/openMeteo';
import type { OpenMeteoResponse } from '../src/types';
import { trailWeatherFixture } from './fixtures/trailWeather';

const oldRag = HIKING_DESTINATIONS[0];

it('uses NPS trail/summit points and USGS terrain samples, with Mid within 1 m of half the ascent', () => {
  // Curated NPS WGS84 vertices and EPQS values, retrieved 2026-09-28 UTC.
  // Full query URLs, feature IDs, DEM resolution/date and limitations are in docs/old-rag-hiking.md.
  const evidence = {
    base: { latitude: 38.571621859033364, longitude: -78.29415182143303, elevation: 284.501831055 },
    mid: { latitude: 38.558771993163596, longitude: -78.30137685986017, elevation: 640.254577637 },
    peak: { latitude: 38.55171255623068, longitude: -78.31460512850023, elevation: 997.218383789 },
  };
  for (const zone of ['base', 'mid', 'peak'] as const) {
    const point = oldRag.weather_points[zone];
    assert.ok(Math.abs(point.latitude - evidence[zone].latitude) < 0.000001);
    assert.ok(Math.abs(point.longitude - evidence[zone].longitude) < 0.000001);
    assert.ok(Math.abs(point.elevation - evidence[zone].elevation) < 0.1);
    assert.equal(oldRag[`${zone}_elevation`], point.elevation);
  }
  const { base, mid, peak } = oldRag.weather_points;
  assert.ok(Math.abs(mid.elevation - (base.elevation + peak.elevation) / 2) < 1);
  assert.ok(mid.elevation > peak.elevation / 2, 'midpoint includes trailhead elevation above sea level');
});

it('requests each coordinate and elevation, keeps point-specific values and never double-adjusts temperatures', async t => {
  const requests: URL[] = [];
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
    const url = new URL(String(input));
    requests.push(url);
    const elevation = Number(url.searchParams.get('elevation'));
    const data = trailWeatherFixture(elevation);
    const value = elevation === oldRag.base_elevation ? 45 : elevation === oldRag.mid_elevation ? 35 : 25;
    data.hourly.temperature_2m[0] = value;
    data.hourly.windspeed_10m[0] = value / 5;
    data.daily.temperature_2m_max[0] = value;
    data.daily.temperature_2m_min[0] = value - 10;
    return new Response(JSON.stringify(data));
  });
  const destination = { ...oldRag, id: 'distinct-points' };
  const conditions = await fetchHikingConditions(destination);
  assert.equal(requests.length, 3);
  assert.equal(new Set(requests.map(url => url.searchParams.get('latitude'))).size, 3);
  const first = conditions.next_12_hours[0];
  assert.deepEqual([first.base.temperature_f, first.mid.temperature_f, first.peak.temperature_f], [45, 35, 25]);
  assert.deepEqual([first.base.windspeed_mph, first.mid.windspeed_mph, first.peak.windspeed_mph], [9, 7, 5]);
  assert.deepEqual([first.base.rain_in, first.mid.rain_in, first.peak.rain_in], [null, null, null]);
  assert.equal(conditions.next_12_hours[1].mid.temperature_f, 0);
  assert.equal(conditions.next_12_hours[1].mid.rain_in, 0);
  assert.equal(conditions.forecast[0].mid.high_f, 35);
  assert.equal(conditions.weather_metadata.model_run_at, null);
  assert.deepEqual(await fetchHikingConditions(destination), conditions);
  assert.equal(requests.length, 3, 'the existing cache retains the whole cohort');
});

it('reports the oldest completion time in a three-point fetch without inventing model-run provenance', async t => {
  const start = Date.parse('2026-09-28T06:00:00Z');
  let completions = 0;
  t.mock.method(Date, 'now', () => start + completions * 1000);
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
    const data = trailWeatherFixture(Number(new URL(String(input)).searchParams.get('elevation')));
    // Resolution turns differ so each completion gets a distinct server timestamp.
    await new Promise(resolve => setImmediate(resolve));
    completions++;
    return new Response(JSON.stringify(data));
  });
  const data = await fetchHikingConditions({ ...oldRag, id: 'fetch-provenance' });
  assert.equal(data.weather_metadata.fetched_at, new Date(start + 1000).toISOString());
  assert.equal(data.weather_metadata.model_run_at, null);
});

it('rejects mixed elevations, units, missing values and mismatched time windows rather than mixing locations', async t => {
  const mutations: [string, (data: OpenMeteoResponse) => void][] = [
    ['wrong elevation', data => { data.elevation += 50; }],
    ['missing elevation', data => { data.elevation = null as unknown as number; }],
    ['wrong units', data => { data.hourly_units!.temperature_2m = '°C'; }],
    ['missing measurement', data => { data.hourly.temperature_2m.pop(); }],
    ['duplicate hour', data => { data.hourly.time[1] = data.hourly.time[0]; }],
    ['missing current hour', data => { data.hourly.time = data.hourly.time.map(time => time.replace(/^\d{4}/, '2000')); }],
    ['hourly window', data => { data.hourly.time[23] = data.hourly.time[23].replace(':00', ':30'); }],
    ['daily window', data => { data.daily.time[15] = '2099-01-01'; }],
    ['timezone', data => { data.utc_offset_seconds = 3600; }],
  ];
  let mutate: (data: OpenMeteoResponse) => void = () => {};
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
    const elevation = Number(new URL(String(input)).searchParams.get('elevation'));
    const data = trailWeatherFixture(elevation);
    if (elevation === oldRag.mid_elevation) mutate(data);
    return new Response(JSON.stringify(data));
  });
  for (const [name, change] of mutations) {
    mutate = change;
    await assert.rejects(fetchHikingConditions({ ...oldRag, id: `invalid-${name}` }), /[Tt]rail weather/);
  }
});

it('does not cache a partial failure or borrow summit data for a failed midpoint', async t => {
  let failMid = true;
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
    calls++;
    const elevation = Number(new URL(String(input)).searchParams.get('elevation'));
    const data = trailWeatherFixture(elevation);
    if (failMid && elevation === oldRag.mid_elevation) data.elevation = -1;
    return new Response(JSON.stringify(data));
  });
  const destination = { ...oldRag, id: 'retry-cohort' };
  await assert.rejects(fetchHikingConditions(destination), /elevation/);
  failMid = false;
  assert.equal((await fetchHikingConditions(destination)).next_12_hours[0].mid.elevation_ft, 2101);
  assert.equal(calls, 6);
});
