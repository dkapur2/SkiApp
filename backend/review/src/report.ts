import { EVALUATION_VERSION, evaluateHourlySnapshot, type FreezeThawEvaluation } from '../../src/analysis/evaluateFreezeThaw';
import { HOUR_MS } from '../../src/services/openMeteoHourly';
import { RESORTS } from '../../src/data/resorts';

export const MAX_REPORT_BYTES = 4 * 1024 * 1024;
export const MAX_FILES = 30;
export const MAX_BATCH_BYTES = 32 * 1024 * 1024;
export type Origin = 'unverified' | 'provider' | 'synthetic';
export interface ReviewEntry {
  id: string;
  name: string;
  origin: Origin;
  septemberPipeline: boolean;
  report: FreezeThawEvaluation;
}

export function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// JSON is bounded by bytes, depth and nodes before recursive consistency checks.
function bounded(value: unknown, budget: { nodes: number }, depth = 0): boolean {
  if (++budget.nodes > 50_000 || depth > 32) return false;
  if (typeof value === 'number') return Number.isFinite(value);
  if (value === null || typeof value !== 'object') return true;
  return Object.values(value).every(child => bounded(child, budget, depth + 1));
}

function equal(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => equal(v, b[i]));
  if (!object(a) || !object(b)) return false;
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every(key => Object.hasOwn(b, key) && equal(a[key], b[key]));
}

/** No fetch or machine-clock refresh: verify the report by replaying its own capture. */
export function parseReport(text: string): FreezeThawEvaluation {
  if (new TextEncoder().encode(text).length > MAX_REPORT_BYTES) throw new Error('Report exceeds the 4 MiB file limit.');
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new Error('Invalid JSON. Choose a saved evaluation report, not a manifest or HTML page.'); }
  if (!bounded(value, { nodes: 0 })) throw new Error('Report is too deeply nested, too complex, or contains non-finite numbers.');
  if (!object(value) || value.evaluationVersion !== EVALUATION_VERSION) {
    throw new Error(`Expected ${EVALUATION_VERSION}. Raw snapshots, manifests and other versions are not supported.`);
  }
  const replay = evaluateHourlySnapshot(value.snapshot);
  if (!equal(value, replay)) {
    throw new Error('Report schema or replay mismatch: status, adapter/model version, inputs, reasons, signals and attribution must match the saved snapshot. Recreate it with the matching evaluation runner.');
  }
  return replay;
}

// Fingerprints of the nine retained Sept 16 captures, not raw provider data.
// Matching proves membership in that documented pipeline check, not authenticity or forecast skill.
const SEPTEMBER_HASHES = new Set([
  '5558a0e2e1da5feee0c499df4bf0caed787ea982888c3c74ef0b0641f376c979',
  '5540a08cd003db9a1e9c5899f68c11520eebd8f8e9c4dfda042296433e5d2873',
  '1c1b1b3746b5096b8f53a93e9f554d7f9e3d9cd619525d65bbee9e98204f9095',
  'e76925f3d23349e8159cfe29ee724231657c07ee0c152a67af364ecba9cfe42a',
  'f0b4a8d0ed6f741bf73a7f243f8e8ef9bfc197b2e4183864117ffc5a65fa40ff',
  'b526c01f85adabe47350d3515b8d705f6d4a7c8d693a95e597649fde03398c57',
  'da7263599420bb94974dbd650c20665370d2defa5d341a1d8c764548e8981448',
  'fd4601bd2b416f9246981973f7ebe0a47451c237643008020ab6e984d2651854',
  '03de8a84b79e8692810eaf0ad5df845a402fa8e8c610d2d901f4871a44f2057f',
]);

export function entryFor(report: FreezeThawEvaluation, name: string, digest: string, origin: Origin): ReviewEntry {
  const septemberPipeline = SEPTEMBER_HASHES.has(digest);
  return { id: digest, name, report, septemberPipeline, origin: septemberPipeline ? 'provider' : origin };
}

export function identity(entry: ReviewEntry): { location: string; elevation: string } {
  const snapshot = entry.report.snapshot;
  const request = object(snapshot) && object(snapshot.request) ? snapshot.request : {};
  const resort = RESORTS.find(r => r.latitude === request.latitude && r.longitude === request.longitude);
  const location = entry.origin === 'synthetic' ? 'Synthetic example site' : resort ? `${resort.name} · ${resort.state}` :
    typeof request.latitude === 'number' && typeof request.longitude === 'number' ? `Coordinate ${request.latitude}, ${request.longitude}` : 'Location unavailable';
  const level = resort && (['base', 'mid', 'peak'] as const).find(l => resort[`${l}_elevation`] === request.elevationM);
  const elevation = typeof request.elevationM === 'number' ? `${level ? level[0].toUpperCase() + level.slice(1) + ' · ' : ''}${request.elevationM} m` : 'Elevation unavailable';
  return { location, elevation };
}

export function utc(value: unknown): string {
  return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 8.64e15 ? new Date(value).toISOString().replace('.000Z', 'Z') : 'Unavailable';
}

export interface TimelineRow {
  atMs: number;
  temperatureC: number | null;
  liquidMm: number | null;
  missingHour: boolean;
  interval: string;
  period: string;
}

export function timeline(report: FreezeThawEvaluation): TimelineRow[] {
  if (report.normalization.status !== 'normalized' || !report.analysis?.window) return [];
  const { input } = report.normalization;
  const { startMs, endMs } = report.analysis.window;
  const byTime = new Map(input.hours.map(h => [h.validAtMs, h]));
  const rows: TimelineRow[] = [];
  for (let atMs = startMs; atMs <= endMs; atMs += HOUR_MS) {
    const hour = byTime.get(atMs);
    rows.push({ atMs, temperatureC: hour?.temperatureC ?? null, liquidMm: hour?.liquidPrecipitationMm ?? null,
      missingHour: !hour,
      interval: atMs === startMs ? 'Outside analysis window' : `(${utc(atMs - HOUR_MS)}, ${utc(atMs)}]`,
      period: atMs <= input.asOfMs ? 'Lookback model estimate' : atMs - HOUR_MS < input.asOfMs ? 'Future temperature; liquid interval straddles evaluation' : 'Future forecast',
    });
  }
  return rows;
}

export function originLabel(entry: ReviewEntry): string {
  if (entry.septemberPipeline) return 'Provider capture · September pipeline check';
  if (entry.origin === 'synthetic') return 'Synthetic example · invented weather inputs';
  if (entry.origin === 'provider') return 'Provider capture · operator-labeled, not authenticated';
  return 'Imported report · provenance unverified';
}
