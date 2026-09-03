import type {
  DailyElevationData,
  DailyForecast,
  ElevationKey,
  HourlyElevationData,
  ResortConditions,
} from '@/api/contracts';

const STATE_NAMES: Record<string, string> = {
  CT: 'Connecticut',
  MA: 'Massachusetts',
  MD: 'Maryland',
  ME: 'Maine',
  NC: 'North Carolina',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NY: 'New York',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  TN: 'Tennessee',
  VA: 'Virginia',
  VT: 'Vermont',
  WV: 'West Virginia',
};

export function stateName(abbreviation: string): string {
  return STATE_NAMES[abbreviation] ?? abbreviation;
}

export function formatMeasurement(
  value: number | null | undefined,
  unit: string,
  fractionDigits = 0,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'Unavailable';
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
  return `${formatted}${unit}`;
}

export function formatDate(date: string, style: 'short' | 'long' = 'short'): string {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat('en-US', {
    weekday: style === 'long' ? 'long' : 'short',
    month: style === 'long' ? 'long' : 'short',
    day: 'numeric',
  }).format(parsed);
}

export function formatTime(time: string): string {
  const parsed = new Date(time);
  if (Number.isNaN(parsed.getTime())) return time;
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric' }).format(parsed);
}

export function formatAge(timestamp: number | string | null | undefined, now = Date.now()): string {
  if (timestamp === null || timestamp === undefined) return 'time unavailable';
  const parsed = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
  if (!Number.isFinite(parsed)) return 'time unavailable';
  const minutes = Math.max(0, Math.floor((now - parsed) / 60_000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} d ago`;
}

export function elevationLabel(key: ElevationKey): string {
  if (key === 'mid') return 'Mid';
  return key === 'base' ? 'Base' : 'Peak';
}

export function dailyAtElevation(
  day: DailyForecast | undefined,
  elevation: ElevationKey,
): DailyElevationData | null {
  return day?.[elevation] ?? null;
}

export function hourlyAtElevation(
  conditions: ResortConditions,
  elevation: ElevationKey,
): HourlyElevationData | null {
  return conditions.next_12_hours[0]?.[elevation] ?? null;
}

export function hasEnoughForecastData(
  conditions: ResortConditions,
  elevation: ElevationKey,
): boolean {
  const day = dailyAtElevation(conditions.forecast[0], elevation);
  const hour = hourlyAtElevation(conditions, elevation);
  if (!day && !hour) return false;
  const values = [
    day?.high_f,
    day?.low_f,
    day?.snowfall_in,
    day?.max_windspeed_mph,
    hour?.temperature_f,
    hour?.windspeed_mph,
  ];
  return values.some((value) => value !== null && value !== undefined);
}

export function weatherIsPartial(
  conditions: ResortConditions,
  elevation: ElevationKey,
): boolean {
  const day = dailyAtElevation(conditions.forecast[0], elevation);
  const hour = hourlyAtElevation(conditions, elevation);
  if (!day || !hour) return true;
  return [
    hour.temperature_f,
    hour.apparent_temperature_f,
    day.snowfall_in,
    day.max_windspeed_mph,
    day.min_visibility_mi,
    conditions.forecast[0]?.avg_freezing_level_ft,
  ].some((value) => value === null || value === undefined);
}

export function isWeatherDataStale(fetchedAt: string, now = Date.now()): boolean {
  const parsed = new Date(fetchedAt).getTime();
  return !Number.isFinite(parsed) || now - parsed > 30 * 60_000;
}
