import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { evaluateHourlySnapshot } from '../src/analysis/evaluateFreezeThaw';
import { runEvaluationCli } from '../src/cli/evaluateFreezeThaw';
import { MAX_SNAPSHOT_BYTES, type fetchOpenMeteoHourly } from '../src/services/openMeteoHourly';
import { hourlyFixture, providerThawRefreeze } from './fixtures/openMeteoHourly';

const noNetwork: typeof fetchOpenMeteoHourly = async () => { assert.fail('Offline invocation attempted a provider request'); };

test('offline CLI evaluates a historical snapshot and replays its own report identically without network or current time', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'ski-hourly-evaluation-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const snapshotPath = join(directory, 'snapshot.json');
  const reportPath = join(directory, 'report.json');
  const fixture = providerThawRefreeze();
  await writeFile(snapshotPath, JSON.stringify(fixture));
  const output: string[] = [];
  assert.equal(await runEvaluationCli(['--input', snapshotPath], text => output.push(text), noNetwork), 0);
  assert.deepEqual(JSON.parse(output[0]), evaluateHourlySnapshot(fixture));
  await writeFile(reportPath, output[0]);
  assert.equal(await runEvaluationCli(['--input', reportPath], text => output.push(text), noNetwork), 0);
  assert.equal(output[1], output[0]);
  assert.ok(output[0].includes('https://open-meteo.com/'));
  assert.ok(output[0].includes('not surface observations'));
});

test('CLI distinguishes abstention from malformed file, oversized file and missing opt-in', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'ski-hourly-invalid-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const inputPath = join(directory, 'input.json');
  const output: string[] = [];
  const write = (text: string) => { output.push(text); };
  await writeFile(inputPath, JSON.stringify(hourlyFixture(() => ({ temperature: null }))));
  assert.equal(await runEvaluationCli(['--input', inputPath], write, noNetwork), 2);
  assert.equal(JSON.parse(output[0]).analysis.status, 'insufficient_data');
  assert.deepEqual(JSON.parse(output[0]).analysis.signals, []);
  await writeFile(inputPath, '{');
  assert.equal(await runEvaluationCli(['--input', inputPath], write, noNetwork), 1);
  await writeFile(inputPath, ' '.repeat(MAX_SNAPSHOT_BYTES + 1));
  assert.equal(await runEvaluationCli(['--input', inputPath], write, noNetwork), 1);
  for (const args of [[], ['--live'], ['--input', inputPath, '--live'],
    ['--latitude', '43', '--longitude', '-72', '--elevation-m', '1000'],
    ['--live', '--latitude', '43', '--latitude', '44', '--elevation-m', '1000'],
    ['--live', '--latitude', 'NaN', '--longitude', '-72', '--elevation-m', '1000']]) {
    assert.equal(await runEvaluationCli(args, write, noNetwork), 1);
  }
  assert.equal(await runEvaluationCli(['--help'], write, noNetwork), 0);
});

test('only explicit live mode calls the capture function, once, and provider failure emits no analysis', async () => {
  const output: string[] = [];
  const args = ['--live', '--latitude', '43.6045', '--longitude', '-72.8201', '--elevation-m', '1000'];
  let calls = 0;
  assert.equal(await runEvaluationCli(args, text => output.push(text), async location => {
    calls++;
    assert.deepEqual(location, { latitude: 43.6045, longitude: -72.8201, elevationM: 1000 });
    return { status: 'captured', snapshot: providerThawRefreeze() };
  }), 0);
  assert.equal(calls, 1);
  assert.equal(JSON.parse(output[0]).status, 'analyzed');
  assert.equal(await runEvaluationCli(args, text => output.push(text), async () => ({ status: 'unavailable', reason: 'Provider unavailable' })), 1);
  assert.deepEqual(JSON.parse(output[1]), { status: 'unavailable', reason: 'Provider unavailable' });
});
