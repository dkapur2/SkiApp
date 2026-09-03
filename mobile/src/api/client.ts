import { resortCatalogSchema, resortConditionsSchema } from '@/api/contracts';

const STAGING_API_BASE_URL = 'https://skiapp-staging.up.railway.app';
const REQUEST_TIMEOUT_MS = 15_000;

export type ApiErrorKind = 'configuration' | 'network' | 'http' | 'invalid-data';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly kind: ApiErrorKind,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');
  if (__DEV__) return STAGING_API_BASE_URL;
  throw new ApiError(
    'EXPO_PUBLIC_API_BASE_URL must be set for release builds.',
    'configuration',
  );
}

async function getJson(path: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new ApiError(`The forecast service returned ${response.status}.`, 'http', response.status);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const message = error instanceof Error && error.name === 'AbortError'
      ? 'The forecast request timed out.'
      : 'The forecast service could not be reached.';
    throw new ApiError(message, 'network');
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchResortCatalog() {
  const payload = await getJson('/resorts/conditions');
  const result = resortCatalogSchema.safeParse(payload);
  if (!result.success) {
    throw new ApiError('The resort list was not in the expected format.', 'invalid-data');
  }
  return result.data;
}

export async function fetchResortConditions(resortId: string) {
  const payload = await getJson(`/resorts/${encodeURIComponent(resortId)}/conditions`);
  const result = resortConditionsSchema.safeParse(payload);
  if (!result.success) {
    throw new ApiError('This forecast contained data the app could not safely display.', 'invalid-data');
  }
  return result.data;
}

export function isOfflineError(error: unknown): boolean {
  return error instanceof ApiError && error.kind === 'network';
}
