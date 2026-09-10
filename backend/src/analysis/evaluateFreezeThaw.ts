import { analyzeFreezeThaw, type FreezeThawResult } from './freezeThaw';
import { normalizeOpenMeteoHourly, type HourlyNormalization } from '../services/openMeteoHourly';

export const EVALUATION_VERSION = 'freeze-thaw-evaluation/0.1.0' as const;
export interface FreezeThawEvaluation {
  evaluationVersion: typeof EVALUATION_VERSION;
  status: 'analyzed' | 'insufficient_data';
  snapshot: unknown;
  normalization: HourlyNormalization;
  analysis: FreezeThawResult | null;
  attribution: { provider: string; licence: string; modifications: string };
}

/** Pure replay: the recorded asOfMs is used, never the current machine clock. */
export function evaluateHourlySnapshot(snapshot: unknown): FreezeThawEvaluation {
  const normalization = normalizeOpenMeteoHourly(snapshot);
  const analysis = normalization.status === 'normalized' ? analyzeFreezeThaw(normalization.input) : null;
  return {
    evaluationVersion: EVALUATION_VERSION, status: analysis?.status ?? 'insufficient_data',
    snapshot, normalization, analysis,
    attribution: {
      provider: 'https://open-meteo.com/', licence: 'https://creativecommons.org/licenses/by/4.0/',
      modifications: 'UTC window selection, rain + showers addition, and experimental freeze-thaw/0.1.0 analysis by SkiTheEast. Model estimates, not surface observations.',
    },
  };
}
