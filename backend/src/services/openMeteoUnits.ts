/**
 * Open-Meteo returns these length measurements in feet when the forecast request
 * uses imperial temperature, wind, and precipitation units. Keep the conversions
 * explicit so feet are never accidentally treated as metres.
 */
export function feetToInches(value: number | null): number | null {
  return value === null ? null : Math.round(value * 12 * 100) / 100;
}

export function feetToMiles(value: number | null): number | null {
  return value === null ? null : Math.round((value / 5280) * 10) / 10;
}

export function roundFeet(value: number | null): number | null {
  return value === null ? null : Math.round(value);
}
