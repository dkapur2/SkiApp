import type { ResortConditions, ResortMetadata } from '@/api/contracts';

export const resortCatalogFixture: ResortMetadata[] = [
  {
    id: 'elk-mountain',
    name: 'Elk Mountain',
    state: 'PA',
    latitude: 41.72,
    longitude: -75.55,
    base_elevation_ft: 1693,
    mid_elevation_ft: 2193,
    peak_elevation_ft: 2694,
  },
];

const hourlyElevation = (temperature: number, elevation: number) => ({
  elevation_ft: elevation,
  temperature_f: temperature,
  apparent_temperature_f: temperature - 4,
  windspeed_mph: 12,
  windgusts_mph: 21,
  snowfall_in: 0.2,
  rain_in: 0,
  precipitation_in: 0.02,
  snow_depth_in: 18,
  visibility_mi: 8,
});

const dailyElevation = (high: number, elevation: number) => ({
  elevation_ft: elevation,
  high_f: high,
  low_f: high - 10,
  apparent_high_f: high - 3,
  apparent_low_f: high - 13,
  max_windspeed_mph: 16,
  max_windgusts_mph: 27,
  snowfall_in: 1.4,
  rain_in: 0,
  precipitation_in: 0.14,
  max_snow_depth_in: 19,
  min_visibility_mi: 4.5,
});

export const resortConditionsFixture: ResortConditions = {
  resort: 'Elk Mountain',
  state: 'PA',
  next_12_hours: [
    {
      time: '2026-01-17T08:00:00-05:00',
      cloud_cover_pct: 68,
      freezing_level_ft: 2100,
      base: hourlyElevation(33, 1693),
      mid: hourlyElevation(28, 2193),
      peak: hourlyElevation(22, 2694),
    },
  ],
  forecast: Array.from({ length: 5 }, (_, index) => ({
    date: `2026-01-${17 + index}`,
    cloud_cover_avg_pct: 60,
    avg_freezing_level_ft: 2100,
    base: dailyElevation(35 - index, 1693),
    mid: dailyElevation(30 - index, 2193),
    peak: dailyElevation(25 - index, 2694),
  })),
  ski_conditions: null,
};
