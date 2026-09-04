import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import request from 'supertest';

import { Cache } from '../src/cache';
import { RESORTS } from '../src/data/resorts';
import { app } from '../src/server';
import { fetchResortConditions } from '../src/services/openMeteo';
import { feetToInches, feetToMiles, roundFeet } from '../src/services/openMeteoUnits';
import {
  createWeatherMetadata,
  splitPrecipitationByPhase,
} from '../src/services/openMeteoSemantics';
import type { OpenMeteoResponse, Resort } from '../src/types';

describe('frontend API routing', () => {
  it('isolates Railway previews while preserving the production custom domain', () => {
    const frontend = readFileSync(resolve(__dirname, '../../frontend/index.html'), 'utf8');

    assert.match(frontend, /hostname\.endsWith\('\.up\.railway\.app'\)/);
    assert.match(frontend, /:\s*'https:\/\/skiapp-production-[\w-]*\.up\.railway\.app';/);
  });

  it('renders unknown forecast values distinctly from measured zero', () => {
    const frontend = readFileSync(resolve(__dirname, '../../frontend/index.html'), 'utf8');

    assert.match(frontend, /e\.snowfall_in == null \? '—'/);
    assert.match(frontend, /e\.rain_in == null \? '—'/);
    assert.match(frontend, /day\.cloud_cover_avg_pct == null/);
    assert.match(frontend, /snow == null \|\| rain == null \|\| cloud == null/);
  });
});

describe('provider-free API behavior', () => {
  it('reports service health without calling a provider', async () => {
    const response = await request(app).get('/health');

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { status: 'ok' });
  });

  it('returns the local resort catalog', async () => {
    const response = await request(app).get('/resorts/conditions');

    assert.equal(response.status, 200);
    assert.equal(response.body.length, RESORTS.length);
    assert.equal(response.body[0].id, RESORTS[0].id);
  });

  it('rejects an unknown resort before calling a provider', async () => {
    const response = await request(app).get('/resorts/not-a-resort/conditions');

    assert.equal(response.status, 404);
    assert.match(response.body.detail, /not-a-resort/);
  });

  it('rejects an incomplete recommendation before calling a provider', async () => {
    const response = await request(app).post('/recommend').send({});

    assert.equal(response.status, 400);
    assert.equal(response.body.detail, 'resort_name is required');
  });

  it('rejects a missing recommendation body before calling a provider', async () => {
    const response = await request(app).post('/recommend');

    assert.equal(response.status, 400);
    assert.equal(response.body.detail, 'resort_name is required');
  });

  it('rejects malformed JSON', async () => {
    const response = await request(app)
      .post('/recommend')
      .set('Content-Type', 'application/json')
      .send('{"resort_name":');

    assert.equal(response.status, 400);
  });

  it('returns JSON 404s for unmatched API routes', async () => {
    const response = await request(app).get('/resorts/not-an-api-route');

    assert.equal(response.status, 404);
    assert.match(response.headers['content-type'], /^application\/json/);
    assert.deepEqual(response.body, { detail: 'API route not found' });
  });

  it('serves the static frontend at the root, as an asset, and for nested app routes', async () => {
    for (const route of ['/', '/index.html', '/saved/mountains']) {
      const response = await request(app).get(route);

      assert.equal(response.status, 200);
      assert.match(response.headers['content-type'], /^text\/html/);
      assert.match(response.text, /<title>Ski Conditions<\/title>/);
    }
  });
});

