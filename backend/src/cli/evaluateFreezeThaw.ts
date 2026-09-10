import { open } from 'node:fs/promises';
import { EVALUATION_VERSION, evaluateHourlySnapshot } from '../analysis/evaluateFreezeThaw';
import { fetchOpenMeteoHourly, MAX_SNAPSHOT_BYTES } from '../services/openMeteoHourly';

const USAGE = 'Usage: evaluateFreezeThaw --input snapshot-or-report.json | --live --latitude NUMBER --longitude NUMBER --elevation-m NUMBER';

/** Importing this file never starts the runner. Exit 0 analyzed, 2 abstained, 1 usage/read/fetch failure. */
export async function runEvaluationCli(
  args: readonly string[], write: (text: string) => void,
  captureHourly: typeof fetchOpenMeteoHourly = fetchOpenMeteoHourly,
): Promise<number> {
  if (args.length === 1 && args[0] === '--help') { write(USAGE); return 0; }
  let snapshot: unknown;
  if (args.length === 2 && args[0] === '--input') {
    try {
      const file = await open(args[1], 'r');
      try {
        // Bound reads even if a file grows after stat; directories and oversized files are rejected.
        const stat = await file.stat();
        if (!stat.isFile() || stat.size > MAX_SNAPSHOT_BYTES) throw new Error('Invalid file');
        const bytes = Buffer.alloc(MAX_SNAPSHOT_BYTES + 1);
        let length = 0;
        while (length < bytes.length) {
          const { bytesRead } = await file.read(bytes, length, bytes.length - length, length);
          if (bytesRead === 0) break;
          length += bytesRead;
        }
        if (length > MAX_SNAPSHOT_BYTES) throw new Error('Oversized file');
        const value: unknown = JSON.parse(bytes.subarray(0, length).toString('utf8'));
        snapshot = typeof value === 'object' && value !== null && 'evaluationVersion' in value &&
          value.evaluationVersion === EVALUATION_VERSION && 'snapshot' in value ? value.snapshot : value;
      } finally { await file.close(); }
    } catch { write('Cannot read a valid snapshot/report JSON file within the 1 MiB limit.'); return 1; }
  } else if (args.length === 7 && args[0] === '--live') {
    const options = new Map<string, number>();
    for (let i = 1; i < args.length; i += 2) {
      if (!['--latitude', '--longitude', '--elevation-m'].includes(args[i]) || options.has(args[i]) ||
          !args[i + 1].trim() || !Number.isFinite(Number(args[i + 1]))) { write(USAGE); return 1; }
      options.set(args[i], Number(args[i + 1]));
    }
    const capture = await captureHourly({
      latitude: options.get('--latitude')!, longitude: options.get('--longitude')!, elevationM: options.get('--elevation-m')!,
    });
    if (capture.status === 'unavailable') { write(JSON.stringify(capture)); return 1; }
    snapshot = capture.snapshot;
  } else { write(USAGE); return 1; }
  const report = evaluateHourlySnapshot(snapshot);
  write(JSON.stringify(report, null, 2));
  return report.status === 'analyzed' ? 0 : 2;
}

if (require.main === module) {
  void runEvaluationCli(process.argv.slice(2), text => process.stdout.write(`${text}\n`))
    .then(code => { process.exitCode = code; })
    .catch(() => { process.stderr.write('Evaluation failed; no result was substituted.\n'); process.exitCode = 1; });
}
