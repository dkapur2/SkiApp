import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import request from 'supertest';

import { Cache } from '../src/cache';
import { RESORTS } from '../src/data/resorts';
import { app } from '../src/server';

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