describe('provider-backed route behavior without network access', () => {
  it('returns a known resort forecast with existing metadata and null semantics', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify(openMeteoFixture()), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

    try {
      const response = await request(app).get('/resorts/bear-creek/conditions');

      assert.equal(response.status, 200);
      assert.equal(response.body.resort, 'Bear Creek');
      assert.equal(response.body.weather_metadata.source, 'open-meteo');
      assert.equal(response.body.weather_metadata.model_run_at, null);
      assert.equal(response.body.next_12_hours[0].base.snowfall_in, null);
      assert.equal(response.body.next_12_hours[1].base.snowfall_in, 0);
      assert.equal(response.body.forecast[0].base.rain_in, null);
      assert.equal(response.body.forecast[1].base.rain_in, 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('converts an asynchronous weather-provider failure into a 502 response', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      throw new Error('provider unavailable');
    };

    try {
      const response = await request(app).get('/resorts/blue-knob/conditions');

      assert.equal(response.status, 502);
      assert.match(response.body.detail, /provider unavailable/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe('Cache', () => {
  it('returns a value while it is fresh', () => {
    let now = 1_000;
    const cache = new Cache<string>(30, () => now);

    cache.set('resort', 'fresh');
    now += 29_999;

    assert.equal(cache.get('resort'), 'fresh');
  });

  it('evicts a value after its TTL', () => {
    let now = 1_000;
    const cache = new Cache<string>(30, () => now);

    cache.set('resort', 'stale');
    now += 30_001;

    assert.equal(cache.get('resort'), null);
    assert.equal(cache.get('resort'), null);
  });
});

describe('Open-Meteo imperial length units', () => {
  it('normalizes feet without treating them as metres', () => {
    assert.equal(roundFeet(14_140.42), 14_140);
    assert.equal(feetToMiles(40_026.248), 7.6);
    assert.equal(feetToInches(1.5), 18);
  });

  it('preserves missing measurements', () => {
    assert.equal(roundFeet(null), null);
    assert.equal(feetToMiles(null), null);
    assert.equal(feetToInches(null), null);
  });
});

describe('weather response semantics', () => {
  it('keeps unknown precipitation distinct from measured zero', () => {
    assert.deepEqual(splitPrecipitationByPhase(null, 28), [null, null]);
    assert.deepEqual(splitPrecipitationByPhase(0.1, null), [null, null]);
    assert.deepEqual(splitPrecipitationByPhase(0, null), [0, 0]);
    assert.deepEqual(splitPrecipitationByPhase(0.1, 31), [1, 0]);
  });

  it('records the source and server fetch time without inventing a model run', () => {
    const metadata = createWeatherMetadata(new Date('2026-01-17T12:00:00.000Z'));

    assert.deepEqual(metadata, {
      source: 'open-meteo',
      fetched_at: '2026-01-17T12:00:00.000Z',
      model_run_at: null,
    });
  });

  it('preserves provider model-run metadata when it is available', () => {
    const metadata = createWeatherMetadata(
      new Date('2026-01-17T12:15:00.000Z'),
      '2026-01-17T12:00:00.000Z',
    );

    assert.equal(metadata.model_run_at, '2026-01-17T12:00:00.000Z');
  });

  it('emits metadata and null-safe values from a provider response without network access', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify(openMeteoFixture()), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

    const resort: Resort = {
      id: 'network-free-semantics-fixture',
      name: 'Fixture Mountain',
      state: 'VT',
      latitude: 44,
      longitude: -72,
      base_elevation: 400,
      mid_elevation: 500,
      peak_elevation: 600,
    };

    try {
      const conditions = await fetchResortConditions(resort);

      assert.equal(conditions.weather_metadata.source, 'open-meteo');
      assert.equal(Number.isNaN(Date.parse(conditions.weather_metadata.fetched_at)), false);
      assert.equal(conditions.weather_metadata.model_run_at, null);
      assert.equal(conditions.next_12_hours[0].base.snowfall_in, null);
      assert.equal(conditions.next_12_hours[1].base.snowfall_in, 0);
      assert.equal(conditions.forecast[0].base.rain_in, null);
      assert.equal(conditions.forecast[1].base.rain_in, 0);
      assert.equal(conditions.forecast[0].cloud_cover_avg_pct, null);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

function openMeteoFixture(): OpenMeteoResponse {
  const days = Array.from(
    { length: 16 },
    (_, index) => new Date(Date.UTC(2026, 0, 17 + index)).toISOString().slice(0, 10),
  );
  const hours = Array.from({ length: 24 }, (_, index) => `2026-01-17T${String(index).padStart(2, '0')}:00`);
  const hourlyValue = (first: number | null, second: number | null) =>
    hours.map((_, index) => index === 0 ? first : index === 1 ? second : 0);
  const dailyValue = (first: number | null, second: number | null) =>
    days.map((_, index) => index === 0 ? first : index === 1 ? second : 0);

  return {
    elevation: 500,
    utc_offset_seconds: 0,
    hourly: {
      time: hours,
      temperature_2m: hourlyValue(28, null),
      apparent_temperature: hourlyValue(26, null),
      windspeed_10m: hourlyValue(5, 0),
      windgusts_10m: hourlyValue(8, 0),
      snowfall: hourlyValue(null, 0),
      rain: hourlyValue(null, 0),
      precipitation: hourlyValue(null, 0),
      snow_depth: hourlyValue(null, 0),
      visibility: hourlyValue(null, 5_280),
      cloudcover: hours.map(() => null),
      freezinglevel_height: hourlyValue(null, 4_000),
    },
    daily: {
      time: days,
      temperature_2m_max: dailyValue(30, null),
      temperature_2m_min: dailyValue(26, null),
      apparent_temperature_max: dailyValue(28, null),
      apparent_temperature_min: dailyValue(24, null),
      windspeed_10m_max: dailyValue(5, 0),
      windgusts_10m_max: dailyValue(8, 0),
      snowfall_sum: dailyValue(null, 0),
      rain_sum: dailyValue(null, 0),
      precipitation_sum: dailyValue(null, 0),
    },
  };
}
